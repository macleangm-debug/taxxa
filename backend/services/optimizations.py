"""
Advanced Performance Optimizations
===================================
Code-level optimizations to maximize throughput before horizontal scaling.
Target: Squeeze maximum performance from single instance.
"""

import asyncio
import functools
import hashlib
import lz4.frame  # Fast compression
import orjson  # Faster JSON parsing
import logging
from typing import Dict, List, Optional, Any, Callable, TypeVar
from datetime import datetime, timezone
from collections import OrderedDict
from dataclasses import dataclass
import time
import weakref

logger = logging.getLogger(__name__)

T = TypeVar('T')


# ============== 1. LRU CACHE WITH TTL ==============

class TTLCache:
    """
    Thread-safe LRU cache with TTL expiration.
    Much faster than Redis for hot data.
    """
    
    def __init__(self, maxsize: int = 10000, ttl_seconds: int = 60):
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict = OrderedDict()
        self._timestamps: Dict[str, float] = {}
        self._lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0
    
    async def get(self, key: str) -> Optional[Any]:
        """Get item from cache"""
        async with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            # Check TTL
            if time.time() - self._timestamps[key] > self.ttl_seconds:
                del self._cache[key]
                del self._timestamps[key]
                self._misses += 1
                return None
            
            # Move to end (LRU)
            self._cache.move_to_end(key)
            self._hits += 1
            return self._cache[key]
    
    async def set(self, key: str, value: Any) -> None:
        """Set item in cache"""
        async with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            else:
                if len(self._cache) >= self.maxsize:
                    # Remove oldest
                    oldest_key = next(iter(self._cache))
                    del self._cache[oldest_key]
                    del self._timestamps[oldest_key]
            
            self._cache[key] = value
            self._timestamps[key] = time.time()
    
    async def delete(self, key: str) -> None:
        """Delete item from cache"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                del self._timestamps[key]
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total = self._hits + self._misses
        return {
            "size": len(self._cache),
            "maxsize": self.maxsize,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total * 100, 2) if total > 0 else 0
        }


# ============== 2. REQUEST COALESCING ==============

class RequestCoalescer:
    """
    Coalesces identical concurrent requests into single execution.
    Prevents thundering herd on cache misses.
    """
    
    def __init__(self):
        self._pending: Dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()
        self._coalesced_count = 0
    
    async def execute(
        self,
        key: str,
        func: Callable[[], Any],
        ttl: float = 1.0
    ) -> Any:
        """
        Execute function, coalescing identical requests.
        """
        async with self._lock:
            if key in self._pending:
                self._coalesced_count += 1
                # Wait for existing request
                return await self._pending[key]
            
            # Create new future
            future = asyncio.get_event_loop().create_future()
            self._pending[key] = future
        
        try:
            # Execute the function
            result = await func()
            future.set_result(result)
            return result
        except Exception as e:
            future.set_exception(e)
            raise
        finally:
            # Cleanup after TTL
            asyncio.get_event_loop().call_later(
                ttl,
                lambda: self._pending.pop(key, None)
            )
    
    def get_stats(self) -> Dict:
        return {
            "pending_requests": len(self._pending),
            "coalesced_requests": self._coalesced_count
        }


# ============== 3. CONNECTION POOL OPTIMIZER ==============

class ConnectionPoolOptimizer:
    """
    Optimizes database connection usage with connection warming
    and intelligent pool management.
    """
    
    def __init__(self, db_client, min_connections: int = 10):
        self._client = db_client
        self._min_connections = min_connections
        self._warmed = False
    
    async def warm_connections(self):
        """Pre-warm connection pool on startup"""
        if self._warmed:
            return
        
        logger.info(f"Warming {self._min_connections} database connections...")
        
        # Execute parallel pings to establish connections
        tasks = [
            self._client.admin.command('ping')
            for _ in range(self._min_connections)
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        self._warmed = True
        logger.info("Connection pool warmed")
    
    async def health_check(self) -> Dict:
        """Check connection pool health"""
        try:
            start = time.time()
            await self._client.admin.command('ping')
            latency = (time.time() - start) * 1000
            
            return {
                "healthy": True,
                "latency_ms": round(latency, 2),
                "warmed": self._warmed
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "warmed": self._warmed
            }


# ============== 4. FAST JSON SERIALIZATION ==============

class FastJSON:
    """
    Optimized JSON serialization using orjson.
    3-10x faster than standard json module.
    """
    
    @staticmethod
    def dumps(obj: Any) -> bytes:
        """Serialize to JSON bytes"""
        return orjson.dumps(
            obj,
            option=orjson.OPT_SERIALIZE_NUMPY | orjson.OPT_UTC_Z
        )
    
    @staticmethod
    def loads(data: bytes) -> Any:
        """Deserialize from JSON"""
        return orjson.loads(data)
    
    @staticmethod
    def dumps_str(obj: Any) -> str:
        """Serialize to JSON string"""
        return orjson.dumps(obj).decode('utf-8')


# ============== 5. RESPONSE COMPRESSION ==============

class ResponseCompressor:
    """
    LZ4 compression for large responses.
    Much faster than gzip with good compression ratio.
    """
    
    COMPRESSION_THRESHOLD = 1024  # Bytes
    
    @staticmethod
    def compress(data: bytes) -> bytes:
        """Compress data if beneficial"""
        if len(data) < ResponseCompressor.COMPRESSION_THRESHOLD:
            return data
        return lz4.frame.compress(data)
    
    @staticmethod
    def decompress(data: bytes) -> bytes:
        """Decompress data"""
        try:
            return lz4.frame.decompress(data)
        except:
            return data  # Not compressed
    
    @staticmethod
    def should_compress(size: int) -> bool:
        return size >= ResponseCompressor.COMPRESSION_THRESHOLD


# ============== 6. ASYNC SEMAPHORE POOL ==============

class SemaphorePool:
    """
    Manages concurrency limits for different operation types.
    Prevents resource exhaustion under load.
    """
    
    def __init__(self):
        self._semaphores: Dict[str, asyncio.Semaphore] = {}
        self._configs = {
            "db_read": 200,    # Max concurrent DB reads
            "db_write": 100,   # Max concurrent DB writes
            "external_api": 50, # Max external API calls
            "scan_process": 500, # Max concurrent scan processing
        }
    
    def get(self, operation_type: str) -> asyncio.Semaphore:
        """Get semaphore for operation type"""
        if operation_type not in self._semaphores:
            limit = self._configs.get(operation_type, 100)
            self._semaphores[operation_type] = asyncio.Semaphore(limit)
        return self._semaphores[operation_type]
    
    async def acquire(self, operation_type: str):
        """Acquire semaphore"""
        sem = self.get(operation_type)
        await sem.acquire()
    
    def release(self, operation_type: str):
        """Release semaphore"""
        if operation_type in self._semaphores:
            self._semaphores[operation_type].release()


# ============== 7. CIRCUIT BREAKER ==============

@dataclass
class CircuitState:
    failures: int = 0
    last_failure: float = 0
    state: str = "closed"  # closed, open, half-open


class CircuitBreaker:
    """
    Prevents cascade failures by opening circuit on repeated failures.
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_requests: int = 3
    ):
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._half_open_requests = half_open_requests
        self._circuits: Dict[str, CircuitState] = {}
        self._lock = asyncio.Lock()
    
    async def call(
        self,
        service: str,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Execute function with circuit breaker protection"""
        async with self._lock:
            if service not in self._circuits:
                self._circuits[service] = CircuitState()
            
            circuit = self._circuits[service]
        
        # Check circuit state
        if circuit.state == "open":
            if time.time() - circuit.last_failure > self._recovery_timeout:
                circuit.state = "half-open"
            else:
                raise Exception(f"Circuit open for {service}")
        
        try:
            result = await func(*args, **kwargs)
            
            # Success - reset circuit
            if circuit.state == "half-open":
                circuit.state = "closed"
            circuit.failures = 0
            
            return result
            
        except Exception as e:
            circuit.failures += 1
            circuit.last_failure = time.time()
            
            if circuit.failures >= self._failure_threshold:
                circuit.state = "open"
                logger.warning(f"Circuit opened for {service}")
            
            raise
    
    def get_status(self) -> Dict:
        """Get all circuit states"""
        return {
            name: {
                "state": c.state,
                "failures": c.failures,
                "last_failure": c.last_failure
            }
            for name, c in self._circuits.items()
        }


# ============== 8. QUERY OPTIMIZER ==============

class QueryOptimizer:
    """
    Optimizes MongoDB queries for maximum performance.
    """
    
    # Projection templates - only fetch needed fields
    PROJECTIONS = {
        "user_basic": {"_id": 1, "phone_number": 1, "name": 1, "status": 1},
        "user_stats": {"_id": 1, "total_scans": 1, "valid_scans": 1, "total_entries": 1},
        "scan_check": {"_id": 1, "status": 1},
        "draw_active": {"_id": 1, "status": 1, "draw_type": 1, "end_date": 1},
    }
    
    @staticmethod
    def build_scan_duplicate_query(receipt_hash: str) -> tuple:
        """Optimized duplicate check query"""
        return (
            {"receipt_hash": receipt_hash, "status": "valid"},
            {"_id": 1}  # Only need to know if exists
        )
    
    @staticmethod
    def build_user_update(increments: Dict) -> Dict:
        """Build optimized user stats update"""
        return {"$inc": {k: v for k, v in increments.items() if v != 0}}
    
    @staticmethod
    def build_bulk_operations(operations: List[Dict]) -> List:
        """Convert to bulk write operations"""
        from pymongo import UpdateOne, InsertOne
        
        bulk_ops = []
        for op in operations:
            if op["type"] == "update":
                bulk_ops.append(UpdateOne(
                    op["filter"],
                    op["update"],
                    upsert=op.get("upsert", False)
                ))
            elif op["type"] == "insert":
                bulk_ops.append(InsertOne(op["document"]))
        
        return bulk_ops


# ============== 9. MEMORY-EFFICIENT DEDUPLICATION ==============

class CompactSet:
    """
    Memory-efficient set using hash prefixes.
    Stores only 8-byte hashes instead of full strings.
    """
    
    def __init__(self, expected_size: int = 1000000):
        # Use a set of 64-bit integers (8 bytes each)
        self._hashes: set = set()
        self._collision_check: Dict[int, str] = {}  # For collision verification
    
    def _hash(self, item: str) -> int:
        """Generate 64-bit hash"""
        h = hashlib.sha256(item.encode()).digest()
        return int.from_bytes(h[:8], 'big')
    
    def add(self, item: str) -> None:
        """Add item to set"""
        h = self._hash(item)
        self._hashes.add(h)
    
    def __contains__(self, item: str) -> bool:
        """Check if item in set"""
        return self._hash(item) in self._hashes
    
    def __len__(self) -> int:
        return len(self._hashes)
    
    def memory_usage_mb(self) -> float:
        """Estimate memory usage"""
        # Each int in set uses ~56 bytes (Python overhead)
        # But actual hash storage is 8 bytes
        return len(self._hashes) * 56 / (1024 * 1024)


# ============== 10. ASYNC BATCH EXECUTOR ==============

class AsyncBatchExecutor:
    """
    Executes operations in batches with configurable parallelism.
    """
    
    def __init__(self, batch_size: int = 100, max_concurrent: int = 10):
        self.batch_size = batch_size
        self.max_concurrent = max_concurrent
        self._semaphore = asyncio.Semaphore(max_concurrent)
    
    async def execute_batch(
        self,
        items: List[Any],
        processor: Callable[[List[Any]], Any]
    ) -> List[Any]:
        """Process items in batches"""
        results = []
        
        # Split into batches
        batches = [
            items[i:i + self.batch_size]
            for i in range(0, len(items), self.batch_size)
        ]
        
        async def process_with_semaphore(batch):
            async with self._semaphore:
                return await processor(batch)
        
        # Execute batches concurrently
        batch_results = await asyncio.gather(
            *[process_with_semaphore(batch) for batch in batches],
            return_exceptions=True
        )
        
        for result in batch_results:
            if isinstance(result, Exception):
                logger.error(f"Batch processing error: {result}")
            elif isinstance(result, list):
                results.extend(result)
            else:
                results.append(result)
        
        return results


# ============== GLOBAL INSTANCES ==============

# In-memory caches (much faster than Redis for hot data)
user_cache = TTLCache(maxsize=50000, ttl_seconds=60)
draw_cache = TTLCache(maxsize=1000, ttl_seconds=30)
config_cache = TTLCache(maxsize=100, ttl_seconds=300)

# Request coalescer
request_coalescer = RequestCoalescer()

# Semaphore pool
semaphore_pool = SemaphorePool()

# Circuit breaker
circuit_breaker = CircuitBreaker()

# Batch executor
batch_executor = AsyncBatchExecutor(batch_size=100, max_concurrent=10)

# Compact deduplication set
scanned_receipts = CompactSet(expected_size=1000000)


def get_optimization_stats() -> Dict:
    """Get all optimization component statistics"""
    return {
        "user_cache": user_cache.get_stats(),
        "draw_cache": draw_cache.get_stats(),
        "config_cache": config_cache.get_stats(),
        "request_coalescer": request_coalescer.get_stats(),
        "circuit_breaker": circuit_breaker.get_status(),
        "scanned_receipts": {
            "count": len(scanned_receipts),
            "memory_mb": round(scanned_receipts.memory_usage_mb(), 2)
        }
    }
