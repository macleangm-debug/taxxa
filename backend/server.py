from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging
import time
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import random
import secrets
import hashlib
import json
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=100,
    minPoolSize=10,
    maxIdleTimeMS=30000,
    connectTimeoutMS=5000,
    serverSelectionTimeoutMS=5000,
)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'taxxa_secret_key_2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== APPLICATION LIFECYCLE ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TAXXA API Server...")
    try:
        await client.admin.command('ping')
        logger.info("MongoDB connection verified")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
    await ensure_indexes()
    await seed_initial_data()
    logger.info("TAXXA API Server ready")
    yield
    client.close()
    logger.info("Server shutdown complete")


async def ensure_indexes():
    try:
        await db.users.create_index("phone_number", unique=True, sparse=True)
        await db.users.create_index("referral_code", sparse=True)
        await db.scans.create_index("receipt_id")
        await db.scans.create_index([("user_id", 1), ("timestamp", -1)])
        await db.draw_entries.create_index([("draw_id", 1), ("user_id", 1)], unique=True)
        await db.draws.create_index("status")
        await db.otps.create_index("expires_at", expireAfterSeconds=0)
        await db.streaks.create_index([("user_id", 1)], unique=True)
        await db.badges.create_index([("user_id", 1), ("badge_id", 1)], unique=True)
        await db.challenges.create_index([("challenger_id", 1), ("status", 1)])
        logger.info("Database indexes ensured")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


async def seed_initial_data():
    """Seed initial draws and badges if not exist"""
    # Seed active draw
    active_draw = await db.draws.find_one({"status": "active"})
    if not active_draw:
        now = datetime.now(timezone.utc)
        weekly_draw = {
            "draw_type": "weekly",
            "name": "Weekly Grand Draw",
            "start_date": now,
            "end_date": now + timedelta(days=7),
            "draw_date": now + timedelta(days=7),
            "status": "active",
            "prize_tiers": [
                {"tier": 1, "name": "Grand Prize", "amount": 10000, "winners": 1},
                {"tier": 2, "name": "Second Prize", "amount": 5000, "winners": 3},
                {"tier": 3, "name": "Third Prize", "amount": 1000, "winners": 10},
                {"tier": 4, "name": "Consolation", "amount": 100, "winners": 100},
            ],
            "total_entries": 0,
            "winners": [],
            "created_at": now
        }
        await db.draws.insert_one(weekly_draw)
        logger.info("Seeded initial weekly draw")
    
    # Seed badge definitions
    badge_count = await db.badge_definitions.count_documents({})
    if badge_count == 0:
        badges = [
            {"id": "first_scan", "name": "First Receipt", "description": "Scan your first receipt", "icon": "receipt", "category": "milestone"},
            {"id": "streak_3", "name": "Hot Streak", "description": "3-day scanning streak", "icon": "flame", "category": "streak"},
            {"id": "streak_7", "name": "Week Warrior", "description": "7-day scanning streak", "icon": "fire", "category": "streak"},
            {"id": "streak_30", "name": "Monthly Master", "description": "30-day scanning streak", "icon": "crown", "category": "streak"},
            {"id": "scans_10", "name": "Scanner Pro", "description": "Scan 10 receipts", "icon": "scan", "category": "milestone"},
            {"id": "scans_50", "name": "Receipt Hunter", "description": "Scan 50 receipts", "icon": "target", "category": "milestone"},
            {"id": "scans_100", "name": "Tax Champion", "description": "Scan 100 receipts", "icon": "trophy", "category": "milestone"},
            {"id": "referral_1", "name": "Social Starter", "description": "Refer your first friend", "icon": "users", "category": "social"},
            {"id": "referral_5", "name": "Influencer", "description": "Refer 5 friends", "icon": "share", "category": "social"},
            {"id": "winner", "name": "Lucky Winner", "description": "Win a prize", "icon": "star", "category": "achievement"},
            {"id": "early_adopter", "name": "Early Adopter", "description": "Joined in the first month", "icon": "rocket", "category": "special"},
        ]
        await db.badge_definitions.insert_many(badges)
        logger.info("Seeded badge definitions")


