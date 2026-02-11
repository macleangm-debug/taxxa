"""
Production-Ready Redis Cache Service
====================================
Provides caching layer for high-performance data access.
Supports graceful degradation when Redis is unavailable.
"""

import redis.asyncio as redis
import json
import hashlib
import logging
from typing import Optional, Any, Dict, List
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class CacheService:
    """
    Redis-based caching service with graceful degradation.
    Falls back to no-cache mode if Redis is unavailable.
    """
    
    # TTL Configuration (seconds)
    TTL = {
        "user_profile": 300,          # 5 minutes
        "user_entries": 60,           # 1 minute  
        "user_stats": 120,            # 2 minutes
        "draw_current": 10,           # 10 seconds (hot data)
        "draw_active": 30,            # 30 seconds
        "draw_list": 60,              # 1 minute
        "leaderboard": 60,            # 1 minute
        "app_config": 300,            # 5 minutes
        "receipt_hash": 86400,        # 24 hours (duplicate detection)
        "admin_dashboard": 30,        # 30 seconds
        "merchant_list": 3600,        # 1 hour
    }
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379')
        self.redis: Optional[redis.Redis] = None
        self.is_connected = False
        self._connection_error_logged = False
        
    async def connect(self):
        """Initialize Redis connection with error handling"""
        try:
            self.redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True,
                max_connections=50,
            )
            # Test connection
            await self.redis.ping()
            self.is_connected = True
            self._connection_error_logged = False
            logger.info("✅ Redis cache connected successfully")
        except Exception as e:
            self.is_connected = False
            if not self._connection_error_logged:
                logger.warning(f"⚠️ Redis not available, running without cache: {e}")
                self._connection_error_logged = True
            self.redis = None
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            self.is_connected = False
            logger.info("Redis connection closed")
    
    async def _ensure_connected(self) -> bool:
        """Ensure Redis is connected, attempt reconnect if needed"""
        if not self.is_connected or self.redis is None:
            await self.connect()
        return self.is_connected
    
    # ==================== CORE CACHE OPERATIONS ====================
    
    async def get(self, key: str) -> Optional[Any]:
        """Get cached value by key"""
        if not await self._ensure_connected():
            return None
        try:
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Cache GET error for {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set cache value with TTL"""
        if not await self._ensure_connected():
            return False
        try:
            await self.redis.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.error(f"Cache SET error for {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete cached value"""
        if not await self._ensure_connected():
            return False
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache DELETE error for {key}: {e}")
            return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not await self._ensure_connected():
            return 0
        try:
            keys = []
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                await self.redis.delete(*keys)
            return len(keys)
        except Exception as e:
            logger.error(f"Cache INVALIDATE error for {pattern}: {e}")
            return 0
    
    # ==================== USER CACHING ====================
    
    def _user_key(self, user_id: str, suffix: str) -> str:
        return f"user:{user_id}:{suffix}"
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get cached user profile"""
        return await self.get(self._user_key(user_id, "profile"))
    
    async def set_user_profile(self, user_id: str, profile: Dict) -> bool:
        """Cache user profile"""
        return await self.set(
            self._user_key(user_id, "profile"), 
            profile, 
            self.TTL["user_profile"]
        )
    
    async def invalidate_user(self, user_id: str) -> int:
        """Invalidate all user caches"""
        return await self.invalidate_pattern(f"user:{user_id}:*")
    
    async def get_user_stats(self, user_id: str) -> Optional[Dict]:
        """Get cached user stats"""
        return await self.get(self._user_key(user_id, "stats"))
    
    async def set_user_stats(self, user_id: str, stats: Dict) -> bool:
        """Cache user stats"""
        return await self.set(
            self._user_key(user_id, "stats"),
            stats,
            self.TTL["user_stats"]
        )
    
    # ==================== DRAW CACHING ====================
    
    async def get_active_draws(self) -> Optional[List]:
        """Get cached active draws"""
        return await self.get("draws:active")
    
    async def set_active_draws(self, draws: List) -> bool:
        """Cache active draws"""
        return await self.set("draws:active", draws, self.TTL["draw_active"])
    
    async def get_current_draw(self) -> Optional[Dict]:
        """Get cached current draw (hot data, short TTL)"""
        return await self.get("draw:current")
    
    async def set_current_draw(self, draw: Dict) -> bool:
        """Cache current draw"""
        return await self.set("draw:current", draw, self.TTL["draw_current"])
    
    async def invalidate_draws(self) -> int:
        """Invalidate all draw caches"""
        count = await self.invalidate_pattern("draw*")
        count += await self.invalidate_pattern("draws*")
        return count
    
    # ==================== APP CONFIG CACHING ====================
    
    async def get_app_config(self) -> Optional[Dict]:
        """Get cached app configuration"""
        return await self.get("app:config")
    
    async def set_app_config(self, config: Dict) -> bool:
        """Cache app configuration"""
        return await self.set("app:config", config, self.TTL["app_config"])
    
    # ==================== DUPLICATE RECEIPT DETECTION ====================
    
    async def is_receipt_scanned(self, qr_data: str) -> bool:
        """
        Check if receipt has been scanned (Bloom filter simulation).
        Uses hash of QR data for fast duplicate detection.
        """
        if not await self._ensure_connected():
            return False  # Can't check, allow through (DB will catch duplicates)
        
        try:
            hash_key = hashlib.sha256(qr_data.encode()).hexdigest()
            key = f"receipt:hash:{hash_key}"
            exists = await self.redis.exists(key)
            return bool(exists)
        except Exception as e:
            logger.error(f"Receipt duplicate check error: {e}")
            return False
    
    async def mark_receipt_scanned(self, qr_data: str) -> bool:
        """Mark receipt as scanned for duplicate detection"""
        if not await self._ensure_connected():
            return False
        
        try:
            hash_key = hashlib.sha256(qr_data.encode()).hexdigest()
            key = f"receipt:hash:{hash_key}"
            await self.redis.setex(key, self.TTL["receipt_hash"], "1")
            return True
        except Exception as e:
            logger.error(f"Receipt mark scanned error: {e}")
            return False
    
    # ==================== ADMIN DASHBOARD CACHING ====================
    
    async def get_admin_dashboard(self) -> Optional[Dict]:
        """Get cached admin dashboard data"""
        return await self.get("admin:dashboard")
    
    async def set_admin_dashboard(self, data: Dict) -> bool:
        """Cache admin dashboard data"""
        return await self.set("admin:dashboard", data, self.TTL["admin_dashboard"])
    
    # ==================== LEADERBOARD CACHING ====================
    
    async def get_leaderboard(self, draw_id: str, limit: int = 100) -> Optional[List]:
        """Get cached leaderboard for a draw"""
        return await self.get(f"leaderboard:{draw_id}:{limit}")
    
    async def set_leaderboard(self, draw_id: str, leaderboard: List, limit: int = 100) -> bool:
        """Cache leaderboard"""
        return await self.set(
            f"leaderboard:{draw_id}:{limit}",
            leaderboard,
            self.TTL["leaderboard"]
        )
    
    # ==================== CACHE STATS ====================
    
    async def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        if not await self._ensure_connected():
            return {"status": "disconnected", "is_available": False}
        
        try:
            info = await self.redis.info("stats")
            memory = await self.redis.info("memory")
            
            return {
                "status": "connected",
                "is_available": True,
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "memory_used": memory.get("used_memory_human", "N/A"),
                "memory_peak": memory.get("used_memory_peak_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
            }
        except Exception as e:
            return {"status": "error", "is_available": False, "error": str(e)}


# Global cache instance
cache = CacheService()


async def get_cache() -> CacheService:
    """Dependency injection for cache service"""
    return cache
