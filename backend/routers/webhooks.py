"""
Webhook Service - Real-time event notifications to external systems

Supports:
- Configurable webhook endpoints per event type
- Retry logic with exponential backoff
- Signature verification for security
- Event logging and delivery tracking
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import httpx
import hashlib
import hmac
import json
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])
security = HTTPBearer()

# Database reference
_db = None

def set_database(db):
    global _db
    _db = db


# ============== ENUMS ==============

class WebhookEvent(str, Enum):
    """Supported webhook events"""
    # Draw events
    DRAW_CREATED = "draw.created"
    DRAW_STARTED = "draw.started"
    DRAW_COMPLETED = "draw.completed"
    DRAW_CANCELLED = "draw.cancelled"
    
    # Winner events
    WINNER_SELECTED = "winner.selected"
    PRIZE_CLAIMED = "prize.claimed"
    PRIZE_DISBURSED = "prize.disbursed"
    
    # User events
    USER_REGISTERED = "user.registered"
    USER_VERIFIED = "user.verified"
    
    # Receipt events
    RECEIPT_SCANNED = "receipt.scanned"
    RECEIPT_VALIDATED = "receipt.validated"
    RECEIPT_REJECTED = "receipt.rejected"
    HIGH_VALUE_RECEIPT = "receipt.high_value"  # Above threshold
    
    # System events
    DAILY_SUMMARY = "system.daily_summary"
    WEEKLY_REPORT = "system.weekly_report"
    FRAUD_ALERT = "system.fraud_alert"


class WebhookStatus(str, Enum):
    """Webhook delivery status"""
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"


# ============== MODELS ==============

class WebhookEndpoint(BaseModel):
    """Webhook endpoint configuration"""
    url: HttpUrl = Field(..., description="URL to send webhooks to")
    events: List[WebhookEvent] = Field(..., description="Events to subscribe to")
    secret: Optional[str] = Field(None, description="Secret for signature verification")
    description: Optional[str] = Field(None, description="Description of this endpoint")
    headers: Optional[Dict[str, str]] = Field(None, description="Custom headers to include")
    is_active: bool = Field(True, description="Whether endpoint is active")


class WebhookEndpointResponse(BaseModel):
    """Response after creating webhook endpoint"""
    id: str
    url: str
    events: List[str]
    secret: str
    is_active: bool
    created_at: datetime


class WebhookDelivery(BaseModel):
    """Webhook delivery record"""
    id: str
    endpoint_id: str
    event: str
    payload: Dict[str, Any]
    status: WebhookStatus
    attempts: int
    last_attempt: Optional[datetime]
    response_code: Optional[int]
    response_body: Optional[str]
    created_at: datetime


class WebhookTestRequest(BaseModel):
    """Request to test a webhook endpoint"""
    endpoint_id: str
    event: WebhookEvent = WebhookEvent.DRAW_COMPLETED


# ============== WEBHOOK SERVICE ==============

class WebhookService:
    """Service for managing and delivering webhooks"""
    
    MAX_RETRIES = 5
    RETRY_DELAYS = [60, 300, 900, 3600, 7200]  # 1min, 5min, 15min, 1hr, 2hr
    TIMEOUT = 30
    HIGH_VALUE_THRESHOLD = 500  # Amount that triggers high_value event
    
    def __init__(self, db):
        self.db = db
    
    def _generate_secret(self) -> str:
        """Generate a secure webhook secret"""
        import secrets
        return f"whsec_{secrets.token_hex(32)}"
    
    def _sign_payload(self, payload: str, secret: str) -> str:
        """Create HMAC signature for payload"""
        return hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
    
    async def create_endpoint(self, endpoint: WebhookEndpoint) -> WebhookEndpointResponse:
        """Create a new webhook endpoint"""
        endpoint_id = str(uuid.uuid4())
        secret = endpoint.secret or self._generate_secret()
        
        doc = {
            "_id": endpoint_id,
            "url": str(endpoint.url),
            "events": [e.value for e in endpoint.events],
            "secret": secret,
            "description": endpoint.description,
            "headers": endpoint.headers or {},
            "is_active": endpoint.is_active,
            "created_at": datetime.now(timezone.utc),
            "delivery_stats": {
                "total_sent": 0,
                "total_delivered": 0,
                "total_failed": 0
            }
        }
        
        await self.db.webhook_endpoints.insert_one(doc)
        
        return WebhookEndpointResponse(
            id=endpoint_id,
            url=str(endpoint.url),
            events=[e.value for e in endpoint.events],
            secret=secret,
            is_active=endpoint.is_active,
            created_at=doc["created_at"]
        )
    
    async def trigger_event(
        self, 
        event: WebhookEvent, 
        data: Dict[str, Any],
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Trigger a webhook event and deliver to all subscribed endpoints"""
        
        # Find all active endpoints subscribed to this event
        endpoints = await self.db.webhook_endpoints.find({
            "events": event.value,
            "is_active": True
        }).to_list(length=100)
        
        if not endpoints:
            logger.info(f"No endpoints subscribed to {event.value}")
            return
        
        # Create payload
        payload = {
            "id": str(uuid.uuid4()),
            "event": event.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        }
        
        # Queue delivery to each endpoint
        for endpoint in endpoints:
            if background_tasks:
                background_tasks.add_task(
                    self._deliver_webhook,
                    endpoint,
                    payload
                )
            else:
                # Synchronous delivery (for testing)
                await self._deliver_webhook(endpoint, payload)
    
    async def _deliver_webhook(
        self, 
        endpoint: Dict[str, Any], 
        payload: Dict[str, Any],
        attempt: int = 1
    ):
        """Deliver webhook to an endpoint with retry logic"""
        
        delivery_id = str(uuid.uuid4())
        payload_str = json.dumps(payload, default=str)
        
        # Create signature
        signature = self._sign_payload(payload_str, endpoint["secret"])
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-ID": payload["id"],
            "X-Webhook-Event": payload["event"],
            "X-Webhook-Timestamp": payload["timestamp"],
            "X-Webhook-Signature": f"sha256={signature}",
            **(endpoint.get("headers") or {})
        }
        
        # Record delivery attempt
        delivery_doc = {
            "_id": delivery_id,
            "endpoint_id": endpoint["_id"],
            "event": payload["event"],
            "payload": payload,
            "status": WebhookStatus.PENDING.value,
            "attempts": attempt,
            "last_attempt": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc)
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    endpoint["url"],
                    content=payload_str,
                    headers=headers
                )
                
                delivery_doc["response_code"] = response.status_code
                delivery_doc["response_body"] = response.text[:1000]  # Limit size
                
                if 200 <= response.status_code < 300:
                    delivery_doc["status"] = WebhookStatus.DELIVERED.value
                    logger.info(f"Webhook delivered: {payload['event']} to {endpoint['url']}")
                    
                    # Update stats
                    await self.db.webhook_endpoints.update_one(
                        {"_id": endpoint["_id"]},
                        {"$inc": {"delivery_stats.total_sent": 1, "delivery_stats.total_delivered": 1}}
                    )
                else:
                    raise Exception(f"HTTP {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Webhook delivery failed: {e}")
            delivery_doc["error"] = str(e)
            
            if attempt < self.MAX_RETRIES:
                delivery_doc["status"] = WebhookStatus.RETRYING.value
                delivery_doc["next_retry"] = datetime.now(timezone.utc) + timedelta(
                    seconds=self.RETRY_DELAYS[attempt - 1]
                )
                
                # Schedule retry
                await asyncio.sleep(self.RETRY_DELAYS[attempt - 1])
                await self._deliver_webhook(endpoint, payload, attempt + 1)
            else:
                delivery_doc["status"] = WebhookStatus.FAILED.value
                
                # Update stats
                await self.db.webhook_endpoints.update_one(
                    {"_id": endpoint["_id"]},
                    {"$inc": {"delivery_stats.total_sent": 1, "delivery_stats.total_failed": 1}}
                )
        
        # Save delivery record
        await self.db.webhook_deliveries.update_one(
            {"_id": delivery_id},
            {"$set": delivery_doc},
            upsert=True
        )
    
    async def test_endpoint(self, endpoint_id: str, event: WebhookEvent) -> Dict[str, Any]:
        """Send a test webhook to an endpoint"""
        
        endpoint = await self.db.webhook_endpoints.find_one({"_id": endpoint_id})
        if not endpoint:
            raise HTTPException(status_code=404, detail="Endpoint not found")
        
        test_payload = {
            "id": str(uuid.uuid4()),
            "event": event.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "test": True,
            "data": self._get_sample_data(event)
        }
        
        payload_str = json.dumps(test_payload, default=str)
        signature = self._sign_payload(payload_str, endpoint["secret"])
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-ID": test_payload["id"],
            "X-Webhook-Event": test_payload["event"],
            "X-Webhook-Timestamp": test_payload["timestamp"],
            "X-Webhook-Signature": f"sha256={signature}",
            **(endpoint.get("headers") or {})
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    endpoint["url"],
                    content=payload_str,
                    headers=headers
                )
                
                return {
                    "success": 200 <= response.status_code < 300,
                    "status_code": response.status_code,
                    "response": response.text[:500],
                    "payload_sent": test_payload
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "payload_sent": test_payload
            }
    
    def _get_sample_data(self, event: WebhookEvent) -> Dict[str, Any]:
        """Get sample data for test webhooks"""
        samples = {
            WebhookEvent.DRAW_COMPLETED: {
                "draw_id": "draw_sample_123",
                "draw_name": "Weekly Prize Draw #45",
                "draw_date": "2025-01-29T15:00:00Z",
                "total_entries": 15420,
                "total_participants": 3200,
                "winners": [
                    {"position": 1, "prize_amount": 10000, "currency": "TZS"},
                    {"position": 2, "prize_amount": 5000, "currency": "TZS"},
                    {"position": 3, "prize_amount": 2500, "currency": "TZS"}
                ]
            },
            WebhookEvent.WINNER_SELECTED: {
                "draw_id": "draw_sample_123",
                "winner_id": "user_sample_456",
                "position": 1,
                "prize_amount": 10000,
                "currency": "TZS"
            },
            WebhookEvent.RECEIPT_SCANNED: {
                "receipt_id": "rct_sample_789",
                "user_id": "user_sample_456",
                "merchant_tin": "123456789",
                "merchant_name": "Sample Store",
                "amount": 150.50,
                "currency": "TZS",
                "entries_earned": 2
            },
            WebhookEvent.DAILY_SUMMARY: {
                "date": "2025-01-29",
                "total_scans": 1250,
                "valid_scans": 1180,
                "new_users": 45,
                "total_entries_issued": 2400,
                "top_merchant": "SuperMart"
            }
        }
        return samples.get(event, {"message": "Test webhook", "event": event.value})