app = FastAPI(
    title="TAXXA API",
    version="2.0.0",
    description="Tax Compliance Incentive Platform API",
    lifespan=lifespan
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

app.add_middleware(GZipMiddleware, minimum_size=500)


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        return response


app.add_middleware(RequestMetricsMiddleware)


# ============== PYDANTIC MODELS ==============

class UserRegister(BaseModel):
    phone_number: str

class OTPVerify(BaseModel):
    phone_number: str
    otp: str

class PasswordCreate(BaseModel):
    phone_number: str
    password: str
    name: Optional[str] = None
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    phone_number: str
    password: str

class UserResponse(BaseModel):
    id: str
    phone_number: str
    name: Optional[str] = None
    created_at: datetime
    total_scans: int = 0
    valid_scans: int = 0
    total_entries: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ScanRequest(BaseModel):
    qr_data: str
    geo_location: Optional[Dict[str, float]] = None

class ScanResponse(BaseModel):
    id: str
    status: str
    message: str
    entries_earned: int = 0
    streak_bonus: int = 0
    receipt_data: Optional[Dict[str, Any]] = None
    new_badges: List[str] = []

class ChallengeCreate(BaseModel):
    friend_phone: str
    challenge_type: str = "weekly_scans"
    target: int = 10


# ============== HELPER FUNCTIONS ==============

def generate_otp():
    return str(random.randint(100000, 999999))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, role: str = "user") -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

def generate_referral_code(user_id: str) -> str:
    hash_input = f"{user_id}-taxxa-referral"
    hash_output = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
    return f"TX{hash_output}"


# ============== STREAK & GAMIFICATION HELPERS ==============

