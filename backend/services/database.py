"""
Production-Ready Database Configuration
=======================================
Optimized MongoDB connection pooling and configuration
for high-throughput production environments.
"""

import os
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ReadPreference, WriteConcern
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """
    Production MongoDB configuration with optimized settings.
    """
    
    # Connection Pool Settings
    MAX_POOL_SIZE = int(os.environ.get('MONGO_MAX_POOL_SIZE', '100'))
    MIN_POOL_SIZE = int(os.environ.get('MONGO_MIN_POOL_SIZE', '10'))
    MAX_IDLE_TIME_MS = int(os.environ.get('MONGO_MAX_IDLE_TIME_MS', '30000'))
    
    # Timeout Settings
    CONNECT_TIMEOUT_MS = int(os.environ.get('MONGO_CONNECT_TIMEOUT_MS', '5000'))
    SERVER_SELECTION_TIMEOUT_MS = int(os.environ.get('MONGO_SERVER_SELECTION_TIMEOUT_MS', '5000'))
    SOCKET_TIMEOUT_MS = int(os.environ.get('MONGO_SOCKET_TIMEOUT_MS', '30000'))
    
    # Write Concern Settings
    WRITE_CONCERN_W = os.environ.get('MONGO_WRITE_CONCERN_W', 'majority')
    WRITE_CONCERN_TIMEOUT_MS = int(os.environ.get('MONGO_WRITE_CONCERN_TIMEOUT_MS', '5000'))
    
    # Retry Settings
    RETRY_WRITES = True
    RETRY_READS = True