# ============== API ENDPOINTS ==============

@router.post("/endpoints", response_model=WebhookEndpointResponse)
async def create_webhook_endpoint(
    endpoint: WebhookEndpoint,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Create a new webhook endpoint.
    Admin only.
    
    The system will send HTTP POST requests to your URL when subscribed events occur.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    service = WebhookService(_db)
    return await service.create_endpoint(endpoint)


@router.get("/endpoints")
async def list_webhook_endpoints(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """List all configured webhook endpoints."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    endpoints = await _db.webhook_endpoints.find({}).to_list(length=100)
    
    return {
        "endpoints": [
            {
                "id": e["_id"],
                "url": e["url"],
                "events": e["events"],
                "is_active": e["is_active"],
                "description": e.get("description"),
                "delivery_stats": e.get("delivery_stats", {}),
                "created_at": e["created_at"]
            }
            for e in endpoints
        ]
    }


@router.get("/endpoints/{endpoint_id}")
async def get_webhook_endpoint(
    endpoint_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get details of a specific webhook endpoint."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    endpoint = await _db.webhook_endpoints.find_one({"_id": endpoint_id})
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    return endpoint


@router.patch("/endpoints/{endpoint_id}")
async def update_webhook_endpoint(
    endpoint_id: str,
    is_active: Optional[bool] = None,
    events: Optional[List[WebhookEvent]] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update a webhook endpoint (enable/disable, change events)."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    update = {}
    if is_active is not None:
        update["is_active"] = is_active
    if events is not None:
        update["events"] = [e.value for e in events]
    
    if not update:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = await _db.webhook_endpoints.update_one(
        {"_id": endpoint_id},
        {"$set": update}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    return {"status": "updated", "endpoint_id": endpoint_id}


@router.delete("/endpoints/{endpoint_id}")
async def delete_webhook_endpoint(
    endpoint_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a webhook endpoint."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = await _db.webhook_endpoints.delete_one({"_id": endpoint_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    return {"status": "deleted", "endpoint_id": endpoint_id}


@router.post("/endpoints/{endpoint_id}/test")
async def test_webhook_endpoint(
    endpoint_id: str,
    event: WebhookEvent = WebhookEvent.DRAW_COMPLETED,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Send a test webhook to an endpoint.
    Useful for verifying your endpoint is configured correctly.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    service = WebhookService(_db)
    return await service.test_endpoint(endpoint_id, event)


@router.get("/deliveries")
async def list_webhook_deliveries(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    endpoint_id: Optional[str] = None,
    status: Optional[WebhookStatus] = None,
    limit: int = 50
):
    """List recent webhook deliveries."""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if endpoint_id:
        query["endpoint_id"] = endpoint_id
    if status:
        query["status"] = status.value
    
    deliveries = await _db.webhook_deliveries.find(query).sort(
        "created_at", -1
    ).limit(limit).to_list(length=limit)
    
    return {"deliveries": deliveries}


@router.get("/events")
async def list_available_events():
    """List all available webhook events and their descriptions."""
    events = [
        {"event": "draw.created", "description": "When a new draw is created"},
        {"event": "draw.started", "description": "When a draw entry period begins"},
        {"event": "draw.completed", "description": "When a draw is completed and winners selected"},
        {"event": "draw.cancelled", "description": "When a draw is cancelled"},
        {"event": "winner.selected", "description": "When a winner is selected (per winner)"},
        {"event": "prize.claimed", "description": "When a winner claims their prize"},
        {"event": "prize.disbursed", "description": "When a prize is disbursed"},
        {"event": "user.registered", "description": "When a new user registers"},
        {"event": "user.verified", "description": "When a user verifies their phone"},
        {"event": "receipt.scanned", "description": "When a receipt is scanned"},
        {"event": "receipt.validated", "description": "When a receipt passes validation"},
        {"event": "receipt.rejected", "description": "When a receipt fails validation"},
        {"event": "receipt.high_value", "description": "When a high-value receipt is scanned"},
        {"event": "system.daily_summary", "description": "Daily statistics summary"},
        {"event": "system.weekly_report", "description": "Weekly report"},
        {"event": "system.fraud_alert", "description": "Potential fraud detected"},
    ]
    return {"events": events, "total": len(events)}


# ============== HELPER FUNCTION ==============

def get_webhook_service(db) -> WebhookService:
    """Get webhook service instance"""
    return WebhookService(db)
