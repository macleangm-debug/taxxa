"""
Production-Ready Rate Limiter Service
======================================
Per-user and per-IP rate limiting using sliding window algorithm.
Supports Redis backend for distributed rate limiting.
Falls back to memory-based limiting when Redis unavailable.
"""

import time
import logging
from typing import Dict, Optional, Tuple
from collections import defaultdict
from fastapi import HTTPException, Request
from functools import wraps
import os

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Rate limit configurations for different endpoints"""
    
    # Format: (requests, window_seconds)
    LIMITS = {
        # Authentication endpoints
        "auth_register": (5, 60),        # 5 requests per minute
        "auth_login": (10, 60),          # 10 requests per minute
        "auth_verify_otp": (10, 60),     # 10 requests per minute
        "auth_forgot_password": (3, 300),# 3 requests per 5 minutes
        
        # Receipt scanning - critical endpoint
        "scan_receipt": (30, 60),        # 30 scans per minute
        "scan_history": (60, 60),        # 60 requests per minute
        
        # User endpoints
        "user_profile": (120, 60),       # 120 requests per minute
        "user_stats": (60, 60),          # 60 requests per minute
        
        # Draw endpoints
        "draws_list": (120, 60),         # 120 requests per minute
        "draws_active": (120, 60),       # 120 requests per minute
        
        # Referral endpoints
        "referral_stats": (60, 60),      # 60 requests per minute
        "referral_apply": (10, 300),     # 10 applications per 5 minutes
        
        # Admin endpoints (more permissive)
        "admin_dashboard": (120, 60),    # 120 requests per minute
        "admin_users": (120, 60),        # 120 requests per minute
        "admin_draws": (120, 60),        # 120 requests per minute
        
        # Default limit
        "default": (100, 60),            # 100 requests per minute
    }
    
    # Global limits (per IP, regardless of authentication)
    GLOBAL_LIMITS = {
        "per_ip": (500, 60),             # 500 requests per minute per IP
        "burst": (50, 1),                # 50 requests per second burst
    }


class InMemoryRateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    Used as fallback when Redis is unavailable.
    """
    
    def __init__(self):
        self._windows: Dict[str, list] = defaultdict(list)
        self._cleanup_interval = 60  # seconds
        self._last_cleanup = time.time()
    
    def _cleanup(self):
        """Remove expired entries"""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        
        keys_to_delete = []
        for key, timestamps in self._windows.items():
            # Remove timestamps older than 5 minutes
            self._windows[key] = [t for t in timestamps if now - t < 300]
            if not self._windows[key]:
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self._windows[key]
        
        self._last_cleanup = now
    
    def is_rate_limited(self, key: str, limit: int, window: int) -> Tuple[bool, int, int]:
        """
        Check if request is rate limited.
        Returns: (is_limited, remaining_requests, reset_time_seconds)
        """
        self._cleanup()
        
        now = time.time()
        window_start = now - window
        
        # Filter to only timestamps within window
        self._windows[key] = [t for t in self._windows[key] if t > window_start]
        
        current_count = len(self._windows[key])
        remaining = max(0, limit - current_count)
        
        # Calculate reset time (when oldest request expires)
        if self._windows[key]:
            oldest = min(self._windows[key])
            reset_time = int(oldest + window - now)
        else:
            reset_time = window
        
        if current_count >= limit:
            return True, 0, reset_time
        
        # Add current request timestamp
        self._windows[key].append(now)
        return False, remaining - 1, reset_time
    
    def get_usage(self, key: str, window: int) -> int:
        """Get current usage count for a key"""
        now = time.time()
        window_start = now - window
        return len([t for t in self._windows.get(key, []) if t > window_start])


