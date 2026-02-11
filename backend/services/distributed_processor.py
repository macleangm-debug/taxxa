"""
Multi-Instance Scan Processor
==============================
Distributed scan processing for horizontal scaling.
Works across multiple instances with shared state.
"""

import asyncio
import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import json
import os

logger = logging.getLogger(__name__)


@dataclass
class DistributedScanResult:
    scan_id: str
    status: str  # valid, invalid, duplicate, error
    message: str
    entries_earned: int = 0
    processing_time_ms: float = 0
    instance_id: str = ""


class DistributedScanProcessor:
    """
    Scan processor designed for multi-instance deployment.
    Uses distributed cache for deduplication and coordination.
    """
    
    def __init__(self):
        self.instance_id = os.environ.get('HOSTNAME', os.environ.get('POD_NAME', str(uuid.uuid4())[:8]))
        self._db = None
        self._cache = None
        self._stats = {
            "processed": 0,
            "valid": 0,
            "invalid": 0,
            "duplicates": 0,
            "errors": 0
        }
    
    async def initialize(self, db, cache):
        """Initialize with database and distributed cache"""
        self._db = db
        self._cache = cache
        logger.info(f"✅ Distributed scan processor initialized (instance: {self.instance_id})")
    
    async def process_scan(
        self,
        user_id: str,
        qr_data: str,
        geo_location: Optional[Dict] = None
    ) -> DistributedScanResult:
        """
        Process a single scan with distributed deduplication.
        """
        import time
        start_time = time.perf_counter()
        
        scan_id = str(uuid.uuid4())
        qr_hash = hashlib.sha256(qr_data.encode()).hexdigest()
        
        try:
            # 1. Distributed duplicate check
            is_duplicate = await self._cache.check_receipt_scanned(qr_hash)
            if is_duplicate:
                self._stats["duplicates"] += 1
                return DistributedScanResult(
                    scan_id=scan_id,
                    status="duplicate",
                    message="Receipt already scanned",
                    processing_time_ms=self._calc_time(start_time),
                    instance_id=self.instance_id
                )
            
            # 2. Acquire distributed lock for this receipt
            lock_token = await self._cache.acquire_lock(
                f"scan:{qr_hash}",
                timeout=5,
                blocking=True,
                blocking_timeout=2.0
            )
            
            try:
                # Double-check after lock (another instance might have processed)
                is_duplicate = await self._cache.check_receipt_scanned(qr_hash)
                if is_duplicate:
                    self._stats["duplicates"] += 1
                    return DistributedScanResult(
                        scan_id=scan_id,
                        status="duplicate",
                        message="Receipt already scanned",
                        processing_time_ms=self._calc_time(start_time),
                        instance_id=self.instance_id
                    )
                
                # 3. Verify receipt
                verification = self._verify_receipt(qr_data)
                
                if verification["valid"]:
                    entries = verification["entries"]
                    
                    # 4. Mark as scanned (distributed)
                    await self._cache.mark_receipt_scanned(qr_hash)
                    
                    # 5. Store scan record
                    scan_record = {
                        "scan_id": scan_id,
                        "user_id": user_id,
                        "receipt_hash": qr_hash,
                        "qr_data": qr_data,
                        "status": "valid",
                        "entries_earned": entries,
                        "timestamp": datetime.now(timezone.utc),
                        "geo_location": geo_location,
                        "instance_id": self.instance_id,
                        "verification": verification
                    }
                    
                    await self._db.scans.insert_one(scan_record)
                    
                    # 6. Update user stats (use distributed cache for aggregation)
                    await self._update_user_stats(user_id, entries)
                    
                    # 7. Update leaderboard
                    active_draws = await self._cache.get_active_draws()
                    if active_draws:
                        for draw in active_draws:
                            draw_id = draw.get("id") or str(draw.get("_id"))
                            await self._cache.update_leaderboard(draw_id, user_id, entries)
                    
                    self._stats["valid"] += 1
                    self._stats["processed"] += 1
                    
                    return DistributedScanResult(
                        scan_id=scan_id,
                        status="valid",
                        message=f"Receipt verified! +{entries} entries",
                        entries_earned=entries,
                        processing_time_ms=self._calc_time(start_time),
                        instance_id=self.instance_id
                    )
                else:
                    # Invalid receipt
                    self._stats["invalid"] += 1
                    self._stats["processed"] += 1
                    
                    return DistributedScanResult(
                        scan_id=scan_id,
                        status="invalid",
                        message=verification.get("reason", "Invalid receipt"),
                        processing_time_ms=self._calc_time(start_time),
                        instance_id=self.instance_id
                    )
                    
            finally:
                # Release lock
                if lock_token:
                    await self._cache.release_lock(f"scan:{qr_hash}", lock_token)
                    
        except Exception as e:
            self._stats["errors"] += 1
            logger.error(f"Scan processing error: {e}")
            return DistributedScanResult(
                scan_id=scan_id,
                status="error",
                message=str(e),
                processing_time_ms=self._calc_time(start_time),
                instance_id=self.instance_id
            )
    
    async def process_batch(
        self,
        user_id: str,
        scans: List[Dict]
    ) -> List[DistributedScanResult]:
        """Process multiple scans concurrently"""
        tasks = [
            self.process_scan(
                user_id=user_id,
                qr_data=scan["qr_data"],
                geo_location=scan.get("geo_location")
            )
            for scan in scans
        ]
        
        return await asyncio.gather(*tasks)
    
    def _verify_receipt(self, qr_data: str) -> Dict:
        """Fast receipt verification"""
        MERCHANTS = {
            "MER-001": ("SuperMart", True),
            "MER-002": ("City Electronics", True),
            "MER-003": ("Food Palace", True),
            "MER-004": ("Fashion Hub", True),
            "MER-005": ("Pharmacy Plus", True),
            "MER-006": ("Gas Station", False),
        }
        
        try:
            import orjson
            receipt = orjson.loads(qr_data)
        except:
            try:
                receipt = json.loads(qr_data)
            except:
                return {"valid": False, "reason": "invalid_json"}
        
        merchant_id = receipt.get("merchant_id")
        if not merchant_id or merchant_id not in MERCHANTS:
            return {"valid": False, "reason": "unregistered_merchant"}
        
        merchant_name, is_active = MERCHANTS[merchant_id]
        if not is_active:
            return {"valid": False, "reason": "suspended_merchant"}
        
        signature = receipt.get("signature", "")
        if len(signature) < 16:
            return {"valid": False, "reason": "invalid_signature"}
        
        amount = receipt.get("amount", 0)
        entries = max(1, int(amount / 50))
        
        return {
            "valid": True,
            "merchant_name": merchant_name,
            "entries": entries,
            "amount": amount
        }
    
    async def _update_user_stats(self, user_id: str, entries: int):
        """Update user stats with cache invalidation"""
        await self._db.users.update_one(
            {"_id": user_id},
            {"$inc": {"total_scans": 1, "valid_scans": 1, "total_entries": entries}}
        )
        await self._cache.invalidate_user(user_id)
    
    def _calc_time(self, start: float) -> float:
        import time
        return round((time.perf_counter() - start) * 1000, 2)
    
    def get_stats(self) -> Dict:
        """Get processor statistics"""
        return {
            "instance_id": self.instance_id,
            **self._stats
        }


# Global instance
distributed_processor = DistributedScanProcessor()
