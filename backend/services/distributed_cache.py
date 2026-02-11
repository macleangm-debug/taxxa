"""
Distributed Cache Service with Redis Cluster
=============================================
Production-ready Redis cluster integration for distributed caching.
Falls back to in-memory cache when Redis unavailable.
"""

import redis.asyncio as redis
from redis.asyncio.cluster import RedisCluster
from redis.asyncio.sentinel import Sentinel
import json
import hashlib
import logging
import os
import asyncio
from typing import Optional, Any, Dict, List, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class RedisMode(Enum):
    STANDALONE = "standalone"
    CLUSTER = "cluster"
    SENTINEL = "sentinel"


@dataclass
class RedisConfig:
    """Redis configuration"""
    mode: RedisMode = RedisMode.STANDALONE
    url: str = "redis://localhost:6379"
    cluster_nodes: List[Dict[str, Any]] = None
    sentinel_nodes: List[tuple] = None
    sentinel_master: str = "mymaster"
    password: Optional[str] = None
    db: int = 0
    max_connections: int = 100
    socket_timeout: float = 5.0
    socket_connect_timeout: float = 5.0
    retry_on_timeout: bool = True
    health_check_interval: int = 30
    
    @classmethod
    def from_env(cls) -> 'RedisConfig':
        """Load configuration from environment"""
        mode_str = os.environ.get('REDIS_MODE', 'standalone').lower()
        mode = RedisMode(mode_str) if mode_str in [m.value for m in RedisMode] else RedisMode.STANDALONE
        
        config = cls(
            mode=mode,
            url=os.environ.get('REDIS_URL', 'redis://localhost:6379'),
            password=os.environ.get('REDIS_PASSWORD'),
            max_connections=int(os.environ.get('REDIS_MAX_CONNECTIONS', '100')),
        )
        
        # Parse cluster nodes
        cluster_nodes_str = os.environ.get('REDIS_CLUSTER_NODES', '')
        if cluster_nodes_str:
            config.cluster_nodes = []
            for node in cluster_nodes_str.split(','):
                host, port = node.strip().split(':')
                config.cluster_nodes.append({"host": host, "port": int(port)})
        
        # Parse sentinel nodes
        sentinel_nodes_str = os.environ.get('REDIS_SENTINEL_NODES', '')
        if sentinel_nodes_str:
            config.sentinel_nodes = []
            for node in sentinel_nodes_str.split(','):
                host, port = node.strip().split(':')
                config.sentinel_nodes.append((host, int(port)))
            config.sentinel_master = os.environ.get('REDIS_SENTINEL_MASTER', 'mymaster')
        
        return config


