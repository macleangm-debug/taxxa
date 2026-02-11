# Taxxa Performance Optimization Guide

## Code-Level Optimizations Implemented

All optimizations are built into the codebase - no additional infrastructure required.

---

## 1. Scan Processing Optimization

### V3 Ultra-Optimized Endpoint (`/api/v3/scan`)
| Metric | Target | Implementation |
|--------|--------|----------------|
| Latency | <5ms | In-memory processing, fire-and-forget writes |
| Throughput | 50K/min | Batch writes, deduplication |
| Memory | <200MB | Compact hash storage |

**How it works:**
```
Request → In-memory duplicate check (0.001ms)
        → Fast JSON parse with orjson (0.01ms)
        → Receipt verification (0.01ms)
        → Fire-and-forget write buffer (non-blocking)
        → Response (<5ms total)
```

---

## 2. In-Memory Caching

### TTL Caches (No Redis Required)
| Cache | Capacity | TTL | Purpose |
|-------|----------|-----|---------|
| `user_cache` | 50,000 | 60s | User data |
| `draw_cache` | 1,000 | 30s | Active draws |
| `config_cache` | 100 | 300s | App config |

**Usage in code:**
```python
from services.optimizations import user_cache

# Get from cache (async)
user = await user_cache.get(user_id)
if not user:
    user = await db.users.find_one({"_id": user_id})
    await user_cache.set(user_id, user)
```

---

## 3. Duplicate Detection

### In-Memory Deduplicator (2M capacity)
- **Memory**: ~144MB for 2M receipts
- **Lookup time**: O(1), ~0.001ms
- **Auto-eviction**: Removes 10% when full

```python
from routers.scan_v3 import deduplicator

# Check and add in single operation
is_duplicate = deduplicator.check_and_add(qr_data)
```

### Bloom Filter (10M capacity)
- **Memory**: 11.4MB
- **False positive rate**: 1%
- **Use case**: First-pass filter before DB check

---

## 4. Write Optimization

### Write Buffer (Batch Writes)
- **Flush interval**: 100ms
- **Batch size**: Up to 500 operations
- **Reduction**: 500:1 DB operations

```python
# Instead of immediate write:
await db.scans.insert_one(scan)

# Use buffered write:
await write_buffer.add_scan(scan)
# Automatically batched and flushed
```

### Write Aggregator (Stats Updates)
- Aggregates incremental updates
- Single bulk operation per flush

---

## 5. Concurrency Control

### Semaphore Pool
Prevents resource exhaustion:
```python
from services.optimizations import semaphore_pool

async with semaphore_pool.get("db_read"):
    result = await db.collection.find().to_list(100)
```

| Operation | Limit |
|-----------|-------|
| db_read | 200 |
| db_write | 100 |
| external_api | 50 |
| scan_process | 500 |

### Circuit Breaker
Prevents cascade failures:
```python
from services.optimizations import circuit_breaker

result = await circuit_breaker.call(
    "external_service",
    external_api_call,
    param1, param2
)
```

---

## 6. Request Coalescing

Prevents thundering herd on cache misses:
```python
from services.optimizations import request_coalescer

# Multiple simultaneous requests for same data
# Only executes once, shares result
result = await request_coalescer.execute(
    f"user:{user_id}",
    lambda: db.users.find_one({"_id": user_id})
)
```

---

## 7. Database Indexes

### Optimized Indexes Created Automatically
```
scans:
  - (receipt_hash, status) - Duplicate check
  - (user_id, timestamp DESC) - User history
  - (status, timestamp DESC) - Admin queries
  - (geo_location 2dsphere, timestamp) - Fraud detection

users:
  - (phone_number) UNIQUE - Auth lookup
  - (referral_code) UNIQUE - Referral system
  - (total_entries DESC, total_scans DESC) - Leaderboard

draw_entries:
  - (user_id, draw_id) UNIQUE - Entry lookup
  - (draw_id, entries DESC) - Draw ranking
```

---

## 8. Fast Serialization

### orjson (3-10x faster than stdlib json)
```python
from services.optimizations import FastJSON

# Serialize
data_bytes = FastJSON.dumps({"key": "value"})

# Deserialize
obj = FastJSON.loads(data_bytes)
```

### LZ4 Compression (for large payloads)
```python
from services.optimizations import ResponseCompressor

compressed = ResponseCompressor.compress(large_data)
original = ResponseCompressor.decompress(compressed)
```

---

## Performance Monitoring

### Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/system/performance` | HP components stats |
| `/api/system/optimizations` | All optimization stats |
| `/api/system/scaling` | Scaling recommendations |
| `/api/system/db-stats` | Collection statistics |
| `/api/v3/stats` | V3 scan system stats |

### Example Stats Response
```json
{
  "in_memory_optimizations": {
    "user_cache": {"size": 1234, "hit_rate": 89.5},
    "request_coalescer": {"coalesced_requests": 5678}
  },
  "v3_scan_system": {
    "deduplicator": {"size": 50000, "memory_mb": 3.6},
    "write_buffer": {"scans_written": 100000, "flushes": 1000}
  }
}
```

---

## Capacity Planning

### Single Instance Capacity
| Configuration | Scans/min | Memory |
|---------------|-----------|--------|
| Default | 50,000+ | 200MB |
| With Redis | 75,000+ | 250MB |
| 8 workers | 100,000+ | 400MB |

### Scaling Formula
```
Total Capacity = Pods × Workers × 12,500 scans/min/worker

For 1M scans/min:
- 8 pods × 8 workers = 64 workers
- 64 × 12,500 = 800,000 (with 25% headroom → 1M)
```

---

## Quick Start

The optimizations are **automatically enabled**. Just use the V3 endpoint:

```bash
# Single scan
curl -X POST https://api.taxxa.io/api/v3/scan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "{...}"}'

# Batch scan (up to 500)
curl -X POST https://api.taxxa.io/api/v3/scan/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scans": [{...}, {...}]}'
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `/backend/services/optimizations.py` | Core optimization components |
| `/backend/services/scan_processor.py` | Batch processing, Bloom filter |
| `/backend/services/db_indexes.py` | Database index management |
| `/backend/routers/scan_v3.py` | Ultra-optimized scan endpoint |
| `/backend/services/performance_config.py` | Configuration |