async def update_user_streak(user_id: str) -> dict:
    """Update user's streak and return streak info with bonuses"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    streak = await db.streaks.find_one({"user_id": user_id})
    
    if not streak:
        streak = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_scan_date": today,
            "streak_multiplier": 1.0,
            "created_at": now
        }
        await db.streaks.insert_one(streak)
        return {"current_streak": 1, "bonus_entries": 0, "multiplier": 1.0}
    
    last_scan = streak.get("last_scan_date")
    if isinstance(last_scan, str):
        last_scan = datetime.fromisoformat(last_scan.replace('Z', '+00:00'))
    if last_scan.tzinfo is None:
        last_scan = last_scan.replace(tzinfo=timezone.utc)
    last_scan_day = last_scan.replace(hour=0, minute=0, second=0, microsecond=0)
    
    days_diff = (today - last_scan_day).days
    
    if days_diff == 0:
        # Same day, no streak update
        return {
            "current_streak": streak["current_streak"],
            "bonus_entries": 0,
            "multiplier": streak.get("streak_multiplier", 1.0)
        }
    elif days_diff == 1:
        # Consecutive day - increase streak
        new_streak = streak["current_streak"] + 1
        longest = max(streak.get("longest_streak", 0), new_streak)
        
        # Calculate multiplier (reduced as requested)
        if new_streak >= 7:
            multiplier = 1.2  # 20% bonus for 7+ days
        elif new_streak >= 3:
            multiplier = 1.1  # 10% bonus for 3+ days
        else:
            multiplier = 1.0
        
        # Bonus entries (reduced as requested)
        bonus = 0
        if new_streak == 3:
            bonus = 1  # +1 entry at 3-day streak
        elif new_streak == 7:
            bonus = 2  # +2 entries at 7-day streak
        elif new_streak == 30:
            bonus = 5  # +5 entries at 30-day streak
        
        await db.streaks.update_one(
            {"user_id": user_id},
            {"$set": {
                "current_streak": new_streak,
                "longest_streak": longest,
                "last_scan_date": today.isoformat(),
                "streak_multiplier": multiplier
            }}
        )
        
        return {"current_streak": new_streak, "bonus_entries": bonus, "multiplier": multiplier}
    else:
        # Streak broken - reset
        await db.streaks.update_one(
            {"user_id": user_id},
            {"$set": {
                "current_streak": 1,
                "last_scan_date": today.isoformat(),
                "streak_multiplier": 1.0
            }}
        )
        return {"current_streak": 1, "bonus_entries": 0, "multiplier": 1.0}


async def check_and_award_badges(user_id: str, user_stats: dict) -> List[str]:
    """Check and award badges based on user stats"""
    new_badges = []
    
    badge_checks = [
        ("first_scan", user_stats.get("valid_scans", 0) >= 1),
        ("scans_10", user_stats.get("valid_scans", 0) >= 10),
        ("scans_50", user_stats.get("valid_scans", 0) >= 50),
        ("scans_100", user_stats.get("valid_scans", 0) >= 100),
        ("streak_3", user_stats.get("current_streak", 0) >= 3),
        ("streak_7", user_stats.get("current_streak", 0) >= 7),
        ("streak_30", user_stats.get("current_streak", 0) >= 30),
        ("referral_1", user_stats.get("total_referrals", 0) >= 1),
        ("referral_5", user_stats.get("total_referrals", 0) >= 5),
    ]
    
    for badge_id, condition in badge_checks:
        if condition:
            existing = await db.badges.find_one({"user_id": user_id, "badge_id": badge_id})
            if not existing:
                await db.badges.insert_one({
                    "user_id": user_id,
                    "badge_id": badge_id,
                    "awarded_at": datetime.now(timezone.utc).isoformat()
                })
                new_badges.append(badge_id)
    
    return new_badges


# ============== MOCK REVENUE AUTHORITY ==============

class MockRevenueAuthorityAPI:
    REGISTERED_MERCHANTS = {
        "MER-001": {"name": "SuperMart", "tax_id": "TAX-001", "status": "active"},
        "MER-002": {"name": "City Electronics", "tax_id": "TAX-002", "status": "active"},
        "MER-003": {"name": "Food Palace", "tax_id": "TAX-003", "status": "active"},
        "MER-004": {"name": "Fashion Hub", "tax_id": "TAX-004", "status": "active"},
        "MER-005": {"name": "Pharmacy Plus", "tax_id": "TAX-005", "status": "active"},
    }
    
    @classmethod
    def verify_receipt(cls, receipt_data: dict) -> dict:
        try:
            merchant_id = receipt_data.get("merchant_id")
            signature = receipt_data.get("signature")
            
            if merchant_id not in cls.REGISTERED_MERCHANTS:
                return {"valid": False, "reason": "unregistered_merchant", "message": "Merchant not registered"}
            
            merchant = cls.REGISTERED_MERCHANTS[merchant_id]
            if merchant["status"] != "active":
                return {"valid": False, "reason": "suspended_merchant", "message": "Merchant suspended"}
            
            if not signature or len(signature) < 16:
                return {"valid": False, "reason": "invalid_signature", "message": "Invalid signature"}
            
            return {
                "valid": True,
                "merchant_name": merchant["name"],
                "tax_id": merchant["tax_id"],
                "verified_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {"valid": False, "reason": "error", "message": str(e)}


# ============== AUTH ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "TAXXA API v2.0", "status": "operational"}

@api_router.post("/auth/register")
async def register(data: UserRegister):
    phone = data.phone_number.strip()
    existing = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    otp = generate_otp()
    await db.otps.update_one(
        {"phone_number": phone},
        {"$set": {
            "otp": otp,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
        }},
        upsert=True
    )
    
    logger.info(f"OTP for {phone}: {otp}")
    return {"message": "OTP sent successfully", "phone_number": phone, "otp_for_testing": otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    phone = data.phone_number.strip()
    otp_record = await db.otps.find_one({"phone_number": phone})
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found")
    
    if otp_record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.otps.update_one({"phone_number": phone}, {"$set": {"verified": True}})
    return {"message": "OTP verified", "phone_number": phone}

@api_router.post("/auth/create-password", response_model=TokenResponse)
async def create_password(data: PasswordCreate):
    phone = data.phone_number.strip()
    otp_record = await db.otps.find_one({"phone_number": phone, "verified": True})
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Please verify OTP first")
    
    existing = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    now = datetime.now(timezone.utc)
    user_id = str(ObjectId())
    referral_code = generate_referral_code(user_id)
    
    user_data = {
        "_id": ObjectId(user_id),
        "phone_number": phone,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "is_verified": True,
        "created_at": now.isoformat(),
        "total_scans": 0,
        "valid_scans": 0,
        "total_entries": 0,
        "referral_code": referral_code,
        "total_referrals": 0,
        "status": "active"
    }
    
    await db.users.insert_one(user_data)
    
    # Handle referral if provided
    if data.referral_code:
        referrer = await db.users.find_one({"referral_code": data.referral_code})
        if referrer:
            await db.referrals.insert_one({
                "referrer_id": str(referrer["_id"]),
                "referred_user_id": user_id,
                "referral_code": data.referral_code,
                "status": "pending",
                "created_at": now.isoformat()
            })
            await db.users.update_one(
                {"_id": referrer["_id"]},
                {"$inc": {"total_referrals": 1}}
            )
    
    await db.otps.delete_one({"phone_number": phone})
    token = create_jwt_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            phone_number=phone,
            name=data.name,
            created_at=now,
            total_scans=0,
            valid_scans=0,
            total_entries=0
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    phone = data.phone_number.strip()
    user = await db.users.find_one({"phone_number": phone, "is_verified": True})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    token = create_jwt_token(user_id)
    
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    elif created_at is None:
        created_at = datetime.now(timezone.utc)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            phone_number=phone,
            name=user.get("name"),
            created_at=created_at,
            total_scans=user.get("total_scans", 0),
            valid_scans=user.get("valid_scans", 0),
            total_entries=user.get("total_entries", 0)
        )
    )


# ============== SCAN ENDPOINTS ==============

@api_router.post("/scan", response_model=ScanResponse)
async def scan_receipt(data: ScanRequest, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    try:
        receipt_data = json.loads(data.qr_data)
    except:
        receipt_data = {"raw_data": data.qr_data}
    
    receipt_id = receipt_data.get("receipt_id", hashlib.md5(data.qr_data.encode()).hexdigest())
    
    # Check duplicate
    existing = await db.scans.find_one({"receipt_id": receipt_id, "status": "valid"})
    if existing:
        return ScanResponse(
            id=str(uuid.uuid4()),
            status="duplicate",
            message="This receipt has already been scanned",
            entries_earned=0,
            receipt_data=receipt_data
        )
    
    # Verify receipt
    verification = MockRevenueAuthorityAPI.verify_receipt(receipt_data)
    now = datetime.now(timezone.utc)
    
    if verification["valid"]:
        # Update streak and get bonuses
        streak_info = await update_user_streak(user_id)
        
        # Calculate entries with multiplier
        base_amount = receipt_data.get("amount", 100)
        base_entries = max(1, int(base_amount / 50))
        multiplied_entries = int(base_entries * streak_info["multiplier"])
        bonus_entries = streak_info["bonus_entries"]
        total_entries = multiplied_entries + bonus_entries
        
        scan_record = {
            "user_id": user_id,
            "receipt_id": receipt_id,
            "qr_data": data.qr_data,
            "timestamp": now.isoformat(),
            "status": "valid",
            "entries_earned": total_entries,
            "streak_bonus": bonus_entries,
            "receipt_data": receipt_data,
            "verification_result": verification
        }
        result = await db.scans.insert_one(scan_record)
        
        # Update user stats
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {
                "total_scans": 1,
                "valid_scans": 1,
                "total_entries": total_entries
            }}
        )
        
        # Add to active draws
        active_draws = await db.draws.find({"status": "active"}).to_list(100)
        for draw in active_draws:
            await db.draw_entries.update_one(
                {"user_id": user_id, "draw_id": str(draw["_id"])},
                {"$inc": {"entries": total_entries}},
                upsert=True
            )
            await db.draws.update_one(
                {"_id": draw["_id"]},
                {"$inc": {"total_entries": total_entries}}
            )
        
        # Check for new badges
        updated_user = await db.users.find_one({"_id": user["_id"]})
        user_stats = {
            "valid_scans": updated_user.get("valid_scans", 0),
            "current_streak": streak_info["current_streak"],
            "total_referrals": updated_user.get("total_referrals", 0)
        }
        new_badges = await check_and_award_badges(user_id, user_stats)
        
        return ScanResponse(
            id=str(result.inserted_id),
            status="valid",
            message=f"Receipt verified! Earned {total_entries} entries" + (f" (+{bonus_entries} streak bonus)" if bonus_entries else ""),
            entries_earned=total_entries,
            streak_bonus=bonus_entries,
            receipt_data={
                **receipt_data,
                "merchant_name": verification.get("merchant_name"),
                "verified_at": verification.get("verified_at")
            },
            new_badges=new_badges
        )
    else:
        scan_record = {
            "user_id": user_id,
            "receipt_id": receipt_id,
            "timestamp": now.isoformat(),
            "status": "invalid",
            "reason": verification.get("reason"),
            "entries_earned": 0
        }
        result = await db.scans.insert_one(scan_record)
        
        await db.users.update_one({"_id": user["_id"]}, {"$inc": {"total_scans": 1}})
        
        return ScanResponse(
            id=str(result.inserted_id),
            status="invalid",
            message=verification.get("message", "Invalid receipt"),
            entries_earned=0,
            receipt_data=receipt_data
        )

@api_router.get("/scan/history")
async def get_scan_history(user: dict = Depends(get_current_user), limit: int = 50):
    user_id = str(user["_id"])
    scans = await db.scans.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for scan in scans:
        if "_id" in scan:
            scan["id"] = str(scan.pop("_id"))
    
    return scans


# ============== DRAW ENDPOINTS ==============

@api_router.get("/draws")
async def get_draws(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    draws = await db.draws.find({}, {"_id": 1, "draw_type": 1, "name": 1, "start_date": 1, "end_date": 1, "status": 1, "prize_tiers": 1, "total_entries": 1}).sort("end_date", -1).to_list(100)
    
    result = []
    for draw in draws:
        draw_id = str(draw["_id"])
        entry = await db.draw_entries.find_one({"user_id": user_id, "draw_id": draw_id})
        user_entries = entry["entries"] if entry else 0
        
        result.append({
            "id": draw_id,
            "draw_type": draw.get("draw_type"),
            "name": draw.get("name", f"{draw.get('draw_type', 'Weekly').title()} Draw"),
            "start_date": draw.get("start_date"),
            "end_date": draw.get("end_date"),
            "status": draw.get("status"),
            "prize_tiers": draw.get("prize_tiers", []),
            "total_entries": draw.get("total_entries", 0),
            "user_entries": user_entries
        })
    
    return result

@api_router.get("/draws/active")
async def get_active_draws(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    draws = await db.draws.find({"status": "active"}).to_list(100)
    
    result = []
    for draw in draws:
        draw_id = str(draw["_id"])
        entry = await db.draw_entries.find_one({"user_id": user_id, "draw_id": draw_id})
        user_entries = entry["entries"] if entry else 0
        
        result.append({
            "id": draw_id,
            "draw_type": draw.get("draw_type"),
            "name": draw.get("name", f"{draw.get('draw_type', 'Weekly').title()} Draw"),
            "start_date": draw.get("start_date"),
            "end_date": draw.get("end_date"),
            "draw_date": draw.get("draw_date"),
            "status": draw.get("status"),
            "prize_tiers": draw.get("prize_tiers", []),
            "total_entries": draw.get("total_entries", 0),
            "user_entries": user_entries
        })
    
    return result


# ============== USER STATS & GAMIFICATION ==============

@api_router.get("/user/stats")
async def get_user_stats(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    # Get streak info
    streak = await db.streaks.find_one({"user_id": user_id})
    streak_info = {
        "current_streak": streak.get("current_streak", 0) if streak else 0,
        "longest_streak": streak.get("longest_streak", 0) if streak else 0,
        "multiplier": streak.get("streak_multiplier", 1.0) if streak else 1.0
    }
    
    # Get active draw entries
    active_draws = await db.draws.find({"status": "active"}).to_list(100)
    current_entries = 0
    upcoming_draws = []
    
    for draw in active_draws:
        draw_id = str(draw["_id"])
        entry = await db.draw_entries.find_one({"user_id": user_id, "draw_id": draw_id})
        entries = entry["entries"] if entry else 0
        current_entries += entries
        
        upcoming_draws.append({
            "id": draw_id,
            "draw_type": draw.get("draw_type"),
            "name": draw.get("name"),
            "end_date": draw.get("end_date"),
            "user_entries": entries,
            "total_prize": sum(t.get("amount", 0) * t.get("winners", 1) for t in draw.get("prize_tiers", []))
        })
    
    # Get badges
    user_badges = await db.badges.find({"user_id": user_id}, {"_id": 0, "badge_id": 1, "awarded_at": 1}).to_list(100)
    badge_ids = [b["badge_id"] for b in user_badges]
    badge_defs = await db.badge_definitions.find({"id": {"$in": badge_ids}}, {"_id": 0}).to_list(100)
    
    return {
        "total_scans": user.get("total_scans", 0),
        "valid_scans": user.get("valid_scans", 0),
        "total_entries": user.get("total_entries", 0),
        "current_draw_entries": current_entries,
        "streak": streak_info,
        "upcoming_draws": upcoming_draws,
        "badges": badge_defs,
        "past_winnings": []
    }

@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        pass
    elif isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    else:
        created_at = datetime.now(timezone.utc).isoformat()
    
    return {
        "id": str(user["_id"]),
        "phone_number": user["phone_number"],
        "name": user.get("name"),
        "created_at": created_at,
        "total_scans": user.get("total_scans", 0),
        "valid_scans": user.get("valid_scans", 0),
        "total_entries": user.get("total_entries", 0),
        "referral_code": user.get("referral_code")
    }

@api_router.get("/badges")
async def get_all_badges(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    all_badges = await db.badge_definitions.find({}, {"_id": 0}).to_list(100)
    user_badges = await db.badges.find({"user_id": user_id}).to_list(100)
    earned_ids = {b["badge_id"] for b in user_badges}
    
    result = []
    for badge in all_badges:
        result.append({
            **badge,
            "earned": badge["id"] in earned_ids,
            "earned_at": next((b.get("awarded_at") for b in user_badges if b["badge_id"] == badge["id"]), None)
        })
    
    return result

@api_router.get("/streaks")
async def get_streak(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    streak = await db.streaks.find_one({"user_id": user_id}, {"_id": 0})
    
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "streak_multiplier": 1.0,
            "next_milestone": 3,
            "next_reward": "+1 bonus entry"
        }
    
    current = streak.get("current_streak", 0)
    
    # Calculate next milestone
    if current < 3:
        next_milestone = 3
        next_reward = "1.1x multiplier"
    elif current < 7:
        next_milestone = 7
        next_reward = "1.2x multiplier + 2 bonus entries"
    elif current < 30:
        next_milestone = 30
        next_reward = "5 bonus entries"
    else:
        next_milestone = None
        next_reward = "Maximum streak achieved!"
    
    return {
        "current_streak": current,
        "longest_streak": streak.get("longest_streak", 0),
        "streak_multiplier": streak.get("streak_multiplier", 1.0),
        "last_scan_date": streak.get("last_scan_date"),
        "next_milestone": next_milestone,
        "next_reward": next_reward
    }


# ============== LEADERBOARD ==============

@api_router.get("/leaderboard")
async def get_leaderboard(draw_id: Optional[str] = None, limit: int = 50):
    if draw_id:
        # Leaderboard for specific draw
        entries = await db.draw_entries.find({"draw_id": draw_id}).sort("entries", -1).limit(limit).to_list(limit)
        
        result = []
        for i, entry in enumerate(entries):
            user = await db.users.find_one({"_id": ObjectId(entry["user_id"])})
            if user:
                phone = user.get("phone_number", "")
                masked = phone[:3] + "***" + phone[-2:] if len(phone) >= 5 else "***"
                result.append({
                    "rank": i + 1,
                    "name": user.get("name", "Anonymous"),
                    "phone_masked": masked,
                    "entries": entry["entries"]
                })
        return result
    else:
        # Global leaderboard by total entries
        users = await db.users.find(
            {"is_verified": True},
            {"_id": 1, "name": 1, "phone_number": 1, "total_entries": 1}
        ).sort("total_entries", -1).limit(limit).to_list(limit)
        
        result = []
        for i, user in enumerate(users):
            phone = user.get("phone_number", "")
            masked = phone[:3] + "***" + phone[-2:] if len(phone) >= 5 else "***"
            result.append({
                "rank": i + 1,
                "name": user.get("name", "Anonymous"),
                "phone_masked": masked,
                "entries": user.get("total_entries", 0)
            })
        return result


# ============== REFERRAL SYSTEM ==============

@api_router.get("/referral/stats")
async def get_referral_stats(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    referral_code = user.get("referral_code")
    
    if not referral_code:
        referral_code = generate_referral_code(user_id)
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"referral_code": referral_code}})
    
    total = await db.referrals.count_documents({"referrer_id": user_id})
    active = await db.referrals.count_documents({"referrer_id": user_id, "status": {"$ne": "pending"}})
    
    return {
        "referral_code": referral_code,
        "referral_link": f"https://taxxa.io/ref/{referral_code}",
        "total_referrals": total,
        "active_referrals": active,
        "bonus_entries_earned": user.get("referral_entries", 0),
        "max_referrals": 20,
        "referrals_remaining": max(0, 20 - total)
    }

@api_router.get("/referral/list")
async def get_referral_list(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    referrals = await db.referrals.find({"referrer_id": user_id}).sort("created_at", -1).to_list(50)
    
    result = []
    for ref in referrals:
        referred = await db.users.find_one({"_id": ObjectId(ref["referred_user_id"])})
        if referred:
            phone = referred.get("phone_number", "")
            masked = phone[:3] + "***" + phone[-2:] if len(phone) >= 5 else "***"
            result.append({
                "id": str(ref.get("_id", "")),
                "phone_masked": masked,
                "name": referred.get("name", "Anonymous"),
                "status": ref.get("status", "pending"),
                "joined_at": ref.get("created_at")
            })
    
    return {"referrals": result}


# ============== SOCIAL FEATURES ==============

@api_router.post("/social/share-token")
async def generate_share_token(user: dict = Depends(get_current_user)):
    """Generate a shareable token for social media"""
    user_id = str(user["_id"])
    
    share_data = {
        "user_id": user_id,
        "name": user.get("name", "A TAXXA User"),
        "entries": user.get("total_entries", 0),
        "scans": user.get("valid_scans", 0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    token = secrets.token_urlsafe(16)
    await db.share_tokens.update_one(
        {"token": token},
        {"$set": {**share_data, "token": token}},
        upsert=True
    )
    
    return {
        "share_url": f"https://taxxa.io/share/{token}",
        "message": f"I've earned {share_data['entries']} entries in TAXXA by scanning {share_data['scans']} receipts! Join me and win prizes while helping tax compliance. #TAXXA"
    }

@api_router.post("/challenges")
async def create_challenge(data: ChallengeCreate, user: dict = Depends(get_current_user)):
    """Create a challenge with a friend"""
    user_id = str(user["_id"])
    
    # Find friend by phone
    friend = await db.users.find_one({"phone_number": data.friend_phone, "is_verified": True})
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")
    
    friend_id = str(friend["_id"])
    if friend_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot challenge yourself")
    
    now = datetime.now(timezone.utc)
    challenge = {
        "challenger_id": user_id,
        "challenged_id": friend_id,
        "challenge_type": data.challenge_type,
        "target": data.target,
        "challenger_progress": 0,
        "challenged_progress": 0,
        "status": "pending",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=7)).isoformat()
    }
    
    result = await db.challenges.insert_one(challenge)
    
    return {
        "id": str(result.inserted_id),
        "message": f"Challenge sent to {friend.get('name', 'your friend')}!",
        "challenge": challenge
    }

@api_router.get("/challenges")
async def get_challenges(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    challenges = await db.challenges.find({
        "$or": [{"challenger_id": user_id}, {"challenged_id": user_id}]
    }).sort("created_at", -1).to_list(50)
    
    result = []
    for c in challenges:
        opponent_id = c["challenged_id"] if c["challenger_id"] == user_id else c["challenger_id"]
        opponent = await db.users.find_one({"_id": ObjectId(opponent_id)})
        
        is_challenger = c["challenger_id"] == user_id
        my_progress = c["challenger_progress"] if is_challenger else c["challenged_progress"]
        their_progress = c["challenged_progress"] if is_challenger else c["challenger_progress"]
        
        result.append({
            "id": str(c["_id"]),
            "opponent_name": opponent.get("name", "Anonymous") if opponent else "Unknown",
            "challenge_type": c["challenge_type"],
            "target": c["target"],
            "my_progress": my_progress,
            "their_progress": their_progress,
            "status": c["status"],
            "is_challenger": is_challenger,
            "expires_at": c.get("expires_at")
        })
    
    return result


# ============== ANALYTICS ENDPOINTS ==============

@api_router.get("/analytics/overview")
async def get_analytics_overview(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)
    
    # Get scan trends for last 7 days
    seven_days_ago = now - timedelta(days=7)
    scans = await db.scans.find({
        "user_id": user_id,
        "timestamp": {"$gte": seven_days_ago.isoformat()}
    }).to_list(1000)
    
    # Group by day
    daily_scans = {}
    daily_entries = {}
    for scan in scans:
        ts = scan.get("timestamp", "")
        if isinstance(ts, str):
            day = ts[:10]
        else:
            day = ts.strftime("%Y-%m-%d")
        
        daily_scans[day] = daily_scans.get(day, 0) + 1
        if scan.get("status") == "valid":
            daily_entries[day] = daily_entries.get(day, 0) + scan.get("entries_earned", 0)
    
    # Build chart data
    chart_data = []
    for i in range(7):
        day = (now - timedelta(days=6-i)).strftime("%Y-%m-%d")
        chart_data.append({
            "date": day,
            "scans": daily_scans.get(day, 0),
            "entries": daily_entries.get(day, 0)
        })
    
    # Win probability estimate
    active_draw = await db.draws.find_one({"status": "active"})
    win_probability = 0
    if active_draw:
        total = active_draw.get("total_entries", 1)
        entry = await db.draw_entries.find_one({"user_id": user_id, "draw_id": str(active_draw["_id"])})
        user_entries = entry["entries"] if entry else 0
        if total > 0:
            win_probability = min(100, (user_entries / total) * 100)
    
    return {
        "chart_data": chart_data,
        "summary": {
            "total_scans_7d": sum(daily_scans.values()),
            "total_entries_7d": sum(daily_entries.values()),
            "average_daily_scans": round(sum(daily_scans.values()) / 7, 1),
            "win_probability": round(win_probability, 2)
        }
    }


# ============== TEST ENDPOINTS ==============

@api_router.get("/test/generate-qr")
async def generate_test_qr(merchant_id: str = "MER-001", amount: float = 100.0):
    receipt_id = f"REC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
    merchant_info = MockRevenueAuthorityAPI.REGISTERED_MERCHANTS.get(merchant_id, {})
    
    receipt_data = {
        "receipt_id": receipt_id,
        "merchant_id": merchant_id,
        "merchant_name": merchant_info.get("name", "Unknown"),
        "amount": amount,
        "tax_amount": round(amount * 0.18, 2),
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "signature": hashlib.sha256(f"{receipt_id}{amount}".encode()).hexdigest()[:32]
    }
    
    return {"qr_data": json.dumps(receipt_data), "receipt_data": receipt_data}

@api_router.get("/test/merchants")
async def get_test_merchants():
    return [{"id": k, **v} for k, v in MockRevenueAuthorityAPI.REGISTERED_MERCHANTS.items()]


# ============== I18N CONFIG ==============

@api_router.get("/config/languages")
async def get_supported_languages():
    return {
        "languages": [
            {"code": "en", "name": "English", "native": "English"},
            {"code": "sw", "name": "Swahili", "native": "Kiswahili"},
            {"code": "fr", "name": "French", "native": "Français"}
        ],
        "default": "en"
    }


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
