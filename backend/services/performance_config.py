"""
High-Performance System Configuration
=====================================
Production configuration for handling 1M+ requests/minute.
"""

import os
from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class PerformanceConfig:
    """System-wide performance configuration"""
    
    # MongoDB Connection Pool
    MONGO_MAX_POOL_SIZE: int = 500  # Max connections
    MONGO_MIN_POOL_SIZE: int = 50   # Min idle connections
    MONGO_MAX_IDLE_TIME_MS: int = 30000  # 30 seconds
    MONGO_CONNECT_TIMEOUT_MS: int = 5000
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = 5000
    MONGO_SOCKET_TIMEOUT_MS: int = 30000
    
    # Batch Processing
    SCAN_BATCH_SIZE: int = 100  # Scans per batch
    SCAN_BATCH_FLUSH_INTERVAL_MS: int = 50  # 50ms
    SCAN_QUEUE_MAX_SIZE: int = 50000  # Max queued scans
    
    # Write Aggregation
    WRITE_FLUSH_INTERVAL_MS: int = 200  # 200ms
    WRITE_MAX_PENDING: int = 500  # Max pending writes before flush
    
    # Background Workers
    BACKGROUND_WORKERS: int = 8  # Async task workers
    BACKGROUND_QUEUE_SIZE: int = 100000  # Max queued tasks
    
    # Bloom Filter (Duplicate Detection)
    BLOOM_EXPECTED_ITEMS: int = 10_000_000  # 10M receipts
    BLOOM_FP_RATE: float = 0.01  # 1% false positive rate
    
    # Rate Limiting
    SCAN_RATE_LIMIT: int = 100  # Scans per minute per user
    GLOBAL_RATE_LIMIT: int = 1000  # Requests per minute per IP
    
    # Caching TTLs (seconds)
    CACHE_USER_STATS_TTL: int = 60
    CACHE_ACTIVE_DRAWS_TTL: int = 30
    CACHE_APP_CONFIG_TTL: int = 300
    
    # Worker Configuration
    UVICORN_WORKERS: int = int(os.environ.get('UVICORN_WORKERS', '4'))
    
    @classmethod
    def from_env(cls) -> 'PerformanceConfig':
        """Load configuration from environment variables"""
        config = cls()
        
        # Override from environment
        for field in config.__dataclass_fields__:
            env_value = os.environ.get(field)
            if env_value:
                field_type = type(getattr(config, field))
                setattr(config, field, field_type(env_value))
        
        return config
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            field: getattr(self, field)
            for field in self.__dataclass_fields__
        }


# Global configuration instance
perf_config = PerformanceConfig.from_env()


# ============== SCALING CALCULATIONS ==============

def calculate_capacity(config: PerformanceConfig) -> Dict[str, Any]:
    """
    Calculate theoretical system capacity based on configuration.
    """
    
    # MongoDB capacity (assuming 1ms avg query time)
    mongo_ops_per_second = config.MONGO_MAX_POOL_SIZE * 1000  # connections * ops/sec/conn
    
    # Batch processing throughput
    batches_per_second = 1000 / config.SCAN_BATCH_FLUSH_INTERVAL_MS
    scans_per_second = batches_per_second * config.SCAN_BATCH_SIZE
    
    # With multiple workers
    total_scans_per_second = scans_per_second * config.UVICORN_WORKERS
    total_scans_per_minute = total_scans_per_second * 60
    
    # Write aggregation efficiency
    write_reduction_factor = config.WRITE_MAX_PENDING  # N:1 write reduction
    
    return {
        "theoretical_capacity": {
            "mongo_ops_per_second": mongo_ops_per_second,
            "scans_per_second_per_worker": scans_per_second,
            "total_scans_per_second": total_scans_per_second,
            "total_scans_per_minute": total_scans_per_minute,
            "write_reduction_factor": f"{write_reduction_factor}:1"
        },
        "bottlenecks": identify_bottlenecks(config),
        "recommendations": get_scaling_recommendations(config, total_scans_per_minute)
    }


def identify_bottlenecks(config: PerformanceConfig) -> Dict[str, str]:
    """Identify potential bottlenecks"""
    bottlenecks = {}
    
    if config.MONGO_MAX_POOL_SIZE < 200:
        bottlenecks["mongodb"] = "Pool size may limit throughput"
    
    if config.UVICORN_WORKERS < 4:
        bottlenecks["workers"] = "Increase workers for multi-core utilization"
    
    if config.SCAN_QUEUE_MAX_SIZE < 10000:
        bottlenecks["queue"] = "Small queue may cause drops under load"
    
    return bottlenecks


def get_scaling_recommendations(
    config: PerformanceConfig,
    current_capacity: int
) -> Dict[str, Any]:
    """Get recommendations for scaling to 1M+ scans/minute"""
    
    target = 1_000_000  # scans per minute
    
    if current_capacity >= target:
        return {
            "status": "sufficient",
            "message": f"Current capacity ({current_capacity:,}/min) meets target ({target:,}/min)"
        }
    
    # Calculate required scaling
    scale_factor = target / current_capacity
    
    return {
        "status": "scale_required",
        "current_capacity": current_capacity,
        "target_capacity": target,
        "scale_factor": round(scale_factor, 2),
        "recommendations": [
            {
                "component": "Kubernetes Pods",
                "action": f"Scale to {int(scale_factor * config.UVICORN_WORKERS)} pods",
                "impact": "Linear throughput increase"
            },
            {
                "component": "MongoDB",
                "action": "Deploy replica set with sharding",
                "impact": "Horizontal read/write scaling"
            },
            {
                "component": "Redis Cluster",
                "action": "Deploy Redis cluster for caching/rate limiting",
                "impact": "Distributed state management"
            },
            {
                "component": "Load Balancer",
                "action": "Configure sticky sessions or round-robin",
                "impact": "Even request distribution"
            }
        ]
    }


# ============== DEPLOYMENT CONFIGURATIONS ==============

DEPLOYMENT_CONFIGS = {
    "development": {
        "uvicorn_workers": 1,
        "mongo_pool_size": 50,
        "batch_size": 50,
        "expected_load": "1K scans/min"
    },
    "staging": {
        "uvicorn_workers": 4,
        "mongo_pool_size": 200,
        "batch_size": 100,
        "expected_load": "50K scans/min"
    },
    "production_small": {
        "uvicorn_workers": 8,
        "mongo_pool_size": 500,
        "batch_size": 100,
        "pods": 4,
        "expected_load": "200K scans/min"
    },
    "production_medium": {
        "uvicorn_workers": 8,
        "mongo_pool_size": 500,
        "batch_size": 100,
        "pods": 16,
        "mongo_shards": 3,
        "expected_load": "500K scans/min"
    },
    "production_large": {
        "uvicorn_workers": 8,
        "mongo_pool_size": 500,
        "batch_size": 100,
        "pods": 50,
        "mongo_shards": 6,
        "redis_cluster_nodes": 6,
        "expected_load": "1M+ scans/min"
    }
}
