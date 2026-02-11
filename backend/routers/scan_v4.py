"""
Distributed Scan Router (V4)
=============================
Multi-instance scan endpoints with distributed state.
Designed for 1M+ scans/minute with horizontal scaling.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel
from typing import Dict, Optional, List
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v4", tags=["Distributed Scan"])

# Instance identification
INSTANCE_ID = os.environ.get('HOSTNAME', os.environ.get('POD_NAME', 'local'))

# Dependencies (set during initialization)
_db = None
_cache = None
_processor = None


def set_dependencies(db, cache, processor):
    """Set dependencies for the router"""
    global _db, _cache, _processor
    _db = db
    _cache = cache
    _processor = processor


# ============== MODELS ==============

class ScanRequestV4(BaseModel):
    qr_data: str
    geo_location: Optional[Dict[str, float]] = None


class ScanResponseV4(BaseModel):
    scan_id: str
    status: str
    message: str
    entries_earned: int = 0
    processing_time_ms: float = 0
    instance_id: str = ""


class BatchScanRequestV4(BaseModel):
    scans: List[ScanRequestV4]


class BatchScanResponseV4(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[ScanResponseV4]
    instance_id: str


# ============== ENDPOINTS ==============

@router.post("/scan", response_class=ORJSONResponse)
async def scan_receipt_v4(request: Request, data: ScanRequestV4):
    """
    Distributed scan endpoint.
    Uses Redis for deduplication across all instances.
    """
    # Auth check
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(401, "Authentication required")
    
    user_id = str(user.get("_id", ""))
    
    # Rate limiting (distributed)
    is_limited, remaining, reset = await _cache.rate_limit_check(
        f"user:{user_id}:scan",
        limit=100,
        window=60
    )
    if is_limited:
        raise HTTPException(429, f"Rate limit exceeded. Remaining: {remaining}")
    
    # Process scan
    result = await _processor.process_scan(
        user_id=user_id,
        qr_data=data.qr_data,
        geo_location=data.geo_location
    )
    
    return ScanResponseV4(
        scan_id=result.scan_id,
        status=result.status,
        message=result.message,
        entries_earned=result.entries_earned,
        processing_time_ms=result.processing_time_ms,
        instance_id=result.instance_id
    )


@router.post("/scan/batch", response_class=ORJSONResponse)
async def scan_batch_v4(request: Request, data: BatchScanRequestV4):
    """
    Distributed batch scan endpoint.
    Processes up to 100 scans concurrently.
    """
    if len(data.scans) > 100:
        raise HTTPException(400, "Maximum 100 scans per batch")
    
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(401, "Authentication required")
    
    user_id = str(user.get("_id", ""))
    
    # Process batch
    results = await _processor.process_batch(
        user_id=user_id,
        scans=[{"qr_data": s.qr_data, "geo_location": s.geo_location} for s in data.scans]
    )
    
    successful = sum(1 for r in results if r.status == "valid")
    
    return BatchScanResponseV4(
        total=len(results),
        successful=successful,
        failed=len(results) - successful,
        results=[
            ScanResponseV4(
                scan_id=r.scan_id,
                status=r.status,
                message=r.message,
                entries_earned=r.entries_earned,
                processing_time_ms=r.processing_time_ms,
                instance_id=r.instance_id
            )
            for r in results
        ],
        instance_id=INSTANCE_ID
    )


@router.get("/stats")
async def get_distributed_stats():
    """Get distributed system statistics"""
    return {
        "instance_id": INSTANCE_ID,
        "processor": _processor.get_stats() if _processor else {},
        "cache": _cache.get_stats() if _cache else {},
        "cluster_info": await _cache.get_cluster_info() if _cache else {}
    }


@router.get("/leaderboard/{draw_id}")
async def get_draw_leaderboard(draw_id: str, limit: int = 100):
    """Get real-time leaderboard from distributed cache"""
    if limit > 1000:
        limit = 1000
    
    leaderboard = await _cache.get_leaderboard(draw_id, limit)
    
    return {
        "draw_id": draw_id,
        "entries": leaderboard,
        "instance_id": INSTANCE_ID
    }


@router.get("/health")
async def distributed_health():
    """Health check for distributed components"""
    cache_connected = _cache.is_connected if _cache else False
    processor_ready = _processor is not None
    
    return {
        "status": "healthy" if cache_connected and processor_ready else "degraded",
        "instance_id": INSTANCE_ID,
        "cache_connected": cache_connected,
        "processor_ready": processor_ready,
        "timestamp": datetime.utcnow().isoformat()
    }
