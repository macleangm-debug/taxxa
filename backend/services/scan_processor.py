"""
High-Performance Scan Processing Service
=========================================
Optimized for 1M+ scans per minute using:
- Batch processing with async queues
- In-memory deduplication with Bloom filters
- Background workers for non-critical operations
- Connection pooling optimization
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Set
from collections import deque
from dataclasses import dataclass, field
import json
from bson import ObjectId
import mmh3  # MurmurHash for Bloom filter

logger = logging.getLogger(__name__)


# ============== BLOOM FILTER FOR DUPLICATE DETECTION ==============

class ScalableBloomFilter:
    """
    Memory-efficient Bloom filter for fast duplicate detection.
    Handles millions of receipts with minimal memory (~1.2MB per million items).
    False positive rate: ~1% (configurable)
    """
    
    def __init__(self, expected_items: int = 10_000_000, fp_rate: float = 0.01):
        """
        Initialize Bloom filter.
        
        Args:
            expected_items: Expected number of unique items
            fp_rate: Acceptable false positive rate (0.01 = 1%)
        """
        import math
        
        # Calculate optimal size and hash count
        self.size = int(-expected_items * math.log(fp_rate) / (math.log(2) ** 2))
        self.hash_count = int((self.size / expected_items) * math.log(2))
        
        # Use bytearray for memory efficiency
        self.bit_array = bytearray((self.size + 7) // 8)
        self.item_count = 0
        
        logger.info(f"Bloom filter initialized: {self.size:,} bits, {self.hash_count} hashes, "
                   f"~{len(self.bit_array) / 1024 / 1024:.2f}MB")
    
    def _get_hash_positions(self, item: str) -> List[int]:
        """Generate hash positions for an item"""
        h1 = mmh3.hash(item, 0) % self.size
        h2 = mmh3.hash(item, h1) % self.size
        
        positions = []
        for i in range(self.hash_count):
            positions.append((h1 + i * h2) % self.size)
        return positions
    
    def add(self, item: str) -> None:
        """Add item to filter"""
        for pos in self._get_hash_positions(item):
            byte_idx = pos // 8
            bit_idx = pos % 8
            self.bit_array[byte_idx] |= (1 << bit_idx)
        self.item_count += 1
    
    def might_contain(self, item: str) -> bool:
        """Check if item might be in filter (may have false positives)"""
        for pos in self._get_hash_positions(item):
            byte_idx = pos // 8
            bit_idx = pos % 8
            if not (self.bit_array[byte_idx] & (1 << bit_idx)):
                return False
        return True
    
    def get_stats(self) -> Dict:
        """Get filter statistics"""
        set_bits = sum(bin(byte).count('1') for byte in self.bit_array)
        return {
            "size_bits": self.size,
            "size_mb": len(self.bit_array) / 1024 / 1024,
            "hash_count": self.hash_count,
            "item_count": self.item_count,
            "fill_rate": set_bits / self.size if self.size > 0 else 0
        }


# ============== ASYNC BATCH PROCESSOR ==============

@dataclass
class ScanJob:
    """Represents a scan processing job"""
    job_id: str
    user_id: str
    qr_data: str
    geo_location: Optional[Dict] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    priority: int = 0  # Higher = more urgent
    
    def to_dict(self) -> Dict:
        return {
            "job_id": self.job_id,
            "user_id": self.user_id,
            "qr_data": self.qr_data,
            "geo_location": self.geo_location,
            "timestamp": self.timestamp.isoformat(),
            "priority": self.priority
        }


@dataclass
class BatchResult:
    """Result of batch processing"""
    processed: int = 0
    successful: int = 0
    duplicates: int = 0
    invalid: int = 0
    errors: int = 0
    duration_ms: float = 0


class AsyncBatchProcessor:
    """
    High-throughput batch processor for scan operations.
    Aggregates requests and processes in optimized batches.
    """
    
    def __init__(
        self,
        batch_size: int = 100,
        flush_interval: float = 0.1,  # 100ms
        max_queue_size: int = 10000
    ):
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.max_queue_size = max_queue_size
        
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=max_queue_size)
        self._results: Dict[str, asyncio.Future] = {}
        self._running = False
        self._worker_task: Optional[asyncio.Task] = None
        self._stats = {
            "total_processed": 0,
            "total_batches": 0,
            "avg_batch_size": 0,
            "avg_processing_time_ms": 0
        }
    
    async def start(self, process_func):
        """Start the batch processor"""
        self._running = True
        self._process_func = process_func
        self._worker_task = asyncio.create_task(self._worker_loop())
        logger.info("Batch processor started")
    
    async def stop(self):
        """Stop the batch processor"""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("Batch processor stopped")
    
    async def submit(self, job: ScanJob, timeout: float = 5.0) -> Dict:
        """
        Submit a job for processing.
        Returns result when batch is processed.
        """
        if self._queue.full():
            raise Exception("Queue full - system overloaded")
        
        # Create future for result
        future = asyncio.get_event_loop().create_future()
        self._results[job.job_id] = future
        
        # Add to queue
        await self._queue.put(job)
        
        # Wait for result with timeout
        try:
            result = await asyncio.wait_for(future, timeout=timeout)
            return result
        except asyncio.TimeoutError:
            self._results.pop(job.job_id, None)
            raise Exception("Processing timeout")
        finally:
            self._results.pop(job.job_id, None)
    
    async def _worker_loop(self):
        """Main worker loop - collects and processes batches"""
        while self._running:
            try:
                batch = []
                deadline = time.time() + self.flush_interval
                
                # Collect items until batch is full or timeout
                while len(batch) < self.batch_size:
                    remaining = deadline - time.time()
                    if remaining <= 0:
                        break
                    
                    try:
                        job = await asyncio.wait_for(
                            self._queue.get(),
                            timeout=remaining
                        )
                        batch.append(job)
                    except asyncio.TimeoutError:
                        break
                
                # Process batch if not empty
                if batch:
                    await self._process_batch(batch)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Batch worker error: {e}")
                await asyncio.sleep(0.1)
    
    async def _process_batch(self, batch: List[ScanJob]):
        """Process a batch of scan jobs"""
        start_time = time.time()
        
        try:
            # Call the actual processing function
            results = await self._process_func(batch)
            
            # Distribute results to waiting futures
            for job, result in zip(batch, results):
                if job.job_id in self._results:
                    future = self._results[job.job_id]
                    if not future.done():
                        future.set_result(result)
            
            # Update stats
            duration_ms = (time.time() - start_time) * 1000
            self._stats["total_processed"] += len(batch)
            self._stats["total_batches"] += 1
            self._stats["avg_batch_size"] = (
                self._stats["total_processed"] / self._stats["total_batches"]
            )
            self._stats["avg_processing_time_ms"] = (
                (self._stats["avg_processing_time_ms"] * (self._stats["total_batches"] - 1) + duration_ms)
                / self._stats["total_batches"]
            )
            
        except Exception as e:
            logger.error(f"Batch processing error: {e}")
            # Set error for all jobs
            for job in batch:
                if job.job_id in self._results:
                    future = self._results[job.job_id]
                    if not future.done():
                        future.set_exception(e)
    
    def get_stats(self) -> Dict:
        """Get processor statistics"""
        return {
            **self._stats,
            "queue_size": self._queue.qsize(),
            "pending_results": len(self._results),
            "is_running": self._running
        }


# ============== BACKGROUND TASK QUEUE ==============

class BackgroundTaskQueue:
    """
    Non-blocking queue for deferred operations.
    Used for operations that don't need immediate consistency:
    - User stats updates
    - Referral milestone checks
    - Analytics logging
    """
    
    def __init__(self, max_workers: int = 4, max_queue_size: int = 50000):
        self.max_workers = max_workers
        self.max_queue_size = max_queue_size
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=max_queue_size)
        self._workers: List[asyncio.Task] = []
        self._running = False
        self._stats = {
            "enqueued": 0,
            "processed": 0,
            "errors": 0
        }
    
    async def start(self):
        """Start background workers"""
        self._running = True
        for i in range(self.max_workers):
            task = asyncio.create_task(self._worker(i))
            self._workers.append(task)
        logger.info(f"Background task queue started with {self.max_workers} workers")
    
    async def stop(self):
        """Stop all workers"""
        self._running = False
        for task in self._workers:
            task.cancel()
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        logger.info("Background task queue stopped")
    
    async def enqueue(self, task_type: str, data: Dict, priority: int = 0) -> bool:
        """
        Enqueue a background task (non-blocking).
        Returns False if queue is full.
        """
        if self._queue.full():
            logger.warning(f"Background queue full, dropping {task_type}")
            return False
        
        try:
            self._queue.put_nowait({
                "type": task_type,
                "data": data,
                "priority": priority,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            self._stats["enqueued"] += 1
            return True
        except asyncio.QueueFull:
            return False
    
    async def _worker(self, worker_id: int):
        """Worker loop for processing background tasks"""
        while self._running:
            try:
                task = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                await self._process_task(task)
                self._stats["processed"] += 1
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background worker {worker_id} error: {e}")
                self._stats["errors"] += 1
    
    async def _process_task(self, task: Dict):
        """Process a single background task"""
        task_type = task["type"]
        data = task["data"]
        
        # Import here to avoid circular imports
        from .scan_processor_handlers import TASK_HANDLERS
        
        handler = TASK_HANDLERS.get(task_type)
        if handler:
            await handler(data)
        else:
            logger.warning(f"Unknown task type: {task_type}")
    
    def get_stats(self) -> Dict:
        """Get queue statistics"""
        return {
            **self._stats,
            "queue_size": self._queue.qsize(),
            "workers": len(self._workers),
            "is_running": self._running
        }


# ============== WRITE AGGREGATOR ==============

class WriteAggregator:
    """
    Aggregates database writes for batch operations.
    Instead of N individual writes, performs 1 bulk write.
    """
    
    def __init__(self, flush_interval: float = 0.5, max_pending: int = 500):
        self.flush_interval = flush_interval
        self.max_pending = max_pending
        
        self._pending_user_updates: Dict[str, Dict] = {}
        self._pending_draw_entries: Dict[str, Dict] = {}
        self._pending_scans: List[Dict] = []
        
        self._lock = asyncio.Lock()
        self._flush_task: Optional[asyncio.Task] = None
        self._running = False
        self._db = None
        
        self._stats = {
            "user_updates_batched": 0,
            "draw_entries_batched": 0,
            "scans_batched": 0,
            "flushes": 0
        }
    
    async def start(self, db):
        """Start the write aggregator"""
        self._db = db
        self._running = True
        self._flush_task = asyncio.create_task(self._flush_loop())
        logger.info("Write aggregator started")
    
    async def stop(self):
        """Stop and flush remaining writes"""
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        await self._flush_all()
        logger.info("Write aggregator stopped")
    
    async def increment_user_stats(
        self,
        user_id: str,
        total_scans: int = 0,
        valid_scans: int = 0,
        total_entries: int = 0
    ):
        """Aggregate user stats updates"""
        async with self._lock:
            if user_id not in self._pending_user_updates:
                self._pending_user_updates[user_id] = {
                    "total_scans": 0,
                    "valid_scans": 0,
                    "total_entries": 0
                }
            
            self._pending_user_updates[user_id]["total_scans"] += total_scans
            self._pending_user_updates[user_id]["valid_scans"] += valid_scans
            self._pending_user_updates[user_id]["total_entries"] += total_entries
            
            if len(self._pending_user_updates) >= self.max_pending:
                await self._flush_user_updates()
    
    async def increment_draw_entries(self, user_id: str, draw_id: str, entries: int):
        """Aggregate draw entry updates"""
        key = f"{user_id}:{draw_id}"
        async with self._lock:
            if key not in self._pending_draw_entries:
                self._pending_draw_entries[key] = {
                    "user_id": user_id,
                    "draw_id": draw_id,
                    "entries": 0
                }
            
            self._pending_draw_entries[key]["entries"] += entries
            
            if len(self._pending_draw_entries) >= self.max_pending:
                await self._flush_draw_entries()
    
    async def add_scan_record(self, scan: Dict):
        """Aggregate scan inserts"""
        async with self._lock:
            self._pending_scans.append(scan)
            
            if len(self._pending_scans) >= self.max_pending:
                await self._flush_scans()
    
    async def _flush_loop(self):
        """Periodic flush loop"""
        while self._running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_all()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Flush loop error: {e}")
    
    async def _flush_all(self):
        """Flush all pending writes"""
        await self._flush_user_updates()
        await self._flush_draw_entries()
        await self._flush_scans()
        self._stats["flushes"] += 1
    
    async def _flush_user_updates(self):
        """Batch flush user stats updates"""
        async with self._lock:
            if not self._pending_user_updates:
                return
            
            updates = self._pending_user_updates.copy()
            self._pending_user_updates.clear()
        
        try:
            from pymongo import UpdateOne
            
            operations = [
                UpdateOne(
                    {"_id": ObjectId(user_id)},
                    {"$inc": increments}
                )
                for user_id, increments in updates.items()
            ]
            
            if operations:
                await self._db.users.bulk_write(operations, ordered=False)
                self._stats["user_updates_batched"] += len(operations)
                
        except Exception as e:
            logger.error(f"User updates flush error: {e}")
    
    async def _flush_draw_entries(self):
        """Batch flush draw entry updates"""
        async with self._lock:
            if not self._pending_draw_entries:
                return
            
            entries = list(self._pending_draw_entries.values())
            self._pending_draw_entries.clear()
        
        try:
            from pymongo import UpdateOne
            
            operations = [
                UpdateOne(
                    {"user_id": entry["user_id"], "draw_id": entry["draw_id"]},
                    {"$inc": {"entries": entry["entries"]}},
                    upsert=True
                )
                for entry in entries
            ]
            
            if operations:
                await self._db.draw_entries.bulk_write(operations, ordered=False)
                self._stats["draw_entries_batched"] += len(operations)
                
        except Exception as e:
            logger.error(f"Draw entries flush error: {e}")
    
    async def _flush_scans(self):
        """Batch insert scans"""
        async with self._lock:
            if not self._pending_scans:
                return
            
            scans = self._pending_scans.copy()
            self._pending_scans.clear()
        
        try:
            if scans:
                await self._db.scans.insert_many(scans, ordered=False)
                self._stats["scans_batched"] += len(scans)
                
        except Exception as e:
            logger.error(f"Scans flush error: {e}")
    
    def get_stats(self) -> Dict:
        """Get aggregator statistics"""
        return {
            **self._stats,
            "pending_user_updates": len(self._pending_user_updates),
            "pending_draw_entries": len(self._pending_draw_entries),
            "pending_scans": len(self._pending_scans)
        }


# ============== GLOBAL INSTANCES ==============

# Bloom filter for duplicate detection (10M capacity)
receipt_bloom_filter = ScalableBloomFilter(expected_items=10_000_000, fp_rate=0.01)

# Batch processor for scans
scan_batch_processor = AsyncBatchProcessor(
    batch_size=100,
    flush_interval=0.05,  # 50ms
    max_queue_size=50000
)

# Background task queue
background_tasks = BackgroundTaskQueue(
    max_workers=4,
    max_queue_size=100000
)

# Write aggregator
write_aggregator = WriteAggregator(
    flush_interval=0.2,  # 200ms
    max_pending=500
)
