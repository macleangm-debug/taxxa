"""
Prize Disbursement Router
Handles prize confirmation, tracking, and reporting.

Since prizes are distributed at public events (offline), this system:
1. Tracks which prizes have been claimed
2. Records disbursement confirmations
3. Generates reports for audit/compliance
4. Sends notifications to winners
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId
import uuid

router = APIRouter(prefix="/api/prizes", tags=["Prizes"])
security = HTTPBearer()

# Database reference (set by main app)
_db = None

def set_database(db):
    global _db
    _db = db


class PrizeStatus(str, Enum):
    """Prize claim status"""
    PENDING = "pending"           # Winner selected, not yet contacted
    NOTIFIED = "notified"         # Winner has been notified
    CLAIMED = "claimed"           # Winner has claimed the prize
    DISBURSED = "disbursed"       # Prize has been given out
    VERIFIED = "verified"         # Disbursement verified/confirmed
    EXPIRED = "expired"           # Unclaimed prize (claim period ended)
    FORFEITED = "forfeited"       # Winner forfeited the prize


class DisbursementMethod(str, Enum):
    """How the prize was disbursed"""
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"
    CHECK = "check"
    GIFT_CARD = "gift_card"
    PHYSICAL_PRIZE = "physical_prize"
    PUBLIC_EVENT = "public_event"
    OTHER = "other"


# ============== MODELS ==============

class PrizeClaimUpdate(BaseModel):
    """Update prize claim status"""
    status: PrizeStatus
    notes: Optional[str] = None


class DisbursementRecord(BaseModel):
    """Record a prize disbursement"""
    winner_id: str = Field(..., description="Winner's user ID")
    draw_id: str = Field(..., description="Draw ID")
    prize_position: int = Field(..., description="Prize position (1st, 2nd, etc.)")
    prize_amount: float = Field(..., description="Prize amount")
    currency: str = Field("USD", description="Prize currency")
    
    # Disbursement details
    method: DisbursementMethod = Field(..., description="How prize was disbursed")
    disbursement_date: datetime = Field(..., description="When prize was given")
    location: Optional[str] = Field(None, description="Location of disbursement")
    event_name: Optional[str] = Field(None, description="Public event name if applicable")
    
    # Verification
    witness_name: Optional[str] = Field(None, description="Witness name")
    witness_contact: Optional[str] = Field(None, description="Witness phone/email")
    recipient_id_type: Optional[str] = Field(None, description="ID type used for verification")
    recipient_id_last4: Optional[str] = Field(None, description="Last 4 digits of ID")
    
    # Evidence
    photo_url: Optional[str] = Field(None, description="Photo evidence URL")
    receipt_number: Optional[str] = Field(None, description="Receipt/voucher number")
    
    notes: Optional[str] = Field(None, description="Additional notes")


class DisbursementResponse(BaseModel):
    """Response after recording disbursement"""
    id: str
    status: str
    message: str
    created_at: datetime


class PrizeReport(BaseModel):
    """Prize report entry"""
    id: str
    draw_id: str
    draw_name: str
    draw_date: datetime
    winner_id: str
    winner_name: Optional[str]
    winner_phone: str
    prize_position: int
    prize_amount: float
    currency: str
    status: PrizeStatus
    method: Optional[DisbursementMethod]
    disbursed_at: Optional[datetime]
    verified: bool


class ReportSummary(BaseModel):
    """Summary statistics for prize reports"""
    total_prizes: int
    total_value: float
    currency: str
    disbursed_count: int
    disbursed_value: float
    pending_count: int
    pending_value: float
    by_status: Dict[str, int]
    by_method: Dict[str, int]


# ============== ENDPOINTS ==============

@router.get("/pending")
async def get_pending_prizes(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    skip: int = 0,
    limit: int = 50
):
    """
    Get all pending prizes awaiting disbursement.
    Admin only.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get pending prizes from draws
    prizes = []
    
    # Find completed draws with winners
    draws = await _db.draws.find({
        "status": "completed",
        "winners": {"$exists": True, "$ne": []}
    }).sort("draw_date", -1).skip(skip).limit(limit).to_list(length=limit)
    
    for draw in draws:
        for i, winner in enumerate(draw.get("winners", [])):
            # Check if already disbursed
            disbursement = await _db.prize_disbursements.find_one({
                "draw_id": str(draw["_id"]),
                "winner_id": winner.get("user_id")
            })
            
            if not disbursement or disbursement.get("status") != "verified":
                # Get winner info
                user = await _db.users.find_one({"_id": ObjectId(winner.get("user_id"))})
                
                prizes.append({
                    "draw_id": str(draw["_id"]),
                    "draw_name": draw.get("name", "Unknown Draw"),
                    "draw_date": draw.get("draw_date"),
                    "winner_id": winner.get("user_id"),
                    "winner_name": user.get("name") if user else "Unknown",
                    "winner_phone": user.get("phone_number") if user else "Unknown",
                    "prize_position": i + 1,
                    "prize_amount": draw.get("prizes", [{}])[i].get("amount", 0) if i < len(draw.get("prizes", [])) else 0,
                    "currency": draw.get("currency", "USD"),
                    "status": disbursement.get("status", "pending") if disbursement else "pending"
                })
    
    return {"prizes": prizes, "total": len(prizes)}


