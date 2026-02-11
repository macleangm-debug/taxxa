"""
High-Performance Scan Router
=============================
Optimized scan endpoints for 1M+ scans/minute.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, Optional, List, Any
from datetime import datetime, timezone
import hashlib
import json
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2", tags=["High-Performance Scan"])

# Import services (lazy to avoid circular imports)
def get_services():
    from services.scan_processor import (
        receipt_bloom_filter,
        scan_batch_processor,
        background_tasks,
        write_aggregator,
        ScanJob
    )
    from services.cache_service import cache
    from services.rate_limiter import rate_limiter
    return {
        "bloom_filter": receipt_bloom_filter,
        "batch_processor": scan_batch_processor,
        "background_tasks": background_tasks,
        "write_aggregator": write_aggregator,
        "ScanJob": ScanJob,
        "cache": cache,
        "rate_limiter": rate_limiter
    }


# ============== MODELS ==============

class ScanRequestV2(BaseModel):
    qr_data: str
    geo_location: Optional[Dict[str, float]] = None
    client_timestamp: Optional[str] = None


class ScanResponseV2(BaseModel):
    scan_id: str
    status: str
    message: str
    entries_earned: int = 0
    receipt_data: Optional[Dict] = None
    processing_time_ms: Optional[float] = None


class BatchScanRequest(BaseModel):
    scans: List[ScanRequestV2]


class BatchScanResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[ScanResponseV2]


# ============== MOCK VERIFICATION (Same as original) ==============

REGISTERED_MERCHANTS = {
    "MER-001": {"name": "SuperMart", "tax_id": "TAX-001", "status": "active"},
    "MER-002": {"name": "City Electronics", "tax_id": "TAX-002", "status": "active"},
    "MER-003": {"name": "Food Palace", "tax_id": "TAX-003", "status": "active"},
    "MER-004": {"name": "Fashion Hub", "tax_id": "TAX-004", "status": "active"},
    "MER-005": {"name": "Pharmacy Plus", "tax_id": "TAX-005", "status": "active"},
    "MER-006": {"name": "Gas Station", "tax_id": "TAX-006", "status": "suspended"},
}


def verify_receipt_fast(receipt_data: dict) -> dict:
    """Fast receipt verification (mock)"""
    merchant_id = receipt_data.get("merchant_id")
    
    if merchant_id not in REGISTERED_MERCHANTS:
        return {"valid": False, "reason": "unregistered_merchant"}
    
    merchant = REGISTERED_MERCHANTS[merchant_id]
    if merchant["status"] != "active":
        return {"valid": False, "reason": "suspended_merchant"}
    
    signature = receipt_data.get("signature")
    if not signature or len(signature) < 16:
        return {"valid": False, "reason": "invalid_signature"}
    
    return {
        "valid": True,
        "merchant_name": merchant["name"],
        "tax_id": merchant["tax_id"]
    }


# ============== OPTIMIZED SCAN PROCESSING ==============

async def process_scan_batch(jobs: List[ScanJob], db) -> List[Dict]:
    """
    Process a batch of scans efficiently.
    Minimizes DB operations through batching.
    """
    results = []
    
    # Pre-check duplicates using Bloom filter
    non_duplicate_jobs = []
    for job in jobs:
        qr_hash = hashlib.sha256(job.qr_data.encode()).hexdigest()
        
        if receipt_bloom_filter.might_contain(qr_hash):
            # Potential duplicate - need DB check
            existing = await db.scans.find_one(
                {"receipt_hash": qr_hash, "status": "valid"},
                {"_id": 1}
            )
            if existing:
                results.append({
                    "job_id": job.job_id,
                    "status": "duplicate",
                    "message": "Receipt already scanned",
                    "entries_earned": 0
                })
                continue
        
        non_duplicate_jobs.append((job, qr_hash))
    
    # Process non-duplicates
    for job, qr_hash in non_duplicate_jobs:
        try:
            # Parse QR data
            try:
                receipt_data = json.loads(job.qr_data)
            except json.JSONDecodeError:
                receipt_data = {"raw_data": job.qr_data}
            
            # Verify receipt
            verification = verify_receipt_fast(receipt_data)
            
            if verification["valid"]:
                # Calculate entries
                amount = receipt_data.get("amount", 0)
                entries = max(1, int(amount / 50))
                
                # Add to Bloom filter
                receipt_bloom_filter.add(qr_hash)
                
                # Queue scan record for batch insert
                scan_record = {
                    "user_id": job.user_id,
                    "receipt_id": receipt_data.get("receipt_id", qr_hash[:16]),
                    "receipt_hash": qr_hash,
                    "qr_data": job.qr_data,
                    "geo_location": job.geo_location,
                    "timestamp": job.timestamp,
                    "status": "valid",
                    "entries_earned": entries,
                    "receipt_data": receipt_data,
                    "verification_result": verification
                }
                await write_aggregator.add_scan_record(scan_record)
                
                # Queue user stats update (async)
                await write_aggregator.increment_user_stats(
                    job.user_id,
                    total_scans=1,
                    valid_scans=1,
                    total_entries=entries
                )
                
                # Queue draw entries update
                active_draws = await cache.get_active_draws()
                if not active_draws:
                    active_draws = await db.draws.find({"status": "active"}).to_list(10)
                    await cache.set_active_draws([
                        {"id": str(d["_id"])} for d in active_draws
                    ])
                
                for draw in active_draws:
                    draw_id = draw.get("id") or str(draw.get("_id"))
                    await write_aggregator.increment_draw_entries(
                        job.user_id, draw_id, entries
                    )
                
                # Queue referral check (background)
                await background_tasks.enqueue(
                    "referral_check",
                    {"user_id": job.user_id, "valid_scans": 1}
                )
                
                results.append({
                    "job_id": job.job_id,
                    "status": "valid",
                    "message": f"Receipt verified! +{entries} entries",
                    "entries_earned": entries,
                    "receipt_data": {
                        **receipt_data,
                        "merchant_name": verification.get("merchant_name")
                    }
                })
            else:
                # Invalid receipt
                scan_record = {
                    "user_id": job.user_id,
                    "receipt_hash": qr_hash,
                    "qr_data": job.qr_data,
                    "geo_location": job.geo_location,
                    "timestamp": job.timestamp,
                    "status": "invalid",
                    "reason": verification.get("reason"),
                    "entries_earned": 0,
                    "receipt_data": receipt_data
                }
                await write_aggregator.add_scan_record(scan_record)
                
                await write_aggregator.increment_user_stats(
                    job.user_id,
                    total_scans=1
                )
                
                results.append({
                    "job_id": job.job_id,
                    "status": "invalid",
                    "message": verification.get("reason", "Invalid receipt"),
                    "entries_earned": 0
                })
                
        except Exception as e:
            logger.error(f"Scan processing error: {e}")
            results.append({
                "job_id": job.job_id,
                "status": "error",
                "message": str(e),
                "entries_earned": 0
            })
    
    return results


# ============== ENDPOINTS ==============

@router.post("/scan", response_model=ScanResponseV2)
async def scan_receipt_v2(
    request: Request,
    data: ScanRequestV2,
    db = None  # Injected via dependency
):
    """
    High-performance scan endpoint.
    Uses batch processing and async operations for maximum throughput.
    """
    import time
    start_time = time.time()
    
    # Get user from token (simplified - use your actual auth)
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = str(user["_id"])
    
    # Rate limiting
    is_limited, remaining, reset_time = await rate_limiter.check_rate_limit(
        user_id, "scan_receipt"
    )
    if is_limited:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {reset_time}s"
        )
    
    # Create job and submit to batch processor
    job = ScanJob(
        job_id=str(uuid.uuid4()),
        user_id=user_id,
        qr_data=data.qr_data,
        geo_location=data.geo_location
    )
    
    # Process via batch processor
    result = await scan_batch_processor.submit(job)
    
    processing_time = (time.time() - start_time) * 1000
    
    return ScanResponseV2(
        scan_id=job.job_id,
        status=result["status"],
        message=result["message"],
        entries_earned=result.get("entries_earned", 0),
        receipt_data=result.get("receipt_data"),
        processing_time_ms=round(processing_time, 2)
    )


@router.post("/scan/batch", response_model=BatchScanResponse)
async def scan_batch_v2(
    request: Request,
    data: BatchScanRequest,
    db = None
):
    """
    Batch scan endpoint for bulk processing.
    Accepts up to 100 scans per request.
    """
    if len(data.scans) > 100:
        raise HTTPException(
            status_code=400,
            detail="Maximum 100 scans per batch"
        )
    
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = str(user["_id"])
    
    # Create jobs
    jobs = [
        ScanJob(
            job_id=str(uuid.uuid4()),
            user_id=user_id,
            qr_data=scan.qr_data,
            geo_location=scan.geo_location
        )
        for scan in data.scans
    ]
    
    # Process batch directly
    results = await process_scan_batch(jobs, db)
    
    # Build response
    successful = sum(1 for r in results if r["status"] == "valid")
    
    return BatchScanResponse(
        total=len(results),
        successful=successful,
        failed=len(results) - successful,
        results=[
            ScanResponseV2(
                scan_id=r["job_id"],
                status=r["status"],
                message=r["message"],
                entries_earned=r.get("entries_earned", 0),
                receipt_data=r.get("receipt_data")
            )
            for r in results
        ]
    )


@router.get("/scan/stats")
async def get_scan_system_stats():
    """Get high-performance scan system statistics"""
    return {
        "bloom_filter": receipt_bloom_filter.get_stats(),
        "batch_processor": scan_batch_processor.get_stats(),
        "background_tasks": background_tasks.get_stats(),
        "write_aggregator": write_aggregator.get_stats()
    }