class DistributedCache:
    """
    Distributed cache with Redis Cluster support.
    Provides high availability and horizontal scaling.
    """
    
    # TTL Configuration
    TTL = {
        "user_profile": 300,
        "user_stats": 60,
        "active_draws": 30,
        "draw_entries": 60,
        "app_config": 300,
        "receipt_hash": 86400,
        "session": 3600,
        "rate_limit": 60,
        "leaderboard": 60,
    }
    
    def __init__(self, config: RedisConfig = None):
        self.config = config or RedisConfig.from_env()
        self._client: Optional[Union[redis.Redis, RedisCluster]] = None
        self._sentinel: Optional[Sentinel] = None
        self.is_connected = False
        self._fallback_cache: Dict[str, tuple] = {}  # key -> (value, expiry)
        self._stats = {
            "hits": 0,
            "misses": 0,
            "errors": 0,
            "fallback_hits": 0
        }
    
    async def connect(self) -> bool:
        """Connect to Redis based on configuration mode"""
        try:
            if self.config.mode == RedisMode.CLUSTER:
                await self._connect_cluster()
            elif self.config.mode == RedisMode.SENTINEL:
                await self._connect_sentinel()
            else:
                await self._connect_standalone()
            
            # Test connection
            await self._client.ping()
            self.is_connected = True
            logger.info(f"✅ Redis connected (mode: {self.config.mode.value})")
            return True
            
        except Exception as e:
            self.is_connected = False
            logger.warning(f"⚠️ Redis connection failed, using fallback cache: {e}")
            return False
    
    async def _connect_standalone(self):
        """Connect to standalone Redis"""
        self._client = redis.from_url(
            self.config.url,
            password=self.config.password,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=self.config.socket_timeout,
            socket_connect_timeout=self.config.socket_connect_timeout,
            retry_on_timeout=self.config.retry_on_timeout,
            max_connections=self.config.max_connections,
            health_check_interval=self.config.health_check_interval,
        )
    
    async def _connect_cluster(self):
        """Connect to Redis Cluster"""
        if not self.config.cluster_nodes:
            raise ValueError("Cluster nodes not configured")
        
        startup_nodes = [
            redis.cluster.ClusterNode(node["host"], node["port"])
            for node in self.config.cluster_nodes
        ]
        
        self._client = RedisCluster(
            startup_nodes=startup_nodes,
            password=self.config.password,
            decode_responses=True,
            socket_timeout=self.config.socket_timeout,
            retry_on_timeout=self.config.retry_on_timeout,
        )
    
    async def _connect_sentinel(self):
        """Connect via Redis Sentinel for HA"""
        if not self.config.sentinel_nodes:
            raise ValueError("Sentinel nodes not configured")
        
        self._sentinel = Sentinel(
            self.config.sentinel_nodes,
            socket_timeout=self.config.socket_timeout,
            password=self.config.password,
        )
        
        self._client = self._sentinel.master_for(
            self.config.sentinel_master,
            decode_responses=True,
        )
    
    async def disconnect(self):
        """Close Redis connection"""
        if self._client:
            await self._client.close()
        self.is_connected = False
        logger.info("Redis connection closed")
    
    # ============== CORE OPERATIONS ==============
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        # Try Redis first
        if self.is_connected:
            try:
                data = await self._client.get(key)
                if data:
                    self._stats["hits"] += 1
                    return json.loads(data)
                self._stats["misses"] += 1
                return None
            except Exception as e:
                self._stats["errors"] += 1
                logger.error(f"Redis GET error: {e}")
        
        # Fallback to in-memory
        return self._fallback_get(key)
    
    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache"""
        serialized = json.dumps(value, default=str)
        
        # Try Redis first
        if self.is_connected:
            try:
                await self._client.setex(key, ttl, serialized)
                return True
            except Exception as e:
                self._stats["errors"] += 1
                logger.error(f"Redis SET error: {e}")
        
        # Fallback to in-memory
        self._fallback_set(key, value, ttl)
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if self.is_connected:
            try:
                await self._client.delete(key)
            except Exception as e:
                logger.error(f"Redis DELETE error: {e}")
        
        # Also delete from fallback
        self._fallback_cache.pop(key, None)
        return True
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if self.is_connected:
            try:
                return await self._client.exists(key) > 0
            except Exception as e:
                logger.error(f"Redis EXISTS error: {e}")
        
        # Check fallback
        if key in self._fallback_cache:
            _, expiry = self._fallback_cache[key]
            return datetime.now().timestamp() < expiry
        return False
    
    async def incr(self, key: str, amount: int = 1) -> int:
        """Increment counter"""
        if self.is_connected:
            try:
                return await self._client.incrby(key, amount)
            except Exception as e:
                logger.error(f"Redis INCR error: {e}")
        return 0
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration on key"""
        if self.is_connected:
            try:
                return await self._client.expire(key, ttl)
            except Exception as e:
                logger.error(f"Redis EXPIRE error: {e}")
        return False
    
    # ============== DISTRIBUTED PATTERNS ==============
    
    async def acquire_lock(
        self,
        lock_name: str,
        timeout: int = 10,
        blocking: bool = True,
        blocking_timeout: float = 5.0
    ) -> Optional[str]:
        """
        Acquire distributed lock using Redis.
        Returns lock token if acquired, None otherwise.
        """
        import uuid
        token = str(uuid.uuid4())
        key = f"lock:{lock_name}"
        
        if not self.is_connected:
            return token  # In fallback mode, always succeed
        
        try:
            if blocking:
                end_time = asyncio.get_event_loop().time() + blocking_timeout
                while asyncio.get_event_loop().time() < end_time:
                    if await self._client.set(key, token, nx=True, ex=timeout):
                        return token
                    await asyncio.sleep(0.1)
                return None
            else:
                if await self._client.set(key, token, nx=True, ex=timeout):
                    return token
                return None
        except Exception as e:
            logger.error(f"Lock acquire error: {e}")
            return token  # Fallback: assume lock acquired
    
    async def release_lock(self, lock_name: str, token: str) -> bool:
        """Release distributed lock"""
        if not self.is_connected:
            return True
        
        key = f"lock:{lock_name}"
        
        # Lua script for atomic check-and-delete
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        
        try:
            result = await self._client.eval(script, 1, key, token)
            return result == 1
        except Exception as e:
            logger.error(f"Lock release error: {e}")
            return True
    
    async def rate_limit_check(
        self,
        identifier: str,
        limit: int,
        window: int
    ) -> tuple:
        """
        Distributed rate limiting using sliding window.
        Returns: (is_limited, remaining, reset_time)
        """
        if not self.is_connected:
            return (False, limit, window)  # No limiting in fallback mode
        
        key = f"ratelimit:{identifier}"
        now = datetime.now().timestamp()
        window_start = now - window
        
        try:
            pipe = self._client.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window + 10)
            
            results = await pipe.execute()
            current_count = results[2]
            
            remaining = max(0, limit - current_count)
            is_limited = current_count > limit
            
            return (is_limited, remaining, window)
            
        except Exception as e:
            logger.error(f"Rate limit error: {e}")
            return (False, limit, window)
    
    # ============== RECEIPT DEDUPLICATION ==============
    
    async def check_receipt_scanned(self, qr_hash: str) -> bool:
        """Check if receipt was already scanned (distributed)"""
        key = f"receipt:{qr_hash}"
        return await self.exists(key)
    
    async def mark_receipt_scanned(self, qr_hash: str) -> bool:
        """Mark receipt as scanned"""
        key = f"receipt:{qr_hash}"
        return await self.set(key, "1", ttl=self.TTL["receipt_hash"])
    
    # ============== USER CACHING ==============
    
    async def get_user_stats(self, user_id: str) -> Optional[Dict]:
        """Get cached user stats"""
        return await self.get(f"user:{user_id}:stats")
    
    async def set_user_stats(self, user_id: str, stats: Dict) -> bool:
        """Cache user stats"""
        return await self.set(f"user:{user_id}:stats", stats, self.TTL["user_stats"])
    
    async def invalidate_user(self, user_id: str) -> int:
        """Invalidate all user cache entries"""
        # In cluster mode, we need to delete specific keys
        keys = [
            f"user:{user_id}:stats",
            f"user:{user_id}:profile",
            f"user:{user_id}:entries"
        ]
        
        count = 0
        for key in keys:
            if await self.delete(key):
                count += 1
        return count
    
    # ============== DRAW CACHING ==============
    
    async def get_active_draws(self) -> Optional[List]:
        """Get cached active draws"""
        return await self.get("draws:active")
    
    async def set_active_draws(self, draws: List) -> bool:
        """Cache active draws"""
        return await self.set("draws:active", draws, self.TTL["active_draws"])
    
    # ============== LEADERBOARD ==============
    
    async def update_leaderboard(
        self,
        draw_id: str,
        user_id: str,
        entries: int
    ) -> int:
        """Update user's position in leaderboard"""
        key = f"leaderboard:{draw_id}"
        
        if self.is_connected:
            try:
                return await self._client.zincrby(key, entries, user_id)
            except Exception as e:
                logger.error(f"Leaderboard update error: {e}")
        return 0
    
    async def get_leaderboard(
        self,
        draw_id: str,
        limit: int = 100
    ) -> List[Dict]:
        """Get top entries in leaderboard"""
        key = f"leaderboard:{draw_id}"
        
        if self.is_connected:
            try:
                results = await self._client.zrevrange(key, 0, limit - 1, withscores=True)
                return [
                    {"user_id": user_id, "entries": int(score)}
                    for user_id, score in results
                ]
            except Exception as e:
                logger.error(f"Leaderboard get error: {e}")
        return []
    
    # ============== FALLBACK CACHE ==============
    
    def _fallback_get(self, key: str) -> Optional[Any]:
        """Get from in-memory fallback cache"""
        if key in self._fallback_cache:
            value, expiry = self._fallback_cache[key]
            if datetime.now().timestamp() < expiry:
                self._stats["fallback_hits"] += 1
                return value
            else:
                del self._fallback_cache[key]
        return None
    
    def _fallback_set(self, key: str, value: Any, ttl: int):
        """Set in in-memory fallback cache"""
        expiry = datetime.now().timestamp() + ttl
        self._fallback_cache[key] = (value, expiry)
        
        # Limit fallback cache size
        if len(self._fallback_cache) > 10000:
            # Remove oldest 10%
            sorted_keys = sorted(
                self._fallback_cache.keys(),
                key=lambda k: self._fallback_cache[k][1]
            )
            for k in sorted_keys[:1000]:
                del self._fallback_cache[k]
    
    # ============== STATS ==============
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
        
        return {
            "connected": self.is_connected,
            "mode": self.config.mode.value,
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "errors": self._stats["errors"],
            "fallback_hits": self._stats["fallback_hits"],
            "hit_rate": round(hit_rate, 2),
            "fallback_cache_size": len(self._fallback_cache)
        }
    
    async def get_cluster_info(self) -> Dict:
        """Get Redis cluster information"""
        if not self.is_connected:
            return {"status": "disconnected"}
        
        try:
            if self.config.mode == RedisMode.CLUSTER:
                info = await self._client.cluster_info()
                return {
                    "status": "connected",
                    "mode": "cluster",
                    "cluster_state": info.get("cluster_state"),
                    "cluster_slots_ok": info.get("cluster_slots_ok"),
                    "cluster_known_nodes": info.get("cluster_known_nodes"),
                }
            else:
                info = await self._client.info("server")
                return {
                    "status": "connected",
                    "mode": self.config.mode.value,
                    "redis_version": info.get("redis_version"),
                }
        except Exception as e:
            return {"status": "error", "error": str(e)}


# Global instance
distributed_cache = DistributedCache()


async def get_distributed_cache() -> DistributedCache:
    """Dependency injection for distributed cache"""
    return distributed_cache
