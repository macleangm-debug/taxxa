"""
Background Task Handlers
========================
Handlers for deferred/async operations.
"""

import logging
from typing import Dict, Callable, Awaitable
from datetime import datetime, timezone
from bson import ObjectId

logger = logging.getLogger(__name__)

# Database reference (set during initialization)
_db = None


def set_database(db):
    """Set database reference for handlers"""
    global _db
    _db = db


async def handle_user_stats_update(data: Dict):
    """Update user statistics asynchronously"""
    try:
        user_id = data["user_id"]
        await _db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$inc": {
                    "total_scans": data.get("total_scans", 0),
                    "valid_scans": data.get("valid_scans", 0),
                    "total_entries": data.get("total_entries", 0)
                }
            }
        )
    except Exception as e:
        logger.error(f"User stats update failed: {e}")


async def handle_referral_check(data: Dict):
    """Check and process referral milestones"""
    try:
        user_id = data["user_id"]
        valid_scans = data["valid_scans"]
        
        # Find referral relationship
        referral = await _db.referrals.find_one({"referred_user_id": user_id})
        if not referral:
            return
        
        referrer_id = referral["referrer_id"]
        current_status = referral.get("status", "pending")
        
        entries_to_add = 0
        new_status = current_status
        
        # First scan milestone
        if valid_scans >= 1 and current_status == "pending":
            entries_to_add = 1
            new_status = "active_1"
        
        # 5 scans milestone
        elif valid_scans >= 5 and current_status == "active_1":
            entries_to_add = 3
            new_status = "active_5"
        
        if entries_to_add > 0:
            # Update referral status
            await _db.referrals.update_one(
                {"_id": referral["_id"]},
                {
                    "$set": {"status": new_status, "scans_completed": valid_scans},
                    "$inc": {"entries_earned": entries_to_add}
                }
            )
            
            # Add entries to referrer
            await _db.users.update_one(
                {"_id": ObjectId(referrer_id)},
                {
                    "$inc": {
                        "total_entries": entries_to_add,
                        "referral_entries": entries_to_add,
                        "referrals_rewarded": 1 if new_status == "active_1" else 0
                    }
                }
            )
            
            logger.info(f"Referral reward: {entries_to_add} entries for {referrer_id}")
            
    except Exception as e:
        logger.error(f"Referral check failed: {e}")


async def handle_draw_entry_update(data: Dict):
    """Update draw entries asynchronously"""
    try:
        user_id = data["user_id"]
        draw_id = data["draw_id"]
        entries = data["entries"]
        
        await _db.draw_entries.update_one(
            {"user_id": user_id, "draw_id": draw_id},
            {"$inc": {"entries": entries}},
            upsert=True
        )
    except Exception as e:
        logger.error(f"Draw entry update failed: {e}")


async def handle_analytics_log(data: Dict):
    """Log analytics event"""
    try:
        data["timestamp"] = datetime.now(timezone.utc)
        await _db.analytics.insert_one(data)
    except Exception as e:
        logger.error(f"Analytics log failed: {e}")


async def handle_cache_invalidation(data: Dict):
    """Invalidate cache entries"""
    try:
        from .cache_service import cache
        
        pattern = data.get("pattern")
        if pattern:
            await cache.invalidate_pattern(pattern)
        
        keys = data.get("keys", [])
        for key in keys:
            await cache.delete(key)
            
    except Exception as e:
        logger.error(f"Cache invalidation failed: {e}")


# Task type to handler mapping
TASK_HANDLERS: Dict[str, Callable[[Dict], Awaitable[None]]] = {
    "user_stats_update": handle_user_stats_update,
    "referral_check": handle_referral_check,
    "draw_entry_update": handle_draw_entry_update,
    "analytics_log": handle_analytics_log,
    "cache_invalidation": handle_cache_invalidation,
}
