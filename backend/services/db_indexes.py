"""
Database Index Optimization
============================
Compound indexes for maximum query performance.
Run once during setup or migration.
"""

import logging
from pymongo import ASCENDING, DESCENDING, IndexModel

logger = logging.getLogger(__name__)


async def create_optimized_indexes(db):
    """
    Create all optimized indexes for 1M+ scans/min throughput.
    """
    
    logger.info("Creating optimized database indexes...")
    
    # ============== SCANS COLLECTION ==============
    scan_indexes = [
        # Primary lookup - duplicate check (most frequent query)
        IndexModel(
            [("receipt_hash", ASCENDING), ("status", ASCENDING)],
            name="idx_scan_duplicate_check",
            background=True
        ),
        # User scan history
        IndexModel(
            [("user_id", ASCENDING), ("timestamp", DESCENDING)],
            name="idx_scan_user_history",
            background=True
        ),
        # Admin queries - status filtering
        IndexModel(
            [("status", ASCENDING), ("timestamp", DESCENDING)],
            name="idx_scan_status_time",
            background=True
        ),
        # Fraud detection - geo + time
        IndexModel(
            [("geo_location", "2dsphere"), ("timestamp", DESCENDING)],
            name="idx_scan_geo_time",
            background=True,
            sparse=True
        ),
        # TTL index for old invalid scans (auto-cleanup after 90 days)
        IndexModel(
            [("timestamp", ASCENDING)],
            name="idx_scan_ttl",
            expireAfterSeconds=7776000,  # 90 days
            partialFilterExpression={"status": "invalid"},
            background=True
        ),
    ]
    
    try:
        await db.scans.create_indexes(scan_indexes)
        logger.info("✅ Scan indexes created")
    except Exception as e:
        logger.warning(f"Scan index creation: {e}")
    
    # ============== USERS COLLECTION ==============
    user_indexes = [
        # Phone lookup (auth)
        IndexModel(
            [("phone_number", ASCENDING)],
            name="idx_user_phone",
            unique=True,
            background=True
        ),
        # Referral code lookup
        IndexModel(
            [("referral_code", ASCENDING)],
            name="idx_user_referral",
            unique=True,
            sparse=True,
            background=True
        ),
        # Leaderboard queries
        IndexModel(
            [("total_entries", DESCENDING), ("total_scans", DESCENDING)],
            name="idx_user_leaderboard",
            background=True
        ),
        # Active users
        IndexModel(
            [("status", ASCENDING), ("last_active", DESCENDING)],
            name="idx_user_active",
            background=True
        ),
    ]
    
    try:
        await db.users.create_indexes(user_indexes)
        logger.info("✅ User indexes created")
    except Exception as e:
        logger.warning(f"User index creation: {e}")
    
    # ============== DRAW ENTRIES COLLECTION ==============
    entry_indexes = [
        # User entries lookup
        IndexModel(
            [("user_id", ASCENDING), ("draw_id", ASCENDING)],
            name="idx_entry_user_draw",
            unique=True,
            background=True
        ),
        # Draw aggregation
        IndexModel(
            [("draw_id", ASCENDING), ("entries", DESCENDING)],
            name="idx_entry_draw_rank",
            background=True
        ),
    ]
    
    try:
        await db.draw_entries.create_indexes(entry_indexes)
        logger.info("✅ Draw entry indexes created")
    except Exception as e:
        logger.warning(f"Draw entry index creation: {e}")
    
    # ============== DRAWS COLLECTION ==============
    draw_indexes = [
        # Active draws query
        IndexModel(
            [("status", ASCENDING), ("end_date", ASCENDING)],
            name="idx_draw_active",
            background=True
        ),
        # Draw type filtering
        IndexModel(
            [("draw_type", ASCENDING), ("status", ASCENDING)],
            name="idx_draw_type_status",
            background=True
        ),
    ]
    
    try:
        await db.draws.create_indexes(draw_indexes)
        logger.info("✅ Draw indexes created")
    except Exception as e:
        logger.warning(f"Draw index creation: {e}")
    
    # ============== REFERRALS COLLECTION ==============
    referral_indexes = [
        # Referred user lookup
        IndexModel(
            [("referred_user_id", ASCENDING)],
            name="idx_referral_referred",
            unique=True,
            background=True
        ),
        # Referrer stats
        IndexModel(
            [("referrer_id", ASCENDING), ("status", ASCENDING)],
            name="idx_referral_referrer",
            background=True
        ),
    ]
    
    try:
        await db.referrals.create_indexes(referral_indexes)
        logger.info("✅ Referral indexes created")
    except Exception as e:
        logger.warning(f"Referral index creation: {e}")
    
    # ============== ANALYTICS COLLECTION (Time-series) ==============
    analytics_indexes = [
        # Time-series queries
        IndexModel(
            [("timestamp", DESCENDING), ("event_type", ASCENDING)],
            name="idx_analytics_time_event",
            background=True
        ),
        # TTL for old analytics (30 days)
        IndexModel(
            [("timestamp", ASCENDING)],
            name="idx_analytics_ttl",
            expireAfterSeconds=2592000,  # 30 days
            background=True
        ),
    ]
    
    try:
        await db.analytics.create_indexes(analytics_indexes)
        logger.info("✅ Analytics indexes created")
    except Exception as e:
        logger.warning(f"Analytics index creation: {e}")
    
    logger.info("✅ All optimized indexes created successfully")
    
    return True


async def analyze_index_usage(db) -> dict:
    """
    Analyze index usage statistics.
    Helps identify unused or missing indexes.
    """
    stats = {}
    
    collections = ["scans", "users", "draw_entries", "draws", "referrals"]
    
    for coll_name in collections:
        try:
            coll = db[coll_name]
            index_stats = await coll.aggregate([
                {"$indexStats": {}}
            ]).to_list(100)
            
            stats[coll_name] = {
                idx["name"]: {
                    "accesses": idx["accesses"]["ops"],
                    "since": idx["accesses"]["since"].isoformat() if idx["accesses"].get("since") else None
                }
                for idx in index_stats
            }
        except Exception as e:
            stats[coll_name] = {"error": str(e)}
    
    return stats


async def get_collection_stats(db) -> dict:
    """Get collection statistics for capacity planning"""
    stats = {}
    
    collections = ["scans", "users", "draw_entries", "draws", "referrals", "analytics"]
    
    for coll_name in collections:
        try:
            coll_stats = await db.command("collStats", coll_name)
            stats[coll_name] = {
                "count": coll_stats.get("count", 0),
                "size_mb": round(coll_stats.get("size", 0) / (1024 * 1024), 2),
                "avg_obj_size": coll_stats.get("avgObjSize", 0),
                "index_size_mb": round(coll_stats.get("totalIndexSize", 0) / (1024 * 1024), 2),
            }
        except Exception as e:
            stats[coll_name] = {"error": str(e)}
    
    return stats