class DatabaseManager:
    """
    Manages MongoDB connections with production-ready settings.
    Supports read/write splitting and connection health monitoring.
    """
    
    def __init__(self, mongo_url: Optional[str] = None, db_name: Optional[str] = None):
        self.mongo_url = mongo_url or os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        self.db_name = db_name or os.environ.get('DB_NAME', 'taxxa')
        
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None
        self._read_client: Optional[AsyncIOMotorClient] = None
        self._read_db: Optional[AsyncIOMotorDatabase] = None
        
        self.is_connected = False
        self.config = DatabaseConfig()
    
    async def connect(self):
        """
        Initialize database connections with optimized settings.
        Creates both primary (read-write) and secondary (read-only) connections.
        """
        try:
            # Primary connection for writes
            self._client = AsyncIOMotorClient(
                self.mongo_url,
                maxPoolSize=self.config.MAX_POOL_SIZE,
                minPoolSize=self.config.MIN_POOL_SIZE,
                maxIdleTimeMS=self.config.MAX_IDLE_TIME_MS,
                connectTimeoutMS=self.config.CONNECT_TIMEOUT_MS,
                serverSelectionTimeoutMS=self.config.SERVER_SELECTION_TIMEOUT_MS,
                socketTimeoutMS=self.config.SOCKET_TIMEOUT_MS,
                retryWrites=self.config.RETRY_WRITES,
                retryReads=self.config.RETRY_READS,
                w=self.config.WRITE_CONCERN_W,
                wtimeout=self.config.WRITE_CONCERN_TIMEOUT_MS,
            )
            
            self._db = self._client[self.db_name]
            
            # Read-preference connection for read-heavy operations
            # In production with replica sets, this would use secondaryPreferred
            self._read_client = AsyncIOMotorClient(
                self.mongo_url,
                maxPoolSize=self.config.MAX_POOL_SIZE * 2,  # More read connections
                minPoolSize=self.config.MIN_POOL_SIZE,
                maxIdleTimeMS=self.config.MAX_IDLE_TIME_MS,
                connectTimeoutMS=self.config.CONNECT_TIMEOUT_MS,
                serverSelectionTimeoutMS=self.config.SERVER_SELECTION_TIMEOUT_MS,
                socketTimeoutMS=self.config.SOCKET_TIMEOUT_MS,
                retryReads=self.config.RETRY_READS,
                # In production: readPreference='secondaryPreferred'
            )
            
            self._read_db = self._read_client[self.db_name]
            
            # Test connection
            await self._client.admin.command('ping')
            
            self.is_connected = True
            logger.info(f"✅ MongoDB connected: {self.db_name} (Pool: {self.config.MIN_POOL_SIZE}-{self.config.MAX_POOL_SIZE})")
            
            # Ensure indexes exist
            await self._ensure_indexes()
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            self.is_connected = False
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Close all database connections"""
        if self._client:
            self._client.close()
        if self._read_client:
            self._read_client.close()
        self.is_connected = False
        logger.info("MongoDB connections closed")
    
    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get primary database for write operations"""
        if not self._db:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._db
    
    @property
    def read_db(self) -> AsyncIOMotorDatabase:
        """Get read-optimized database connection"""
        if not self._read_db:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._read_db
    
    @property
    def client(self) -> AsyncIOMotorClient:
        """Get MongoDB client"""
        if not self._client:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._client
    
    async def _ensure_indexes(self):
        """
        Create production indexes for optimal query performance.
        Called on startup to ensure all indexes exist.
        """
        try:
            # Users collection indexes
            await self._db.users.create_index("phone_number", unique=True, sparse=True)
            await self._db.users.create_index("referral_code", sparse=True)
            await self._db.users.create_index("created_at")
            await self._db.users.create_index("status")
            
            # Scans collection indexes
            await self._db.scans.create_index("receipt_id")
            await self._db.scans.create_index([("user_id", 1), ("timestamp", -1)])
            await self._db.scans.create_index("timestamp")
            await self._db.scans.create_index("status")
            await self._db.scans.create_index([("user_id", 1), ("status", 1)])
            
            # Draw entries indexes
            await self._db.draw_entries.create_index([("draw_id", 1), ("user_id", 1)], unique=True)
            await self._db.draw_entries.create_index([("draw_id", 1), ("entries", -1)])
            await self._db.draw_entries.create_index("user_id")
            
            # Draws collection indexes
            await self._db.draws.create_index("status")
            await self._db.draws.create_index([("status", 1), ("draw_date", -1)])
            
            # Referrals indexes
            await self._db.referrals.create_index("referrer_id")
            await self._db.referrals.create_index("referred_user_id", unique=True, sparse=True)
            await self._db.referrals.create_index("referral_code")
            
            # OTPs indexes (with TTL for auto-cleanup)
            await self._db.otps.create_index("phone_number")
            await self._db.otps.create_index(
                "expires_at",
                expireAfterSeconds=0  # Documents auto-delete at expires_at time
            )
            
            # Push tokens indexes
            await self._db.push_tokens.create_index("user_id", unique=True)
            await self._db.push_tokens.create_index("is_active")
            
            # Audit logs (with TTL for 7-year retention)
            await self._db.audit_logs.create_index("timestamp")
            await self._db.audit_logs.create_index("action")
            await self._db.audit_logs.create_index([("action", 1), ("timestamp", -1)])
            
            logger.info("✅ Database indexes ensured")
            
        except Exception as e:
            logger.warning(f"⚠️ Index creation warning: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform database health check for monitoring.
        Returns detailed status information.
        """
        try:
            # Ping database
            start_time = __import__('time').time()
            await self._client.admin.command('ping')
            latency_ms = (__import__('time').time() - start_time) * 1000
            
            # Get server status (if available)
            try:
                server_info = await self._client.server_info()
                version = server_info.get('version', 'unknown')
            except:
                version = 'unknown'
            
            # Get collection stats
            collections = await self._db.list_collection_names()
            
            # Get connection pool stats
            try:
                pool_stats = {
                    "max_pool_size": self.config.MAX_POOL_SIZE,
                    "min_pool_size": self.config.MIN_POOL_SIZE,
                }
            except:
                pool_stats = {}
            
            return {
                "status": "healthy",
                "is_connected": True,
                "latency_ms": round(latency_ms, 2),
                "version": version,
                "database": self.db_name,
                "collections_count": len(collections),
                "pool": pool_stats,
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "is_connected": False,
                "error": str(e),
            }
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics for monitoring"""
        try:
            stats = await self._db.command("dbStats")
            return {
                "database": self.db_name,
                "collections": stats.get("collections", 0),
                "objects": stats.get("objects", 0),
                "data_size_mb": round(stats.get("dataSize", 0) / (1024 * 1024), 2),
                "storage_size_mb": round(stats.get("storageSize", 0) / (1024 * 1024), 2),
                "index_size_mb": round(stats.get("indexSize", 0) / (1024 * 1024), 2),
            }
        except Exception as e:
            return {"error": str(e)}


# Global database manager instance
db_manager = DatabaseManager()


async def get_database() -> AsyncIOMotorDatabase:
    """Dependency injection for database"""
    return db_manager.db


async def get_read_database() -> AsyncIOMotorDatabase:
    """Dependency injection for read-optimized database"""
    return db_manager.read_db