class RateLimiterService:
    """
    Production rate limiter with Redis support and memory fallback.
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379')
        self.redis = None
        self.is_redis_available = False
        self._memory_limiter = InMemoryRateLimiter()
        self.config = RateLimitConfig()
        
    async def connect(self):
        """Initialize Redis connection for distributed rate limiting"""
        try:
            import redis.asyncio as redis_async
            self.redis = redis_async.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            await self.redis.ping()
            self.is_redis_available = True
            logger.info("✅ Rate limiter Redis connected")
        except Exception as e:
            self.is_redis_available = False
            logger.warning(f"⚠️ Rate limiter using memory backend: {e}")
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            self.is_redis_available = False
    
    def _get_limit(self, endpoint: str) -> Tuple[int, int]:
        """Get rate limit for endpoint"""
        return self.config.LIMITS.get(endpoint, self.config.LIMITS["default"])
    
    async def _check_redis(self, key: str, limit: int, window: int) -> Tuple[bool, int, int]:
        """Check rate limit using Redis sliding window"""
        try:
            now = time.time()
            window_start = now - window
            
            pipe = self.redis.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            # Add current request
            pipe.zadd(key, {str(now): now})
            # Count requests in window
            pipe.zcard(key)
            # Set expiry
            pipe.expire(key, window + 10)
            
            results = await pipe.execute()
            current_count = results[2]
            
            remaining = max(0, limit - current_count)
            reset_time = window
            
            if current_count > limit:
                return True, 0, reset_time
            
            return False, remaining, reset_time
            
        except Exception as e:
            logger.error(f"Redis rate limit error: {e}")
            # Fallback to memory
            return self._memory_limiter.is_rate_limited(key, limit, window)
    
    async def check_rate_limit(
        self,
        identifier: str,
        endpoint: str = "default",
        custom_limit: Optional[Tuple[int, int]] = None
    ) -> Tuple[bool, int, int]:
        """
        Check if request should be rate limited.
        
        Args:
            identifier: User ID or IP address
            endpoint: Endpoint name for limit lookup
            custom_limit: Optional (requests, window) override
            
        Returns:
            Tuple of (is_limited, remaining_requests, reset_time_seconds)
        """
        limit, window = custom_limit or self._get_limit(endpoint)
        key = f"ratelimit:{endpoint}:{identifier}"
        
        if self.is_redis_available:
            return await self._check_redis(key, limit, window)
        else:
            return self._memory_limiter.is_rate_limited(key, limit, window)
    
    async def check_global_limit(self, ip_address: str) -> Tuple[bool, int, int]:
        """Check global per-IP rate limit"""
        limit, window = self.config.GLOBAL_LIMITS["per_ip"]
        return await self.check_rate_limit(ip_address, "global_ip", (limit, window))
    
    async def check_burst_limit(self, ip_address: str) -> Tuple[bool, int, int]:
        """Check burst rate limit (requests per second)"""
        limit, window = self.config.GLOBAL_LIMITS["burst"]
        return await self.check_rate_limit(ip_address, "global_burst", (limit, window))
    
    async def get_stats(self) -> Dict:
        """Get rate limiter statistics"""
        return {
            "backend": "redis" if self.is_redis_available else "memory",
            "redis_available": self.is_redis_available,
        }


# Global rate limiter instance
rate_limiter = RateLimiterService()


async def get_rate_limiter() -> RateLimiterService:
    """Dependency injection for rate limiter"""
    return rate_limiter


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies"""
    # Check X-Forwarded-For header (set by load balancers/proxies)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # First IP in the list is the original client
        return forwarded.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"


async def check_rate_limit_middleware(
    request: Request,
    user_id: Optional[str] = None,
    endpoint: str = "default"
):
    """
    Middleware helper for rate limiting.
    Raises HTTPException if rate limited.
    """
    global rate_limiter
    
    identifier = user_id or get_client_ip(request)
    
    is_limited, remaining, reset_time = await rate_limiter.check_rate_limit(
        identifier, endpoint
    )
    
    # Set rate limit headers
    request.state.rate_limit_remaining = remaining
    request.state.rate_limit_reset = reset_time
    
    if is_limited:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": reset_time
            },
            headers={
                "Retry-After": str(reset_time),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_time)
            }
        )


def rate_limit(endpoint: str = "default", limit: Optional[Tuple[int, int]] = None):
    """
    Decorator for rate limiting endpoints.
    
    Usage:
        @rate_limit("scan_receipt")
        async def scan_receipt(request: Request, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find request in args or kwargs
            request = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if request:
                user = kwargs.get("user")
                user_id = str(user.get("_id")) if user else None
                
                identifier = user_id or get_client_ip(request)
                
                custom_limit = limit
                is_limited, remaining, reset_time = await rate_limiter.check_rate_limit(
                    identifier, endpoint, custom_limit
                )
                
                if is_limited:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "rate_limit_exceeded",
                            "message": "Too many requests. Please try again later.",
                            "retry_after": reset_time
                        },
                        headers={
                            "Retry-After": str(reset_time),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": str(reset_time)
                        }
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