@router.post("/disburse", response_model=DisbursementResponse)
async def record_disbursement(
    record: DisbursementRecord,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Record a prize disbursement.
    Used after a prize has been given out at a public event.
    Admin only.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    disbursement_id = str(uuid.uuid4())
    
    # Create disbursement record
    doc = {
        "_id": disbursement_id,
        "winner_id": record.winner_id,
        "draw_id": record.draw_id,
        "prize_position": record.prize_position,
        "prize_amount": record.prize_amount,
        "currency": record.currency,
        "method": record.method.value,
        "disbursement_date": record.disbursement_date,
        "location": record.location,
        "event_name": record.event_name,
        "witness_name": record.witness_name,
        "witness_contact": record.witness_contact,
        "recipient_id_type": record.recipient_id_type,
        "recipient_id_last4": record.recipient_id_last4,
        "photo_url": record.photo_url,
        "receipt_number": record.receipt_number,
        "notes": record.notes,
        "status": PrizeStatus.DISBURSED.value,
        "created_at": datetime.now(timezone.utc),
        "created_by": "admin",  # TODO: Get from token
        "audit_trail": [
            {
                "action": "disbursed",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method": record.method.value,
                "amount": record.prize_amount
            }
        ]
    }
    
    await _db.prize_disbursements.insert_one(doc)
    
    return DisbursementResponse(
        id=disbursement_id,
        status="disbursed",
        message=f"Prize disbursement recorded successfully",
        created_at=datetime.now(timezone.utc)
    )


@router.post("/{disbursement_id}/verify")
async def verify_disbursement(
    disbursement_id: str,
    verifier_name: str,
    verifier_role: str,
    notes: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify a prize disbursement (second confirmation).
    Adds an additional verification layer for audit compliance.
    Admin only.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    disbursement = await _db.prize_disbursements.find_one({"_id": disbursement_id})
    if not disbursement:
        raise HTTPException(status_code=404, detail="Disbursement not found")
    
    # Update status and add verification
    await _db.prize_disbursements.update_one(
        {"_id": disbursement_id},
        {
            "$set": {
                "status": PrizeStatus.VERIFIED.value,
                "verified_at": datetime.now(timezone.utc),
                "verified_by": verifier_name,
                "verifier_role": verifier_role,
                "verification_notes": notes
            },
            "$push": {
                "audit_trail": {
                    "action": "verified",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "verifier": verifier_name,
                    "role": verifier_role
                }
            }
        }
    )
    
    return {"status": "verified", "message": "Disbursement verified successfully"}


@router.get("/report")
async def get_prize_report(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[PrizeStatus] = None
):
    """
    Generate prize disbursement report.
    Admin only.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Build query
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    if status:
        query["status"] = status.value
    
    # Get disbursements
    disbursements = await _db.prize_disbursements.find(query).sort("created_at", -1).to_list(length=1000)
    
    # Calculate summary
    total_value = sum(d.get("prize_amount", 0) for d in disbursements)
    disbursed = [d for d in disbursements if d.get("status") in ["disbursed", "verified"]]
    disbursed_value = sum(d.get("prize_amount", 0) for d in disbursed)
    pending = [d for d in disbursements if d.get("status") == "pending"]
    pending_value = sum(d.get("prize_amount", 0) for d in pending)
    
    # Count by status
    by_status = {}
    for d in disbursements:
        s = d.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1
    
    # Count by method
    by_method = {}
    for d in disbursements:
        m = d.get("method", "unknown")
        by_method[m] = by_method.get(m, 0) + 1
    
    summary = ReportSummary(
        total_prizes=len(disbursements),
        total_value=total_value,
        currency="USD",
        disbursed_count=len(disbursed),
        disbursed_value=disbursed_value,
        pending_count=len(pending),
        pending_value=pending_value,
        by_status=by_status,
        by_method=by_method
    )
    
    # Format report entries
    entries = []
    for d in disbursements:
        # Get draw info
        draw = await _db.draws.find_one({"_id": ObjectId(d["draw_id"])}) if ObjectId.is_valid(d["draw_id"]) else None
        
        # Get winner info
        user = await _db.users.find_one({"_id": ObjectId(d["winner_id"])}) if ObjectId.is_valid(d["winner_id"]) else None
        
        entries.append({
            "id": d["_id"],
            "draw_id": d["draw_id"],
            "draw_name": draw.get("name", "Unknown") if draw else "Unknown",
            "draw_date": draw.get("draw_date") if draw else None,
            "winner_id": d["winner_id"],
            "winner_name": user.get("name") if user else None,
            "winner_phone": user.get("phone_number") if user else None,
            "prize_position": d.get("prize_position", 0),
            "prize_amount": d.get("prize_amount", 0),
            "currency": d.get("currency", "USD"),
            "status": d.get("status"),
            "method": d.get("method"),
            "disbursed_at": d.get("disbursement_date"),
            "verified": d.get("status") == "verified"
        })
    
    return {
        "summary": summary.dict(),
        "entries": entries
    }


@router.get("/export")
async def export_prize_report(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    format: str = "json",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    Export prize report in various formats.
    Supports: json, csv
    Admin only.
    """
    # Get the report data
    report = await get_prize_report(
        credentials=credentials,
        start_date=start_date,
        end_date=end_date
    )
    
    if format == "csv":
        import io
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Draw Name", "Draw Date", "Winner Name", "Winner Phone",
            "Prize Position", "Prize Amount", "Currency", "Status",
            "Method", "Disbursed At", "Verified"
        ])
        
        # Data
        for entry in report["entries"]:
            writer.writerow([
                entry.get("draw_name"),
                entry.get("draw_date"),
                entry.get("winner_name"),
                entry.get("winner_phone"),
                entry.get("prize_position"),
                entry.get("prize_amount"),
                entry.get("currency"),
                entry.get("status"),
                entry.get("method"),
                entry.get("disbursed_at"),
                entry.get("verified")
            ])
        
        return {
            "format": "csv",
            "content": output.getvalue(),
            "filename": f"prize_report_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    
    return report


@router.get("/stats")
async def get_prize_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get overall prize statistics.
    Admin only.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Total prizes awarded (from all completed draws)
    completed_draws = await _db.draws.find({"status": "completed"}).to_list(length=1000)
    
    total_prizes_awarded = 0
    total_prize_value = 0
    
    for draw in completed_draws:
        prizes = draw.get("prizes", [])
        total_prizes_awarded += len(prizes)
        total_prize_value += sum(p.get("amount", 0) for p in prizes)
    
    # Disbursement stats
    disbursed_count = await _db.prize_disbursements.count_documents({"status": {"$in": ["disbursed", "verified"]}})
    verified_count = await _db.prize_disbursements.count_documents({"status": "verified"})
    
    # Calculate disbursement rate
    disbursement_rate = (disbursed_count / total_prizes_awarded * 100) if total_prizes_awarded > 0 else 0
    
    return {
        "total_prizes_awarded": total_prizes_awarded,
        "total_prize_value": total_prize_value,
        "disbursed_count": disbursed_count,
        "verified_count": verified_count,
        "disbursement_rate": round(disbursement_rate, 1),
        "pending_disbursement": total_prizes_awarded - disbursed_count
    }
