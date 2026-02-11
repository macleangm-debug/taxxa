"""
Production Health Check & Monitoring Service
=============================================
Provides endpoints for load balancer health checks,
readiness probes, and system monitoring.
"""

import os
import time
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class HealthStatus:
    """Health check result"""
    healthy: bool
    component: str
    latency_ms: float = 0.0
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)


class HealthCheckService:
    """
    Production health check service for Kubernetes/load balancer integration.
    
    Provides:
    - /health: Simple liveness probe
    - /ready: Readiness probe (checks dependencies)
    - /status: Detailed system status
    """
    
    def __init__(self):
        self._start_time = datetime.utcnow()
        self._last_health_check: Optional[datetime] = None
        self._cached_status: Optional[Dict] = None
        self._cache_duration = timedelta(seconds=5)
    
    @property
    def uptime_seconds(self) -> float:
        """Get application uptime in seconds"""
        return (datetime.utcnow() - self._start_time).total_seconds()
    
    @property
    def uptime_formatted(self) -> str:
        """Get formatted uptime string"""
        seconds = self.uptime_seconds
        days = int(seconds // 86400)
        hours = int((seconds % 86400) // 3600)
        minutes = int((seconds % 3600) // 60)
        
        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        parts.append(f"{minutes}m")
        
        return " ".join(parts)
    
    async def check_database(self, db) -> HealthStatus:
        """Check MongoDB connection health"""
        start = time.time()
        try:
            await db.client.admin.command('ping')
            latency = (time.time() - start) * 1000
            return HealthStatus(
                healthy=True,
                component="mongodb",
                latency_ms=round(latency, 2),
                message="Connected"
            )
        except Exception as e:
            return HealthStatus(
                healthy=False,
                component="mongodb",
                latency_ms=0,
                message=str(e)
            )
    
    async def check_cache(self, cache) -> HealthStatus:
        """Check Redis cache health"""
        start = time.time()
        try:
            if cache.is_connected and cache.redis:
                await cache.redis.ping()
                latency = (time.time() - start) * 1000
                return HealthStatus(
                    healthy=True,
                    component="redis",
                    latency_ms=round(latency, 2),
                    message="Connected"
                )
            else:
                return HealthStatus(
                    healthy=True,  # Redis is optional
                    component="redis",
                    message="Not configured (optional)"
                )
        except Exception as e:
            return HealthStatus(
                healthy=True,  # Redis is optional, app works without it
                component="redis",
                message=f"Unavailable: {e} (operating in degraded mode)"
            )
    
    async def liveness_check(self) -> Dict[str, Any]:
        """
        Kubernetes liveness probe.
        Returns OK if the application is running.
        Used to detect deadlocks/hangs.
        """
        return {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": self.uptime_formatted
        }
    
    async def readiness_check(self, db, cache=None) -> Dict[str, Any]:
        """
        Kubernetes readiness probe.
        Returns OK only if all critical dependencies are healthy.
        Used to determine if the pod should receive traffic.
        """
        checks = []
        
        # Check database (critical)
        db_status = await self.check_database(db)
        checks.append(db_status)
        
        # Check cache (optional)
        if cache:
            cache_status = await self.check_cache(cache)
            checks.append(cache_status)
        
        # Determine overall health
        critical_healthy = all(c.healthy for c in checks if c.component == "mongodb")
        
        return {
            "status": "ready" if critical_healthy else "not_ready",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": [
                {
                    "component": c.component,
                    "healthy": c.healthy,
                    "latency_ms": c.latency_ms,
                    "message": c.message
                }
                for c in checks
            ]
        }
    
    async def detailed_status(self, db, cache=None, rate_limiter=None) -> Dict[str, Any]:
        """
        Detailed system status for monitoring dashboards.
        Includes all component statuses and metrics.
        """
        # Use cached status if recent
        now = datetime.utcnow()
        if (self._cached_status and 
            self._last_health_check and 
            now - self._last_health_check < self._cache_duration):
            return self._cached_status
        
        # Database status
        db_status = await self.check_database(db)
        
        # Cache status
        cache_info = {"status": "not_configured"}
        if cache:
            cache_status = await self.check_cache(cache)
            cache_stats = await cache.get_cache_stats() if cache.is_connected else {}
            cache_info = {
                "status": "connected" if cache_status.healthy else "degraded",
                "latency_ms": cache_status.latency_ms,
                **cache_stats
            }
        
        # Rate limiter status
        rate_limiter_info = {"status": "not_configured"}
        if rate_limiter:
            rate_limiter_info = await rate_limiter.get_stats()
        
        # System metrics
        import sys
        system_info = {
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
            "uptime": self.uptime_formatted,
            "uptime_seconds": round(self.uptime_seconds, 0),
            "started_at": self._start_time.isoformat(),
        }
        
        # Environment info
        env_info = {
            "environment": os.environ.get('ENVIRONMENT', 'development'),
            "debug": os.environ.get('DEBUG', 'false').lower() == 'true',
            "version": os.environ.get('APP_VERSION', '1.0.0'),
        }
        
        status = {
            "status": "healthy" if db_status.healthy else "unhealthy",
            "timestamp": now.isoformat(),
            "system": system_info,
            "environment": env_info,
            "components": {
                "database": {
                    "status": "healthy" if db_status.healthy else "unhealthy",
                    "latency_ms": db_status.latency_ms,
                    "message": db_status.message,
                },
                "cache": cache_info,
                "rate_limiter": rate_limiter_info,
            }
        }
        
        # Cache the status
        self._cached_status = status
        self._last_health_check = now
        
        return status


# Global health check instance
health_service = HealthCheckService()


async def get_health_service() -> HealthCheckService:
    """Dependency injection for health service"""
    return health_service


class MetricsCollector:
    """
    Simple metrics collector for request tracking.
    In production, this would integrate with Prometheus/StatsD.
    """
    
    def __init__(self):
        self._request_count = 0
        self._error_count = 0
        self._endpoint_stats: Dict[str, Dict] = {}
        self._start_time = time.time()
    
    def record_request(self, endpoint: str, method: str, status_code: int, duration_ms: float):
        """Record request metrics"""
        self._request_count += 1
        
        if status_code >= 400:
            self._error_count += 1
        
        key = f"{method}:{endpoint}"
        if key not in self._endpoint_stats:
            self._endpoint_stats[key] = {
                "count": 0,
                "errors": 0,
                "total_duration_ms": 0,
                "max_duration_ms": 0,
            }
        
        stats = self._endpoint_stats[key]
        stats["count"] += 1
        stats["total_duration_ms"] += duration_ms
        stats["max_duration_ms"] = max(stats["max_duration_ms"], duration_ms)
        
        if status_code >= 400:
            stats["errors"] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        uptime = time.time() - self._start_time
        
        endpoint_metrics = {}
        for key, stats in self._endpoint_stats.items():
            avg_duration = stats["total_duration_ms"] / stats["count"] if stats["count"] > 0 else 0
            error_rate = stats["errors"] / stats["count"] * 100 if stats["count"] > 0 else 0
            
            endpoint_metrics[key] = {
                "requests": stats["count"],
                "errors": stats["errors"],
                "error_rate_percent": round(error_rate, 2),
                "avg_duration_ms": round(avg_duration, 2),
                "max_duration_ms": round(stats["max_duration_ms"], 2),
            }
        
        return {
            "total_requests": self._request_count,
            "total_errors": self._error_count,
            "error_rate_percent": round(self._error_count / self._request_count * 100, 2) if self._request_count > 0 else 0,
            "uptime_seconds": round(uptime, 0),
            "requests_per_second": round(self._request_count / uptime, 2) if uptime > 0 else 0,
            "endpoints": endpoint_metrics,
        }
    
    def reset(self):
        """Reset all metrics"""
        self._request_count = 0
        self._error_count = 0
        self._endpoint_stats = {}
        self._start_time = time.time()


# Global metrics collector
metrics = MetricsCollector()


async def get_metrics() -> MetricsCollector:
    """Dependency injection for metrics"""
    return metrics
