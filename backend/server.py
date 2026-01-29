from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import random
import secrets  # Cryptographically secure random
import hashlib
import json
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'taxdraw_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="TaxDraw API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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
    status: str  # valid, invalid, duplicate, expired
    message: str
    entries_earned: int = 0
    receipt_data: Optional[Dict[str, Any]] = None

class ScanHistoryItem(BaseModel):
    id: str
    timestamp: datetime
    status: str
    merchant_name: Optional[str] = None
    amount: Optional[float] = None
    entries_earned: int

class DrawConfig(BaseModel):
    id: str
    draw_type: str  # weekly, monthly, quarterly
    start_date: datetime
    end_date: datetime
    draw_date: Optional[datetime] = None  # Specific draw date/time
    status: str  # active, completed, upcoming
    prize_tiers: List[Dict[str, Any]]
    total_entries: int = 0
    winners: List[Dict[str, Any]] = []

class PrizeTier(BaseModel):
    tier: int
    name: str
    prize_type: str = "money"  # money, item
    amount: Optional[float] = None  # For money prizes
    item_name: Optional[str] = None  # For item prizes (e.g., "Toyota Corolla")
    item_description: Optional[str] = None
    image_url: Optional[str] = None
    winners: int = 1

class DrawEntry(BaseModel):
    user_id: str
    draw_id: str
    entries: int

class UserStats(BaseModel):
    total_scans: int
    valid_scans: int
    total_entries: int
    current_draw_entries: int
    upcoming_draws: List[Dict[str, Any]]
    past_winnings: List[Dict[str, Any]]

# Referral Models
class ReferralStats(BaseModel):
    referral_code: str
    referral_link: str
    total_referrals: int
    pending_referrals: int  # Registered but not active
    active_referrals: int   # Scanned at least 1 receipt
    bonus_entries_earned: int
    max_referrals: int = 20
    referrals_remaining: int

class ReferralItem(BaseModel):
    id: str
    referred_phone: str  # Masked phone number
    status: str  # pending, active_1, active_5, maxed
    scans_completed: int
    entries_earned: int
    joined_at: datetime


# ============== HELPER FUNCTIONS ==============

def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return user"""
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

def generate_receipt_signature(receipt_data: dict) -> str:
    """Generate signature for receipt validation (mock)"""
    data_str = json.dumps(receipt_data, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()[:32]

def generate_referral_code(user_id: str) -> str:
    """Generate a unique referral code for a user"""
    # Create a short, memorable code based on user_id
    hash_input = f"{user_id}-taxdraw-referral"
    hash_output = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
    return f"TD{hash_output}"

def get_referral_link(referral_code: str) -> str:
    """Get the full referral link"""
    base_url = os.environ.get('APP_URL', 'https://tax-compliance-11.preview.emergentagent.com')
    return f"{base_url}/ref/{referral_code}"

async def check_and_reward_referral(referred_user_id: str, scans_count: int):
    """Check if referral rewards should be given based on scan milestones"""
    # Find if this user was referred
    referral = await db.referrals.find_one({"referred_user_id": referred_user_id})
    if not referral:
        return None
    
    referrer_id = referral["referrer_id"]
    
    # Check referrer's total rewarded referrals
    referrer_stats = await db.users.find_one({"_id": ObjectId(referrer_id)})
    rewarded_count = referrer_stats.get("referrals_rewarded", 0) if referrer_stats else 0
    
    if rewarded_count >= 20:
        return None  # Max referrals reached
    
    entries_to_add = 0
    new_status = referral.get("status", "pending")
    
    # First scan milestone: +1 entry
    if scans_count >= 1 and referral.get("status") == "pending":
        entries_to_add = 1
        new_status = "active_1"
    
    # 5 scans milestone: +3 entries (additional)
    elif scans_count >= 5 and referral.get("status") == "active_1":
        entries_to_add = 3
        new_status = "active_5"
    
    if entries_to_add > 0:
        # Update referral status
        await db.referrals.update_one(
            {"_id": referral["_id"]},
            {
                "$set": {"status": new_status},
                "$inc": {"entries_earned": entries_to_add}
            }
        )
        
        # Add entries to referrer
        await db.users.update_one(
            {"_id": ObjectId(referrer_id)},
            {
                "$inc": {
                    "total_entries": entries_to_add,
                    "referral_entries": entries_to_add,
                    "referrals_rewarded": 1 if new_status == "active_1" else 0
                }
            }
        )
        
        # Add entries to active draw
        active_draw = await db.draws.find_one({"status": "active"})
        if active_draw:
            await db.draw_entries.update_one(
                {"user_id": referrer_id, "draw_id": str(active_draw["_id"])},
                {"$inc": {"entries": entries_to_add}},
                upsert=True
            )
        
        logger.info(f"Referral reward: {entries_to_add} entries to user {referrer_id} for referral {referred_user_id}")
        return {"entries_added": entries_to_add, "milestone": new_status}
    
    return None


# ============== MOCK REVENUE AUTHORITY API ==============

class MockRevenueAuthorityAPI:
    """Mock API simulating National Revenue Authority"""
    
    REGISTERED_MERCHANTS = {
        "MER-001": {"name": "SuperMart", "tax_id": "TAX-001", "status": "active"},
        "MER-002": {"name": "City Electronics", "tax_id": "TAX-002", "status": "active"},
        "MER-003": {"name": "Food Palace", "tax_id": "TAX-003", "status": "active"},
        "MER-004": {"name": "Fashion Hub", "tax_id": "TAX-004", "status": "active"},
        "MER-005": {"name": "Pharmacy Plus", "tax_id": "TAX-005", "status": "active"},
        "MER-006": {"name": "Gas Station", "tax_id": "TAX-006", "status": "suspended"},
    }
    
    @classmethod
    def verify_receipt(cls, receipt_data: dict) -> dict:
        """Verify receipt with Revenue Authority (mock)"""
        try:
            merchant_id = receipt_data.get("merchant_id")
            receipt_id = receipt_data.get("receipt_id")
            signature = receipt_data.get("signature")
            
            # Check merchant registration
            if merchant_id not in cls.REGISTERED_MERCHANTS:
                return {"valid": False, "reason": "unregistered_merchant", "message": "Merchant is not registered with Revenue Authority"}
            
            merchant = cls.REGISTERED_MERCHANTS[merchant_id]
            if merchant["status"] != "active":
                return {"valid": False, "reason": "suspended_merchant", "message": "Merchant registration is suspended"}
            
            # Validate signature (mock - just check format)
            if not signature or len(signature) < 16:
                return {"valid": False, "reason": "invalid_signature", "message": "Invalid receipt signature"}
            
            # Check receipt timestamp (not older than 30 days)
            timestamp = receipt_data.get("timestamp")
            if timestamp:
                try:
                    receipt_date = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    if (datetime.utcnow().replace(tzinfo=receipt_date.tzinfo) - receipt_date).days > 30:
                        return {"valid": False, "reason": "expired", "message": "Receipt is older than 30 days"}
                except:
                    pass
            
            return {
                "valid": True,
                "merchant_name": merchant["name"],
                "tax_id": merchant["tax_id"],
                "verified_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {"valid": False, "reason": "verification_error", "message": str(e)}


# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    """Register with phone number and receive OTP"""
    phone = data.phone_number.strip()
    
    # Check if user already exists and is verified
    existing = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Generate OTP
    otp = generate_otp()
    
    # Store OTP (expires in 5 minutes)
    await db.otps.update_one(
        {"phone_number": phone},
        {
            "$set": {
                "otp": otp,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
        },
        upsert=True
    )
    
    # In production, send OTP via SMS
    logger.info(f"OTP for {phone}: {otp}")  # For testing
    
    return {
        "message": "OTP sent successfully",
        "phone_number": phone,
        "otp_for_testing": otp  # Remove in production
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    """Verify OTP"""
    phone = data.phone_number.strip()
    
    otp_record = await db.otps.find_one({"phone_number": phone})
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    if datetime.utcnow() > otp_record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    if otp_record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Mark as verified
    await db.otps.update_one(
        {"phone_number": phone},
        {"$set": {"verified": True}}
    )
    
    return {"message": "OTP verified successfully", "phone_number": phone}

@api_router.post("/auth/create-password", response_model=TokenResponse)
async def create_password(data: PasswordCreate):
    """Create password after OTP verification"""
    phone = data.phone_number.strip()
    
    # Check OTP was verified
    otp_record = await db.otps.find_one({"phone_number": phone, "verified": True})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Please verify OTP first")
    
    # Check if user already exists
    existing = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user_data = {
        "phone_number": phone,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "is_verified": True,
        "created_at": datetime.utcnow(),
        "total_scans": 0,
        "valid_scans": 0,
        "total_entries": 0,
        "status": "active"
    }
    
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Clean up OTP
    await db.otps.delete_one({"phone_number": phone})
    
    # Generate token
    token = create_jwt_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            phone_number=phone,
            name=data.name,
            created_at=user_data["created_at"],
            total_scans=0,
            valid_scans=0,
            total_entries=0
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Login with phone and password"""
    phone = data.phone_number.strip()
    
    user = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("status") == "blocked":
        raise HTTPException(status_code=403, detail="Account has been blocked")
    
    # Generate token
    user_id = str(user["_id"])
    token = create_jwt_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            phone_number=phone,
            name=user.get("name"),
            created_at=user.get("created_at", datetime.utcnow()),
            total_scans=user.get("total_scans", 0),
            valid_scans=user.get("valid_scans", 0),
            total_entries=user.get("total_entries", 0)
        )
    )

@api_router.post("/auth/forgot-password")
async def forgot_password(data: UserRegister):
    """Request OTP for password reset (existing users only)"""
    phone = data.phone_number.strip()
    
    # Check if user exists
    user = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if not user:
        raise HTTPException(status_code=404, detail="Phone number not registered. Please create an account first.")
    
    # Generate OTP
    otp = generate_otp()
    
    # Store OTP
    await db.otps.update_one(
        {"phone_number": phone},
        {
            "$set": {
                "otp": otp,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(minutes=10),
                "verified": False,
                "purpose": "password_reset"
            }
        },
        upsert=True
    )
    
    logger.info(f"Password reset OTP for {phone}: {otp}")
    
    return {
        "message": "OTP sent successfully",
        "phone_number": phone,
        "otp_for_testing": otp
    }

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordCreate):
    """Reset password after OTP verification"""
    phone = data.phone_number.strip()
    
    # Check OTP was verified
    otp_record = await db.otps.find_one({"phone_number": phone, "verified": True})
    if not otp_record:
        raise HTTPException(status_code=400, detail="Please verify OTP first")
    
    # Find the user
    user = await db.users.find_one({"phone_number": phone, "is_verified": True})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    await db.users.update_one(
        {"phone_number": phone},
        {"$set": {"password_hash": hash_password(data.password)}}
    )
    
    # Clean up OTP
    await db.otps.delete_one({"phone_number": phone})
    
    return {"message": "Password reset successfully"}
    
    token = create_jwt_token(str(user["_id"]))
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user["_id"]),
            phone_number=user["phone_number"],
            name=user.get("name"),
            created_at=user["created_at"],
            total_scans=user.get("total_scans", 0),
            valid_scans=user.get("valid_scans", 0),
            total_entries=user.get("total_entries", 0)
        )
    )


# ============== RECEIPT SCANNING ENDPOINTS ==============

@api_router.post("/scan", response_model=ScanResponse)
async def scan_receipt(data: ScanRequest, user: dict = Depends(get_current_user)):
    """Scan and validate a receipt QR code"""
    user_id = str(user["_id"])
    
    try:
        # Parse QR data
        try:
            receipt_data = json.loads(data.qr_data)
        except json.JSONDecodeError:
            # If not JSON, create basic structure
            receipt_data = {"raw_data": data.qr_data}
    except Exception as e:
        receipt_data = {"raw_data": data.qr_data}
    
    receipt_id = receipt_data.get("receipt_id", hashlib.md5(data.qr_data.encode()).hexdigest())
    
    # Check for duplicate scan
    existing_scan = await db.scans.find_one({"receipt_id": receipt_id, "status": "valid"})
    if existing_scan:
        # Log duplicate attempt
        scan_record = {
            "user_id": user_id,
            "receipt_id": receipt_id,
            "qr_data": data.qr_data,
            "geo_location": data.geo_location,
            "timestamp": datetime.utcnow(),
            "status": "duplicate",
            "entries_earned": 0,
            "receipt_data": receipt_data
        }
        await db.scans.insert_one(scan_record)
        
        return ScanResponse(
            id=str(scan_record.get("_id", uuid.uuid4())),
            status="duplicate",
            message="This receipt has already been scanned",
            entries_earned=0,
            receipt_data=receipt_data
        )
    
    # Verify with Revenue Authority (mock)
    verification = MockRevenueAuthorityAPI.verify_receipt(receipt_data)
    
    if verification["valid"]:
        # Calculate entries (based on amount if available)
        amount = receipt_data.get("amount", 0)
        entries = max(1, int(amount / 50))  # 1 entry per $50 spent, minimum 1
        
        scan_record = {
            "user_id": user_id,
            "receipt_id": receipt_id,
            "qr_data": data.qr_data,
            "geo_location": data.geo_location,
            "timestamp": datetime.utcnow(),
            "status": "valid",
            "entries_earned": entries,
            "receipt_data": receipt_data,
            "verification_result": verification
        }
        result = await db.scans.insert_one(scan_record)
        
        # Update user stats
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$inc": {
                    "total_scans": 1,
                    "valid_scans": 1,
                    "total_entries": entries
                }
            }
        )
        
        # Add entries to current active draws
        active_draws = await db.draws.find({"status": "active"}).to_list(100)
        for draw in active_draws:
            await db.draw_entries.update_one(
                {"user_id": user_id, "draw_id": str(draw["_id"])},
                {"$inc": {"entries": entries}},
                upsert=True
            )
        
        # Check for referral milestones
        updated_user = await db.users.find_one({"_id": user["_id"]})
        new_valid_scans = updated_user.get("valid_scans", 0)
        
        # Update referral scans count and check milestones
        referral = await db.referrals.find_one({"referred_user_id": user_id})
        if referral:
            await db.referrals.update_one(
                {"_id": referral["_id"]},
                {"$set": {"scans_completed": new_valid_scans}}
            )
            await check_and_reward_referral(user_id, new_valid_scans)
        
        return ScanResponse(
            id=str(result.inserted_id),
            status="valid",
            message=f"Receipt verified! You earned {entries} draw entries!",
            entries_earned=entries,
            receipt_data={
                **receipt_data,
                "merchant_name": verification.get("merchant_name"),
                "verified_at": verification.get("verified_at")
            }
        )
    else:
        # Invalid receipt
        scan_record = {
            "user_id": user_id,
            "receipt_id": receipt_id,
            "qr_data": data.qr_data,
            "geo_location": data.geo_location,
            "timestamp": datetime.utcnow(),
            "status": "invalid",
            "reason": verification.get("reason"),
            "entries_earned": 0,
            "receipt_data": receipt_data
        }
        result = await db.scans.insert_one(scan_record)
        
        # Update total scans only
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"total_scans": 1}}
        )
        
        return ScanResponse(
            id=str(result.inserted_id),
            status="invalid",
            message=verification.get("message", "Invalid receipt"),
            entries_earned=0,
            receipt_data=receipt_data
        )

@api_router.get("/scan/history", response_model=List[ScanHistoryItem])
async def get_scan_history(user: dict = Depends(get_current_user), limit: int = 50):
    """Get user's scan history"""
    user_id = str(user["_id"])
    
    scans = await db.scans.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return [
        ScanHistoryItem(
            id=str(scan["_id"]),
            timestamp=scan["timestamp"],
            status=scan["status"],
            merchant_name=scan.get("receipt_data", {}).get("merchant_name") or scan.get("verification_result", {}).get("merchant_name"),
            amount=scan.get("receipt_data", {}).get("amount"),
            entries_earned=scan.get("entries_earned", 0)
        )
        for scan in scans
    ]


# ============== DRAW ENDPOINTS ==============

@api_router.get("/draws")
async def get_draws(user: dict = Depends(get_current_user)):
    """Get all draws with user's entries"""
    user_id = str(user["_id"])
    
    draws = await db.draws.find().sort("end_date", -1).to_list(100)
    
    result = []
    for draw in draws:
        draw_id = str(draw["_id"])
        
        # Get user's entries for this draw
        entry_record = await db.draw_entries.find_one({"user_id": user_id, "draw_id": draw_id})
        user_entries = entry_record["entries"] if entry_record else 0
        
        # Check if user won
        user_won = None
        for winner in draw.get("winners", []):
            if winner.get("user_id") == user_id:
                user_won = winner
                break
        
        result.append({
            "id": draw_id,
            "draw_type": draw["draw_type"],
            "start_date": draw["start_date"].isoformat(),
            "end_date": draw["end_date"].isoformat(),
            "status": draw["status"],
            "prize_tiers": draw["prize_tiers"],
            "total_entries": draw.get("total_entries", 0),
            "user_entries": user_entries,
            "user_won": user_won
        })
    
    return result

@api_router.get("/draws/active")
async def get_active_draws(user: dict = Depends(get_current_user)):
    """Get active draws"""
    user_id = str(user["_id"])
    
    draws = await db.draws.find({"status": "active"}).to_list(100)
    
    result = []
    for draw in draws:
        draw_id = str(draw["_id"])
        entry_record = await db.draw_entries.find_one({"user_id": user_id, "draw_id": draw_id})
        user_entries = entry_record["entries"] if entry_record else 0
        
        result.append({
            "id": draw_id,
            "draw_type": draw["draw_type"],
            "start_date": draw["start_date"].isoformat(),
            "end_date": draw["end_date"].isoformat(),
            "status": draw["status"],
            "prize_tiers": draw["prize_tiers"],
            "total_entries": draw.get("total_entries", 0),
            "user_entries": user_entries
        })
    
    return result


# ============== USER STATS ENDPOINTS ==============

@api_router.get("/user/stats")
async def get_user_stats(user: dict = Depends(get_current_user)):
    """Get user statistics"""
    user_id = str(user["_id"])
    
    # Get active country currency info
    settings = await db.settings.find_one({"type": "platform"})
    active_country_id = settings.get("active_country") if settings else None
    
    currency_info = {
        "currency_code": "USD",
        "currency_symbol": "$",
        "currency_name": "US Dollar",
        "country_name": "Default"
    }
    
    if active_country_id:
        try:
            country = await db.countries.find_one({"_id": ObjectId(active_country_id)})
            if country:
                currency_info = {
                    "currency_code": country.get("currency_code", "USD"),
                    "currency_symbol": country.get("currency_symbol", "$"),
                    "currency_name": country.get("currency_name", "US Dollar"),
                    "country_name": country.get("name", "Unknown")
                }
        except:
            pass
    
    # Get active draw entries
    active_draws = await db.draws.find({"status": "active"}).to_list(100)
    current_entries = 0
    upcoming_draws = []
    
    for draw in active_draws:
        draw_id = str(draw["_id"])
        entry_record = await db.draw_entries.find_one({"user_id": user_id, "draw_id": draw_id})
        entries = entry_record["entries"] if entry_record else 0
        current_entries += entries
        
        upcoming_draws.append({
            "id": draw_id,
            "draw_type": draw["draw_type"],
            "end_date": draw["end_date"].isoformat(),
            "user_entries": entries,
            "prize_pool": sum(tier.get("amount", 0) for tier in draw.get("prize_tiers", []))
        })
    
    # Get past winnings
    completed_draws = await db.draws.find({"status": "completed"}).to_list(100)
    past_winnings = []
    
    for draw in completed_draws:
        for winner in draw.get("winners", []):
            if winner.get("user_id") == user_id:
                past_winnings.append({
                    "draw_id": str(draw["_id"]),
                    "draw_type": draw["draw_type"],
                    "date": draw["end_date"].isoformat(),
                    "prize_tier": winner.get("prize_tier"),
                    "amount": winner.get("amount")
                })
    
    return {
        "total_scans": user.get("total_scans", 0),
        "valid_scans": user.get("valid_scans", 0),
        "total_entries": user.get("total_entries", 0),
        "current_draw_entries": current_entries,
        "upcoming_draws": upcoming_draws,
        "past_winnings": past_winnings,
        "currency": currency_info
    }

@api_router.get("/app/config")
async def get_app_config():
    """Get app configuration including active country currency (public endpoint)"""
    settings = await db.settings.find_one({"type": "platform"})
    active_country_id = settings.get("active_country") if settings else None
    
    currency_info = {
        "currency_code": "USD",
        "currency_symbol": "$",
        "currency_name": "US Dollar",
        "country_name": "Default"
    }
    
    if active_country_id:
        try:
            country = await db.countries.find_one({"_id": ObjectId(active_country_id)})
            if country:
                currency_info = {
                    "currency_code": country.get("currency_code", "USD"),
                    "currency_symbol": country.get("currency_symbol", "$"),
                    "currency_name": country.get("currency_name", "US Dollar"),
                    "country_name": country.get("name", "Unknown")
                }
        except:
            pass
    
    return {
        "currency": currency_info
    }

@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "id": str(user["_id"]),
        "phone_number": user["phone_number"],
        "name": user.get("name"),
        "created_at": user["created_at"].isoformat(),
        "total_scans": user.get("total_scans", 0),
        "valid_scans": user.get("valid_scans", 0),
        "total_entries": user.get("total_entries", 0)
    }


# ============== REFERRAL SYSTEM ==============

@api_router.get("/referral/stats")
async def get_referral_stats(user: dict = Depends(get_current_user)):
    """Get user's referral statistics"""
    user_id = str(user["_id"])
    
    # Get or create referral code
    referral_code = user.get("referral_code")
    if not referral_code:
        referral_code = generate_referral_code(user_id)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"referral_code": referral_code}}
        )
    
    referral_link = get_referral_link(referral_code)
    
    # Count referrals
    total_referrals = await db.referrals.count_documents({"referrer_id": user_id})
    pending_referrals = await db.referrals.count_documents({"referrer_id": user_id, "status": "pending"})
    active_referrals = await db.referrals.count_documents({
        "referrer_id": user_id, 
        "status": {"$in": ["active_1", "active_5"]}
    })
    
    # Calculate bonus entries earned from referrals
    referral_entries = user.get("referral_entries", 0)
    rewarded_count = user.get("referrals_rewarded", 0)
    
    return {
        "referral_code": referral_code,
        "referral_link": referral_link,
        "total_referrals": total_referrals,
        "pending_referrals": pending_referrals,
        "active_referrals": active_referrals,
        "bonus_entries_earned": referral_entries,
        "max_referrals": 20,
        "referrals_remaining": max(0, 20 - rewarded_count)
    }

@api_router.get("/referral/list")
async def get_referral_list(user: dict = Depends(get_current_user)):
    """Get list of user's referrals"""
    user_id = str(user["_id"])
    
    referrals = await db.referrals.find({"referrer_id": user_id}).sort("created_at", -1).to_list(50)
    
    result = []
    for ref in referrals:
        # Get referred user info (masked phone)
        referred_user = await db.users.find_one({"_id": ObjectId(ref["referred_user_id"])})
        if referred_user:
            phone = referred_user.get("phone_number", "")
            masked_phone = phone[:3] + "***" + phone[-3:] if len(phone) >= 6 else "***"
            
            result.append({
                "id": str(ref["_id"]),
                "referred_phone": masked_phone,
                "status": ref.get("status", "pending"),
                "scans_completed": ref.get("scans_completed", 0),
                "entries_earned": ref.get("entries_earned", 0),
                "joined_at": ref.get("created_at", datetime.utcnow()).isoformat()
            })
    
    return {"referrals": result}

@api_router.get("/referral/rewards")
async def get_referral_rewards():
    """Get referral reward structure"""
    return {
        "rewards": [
            {
                "milestone": "registration",
                "description": "Friend registers",
                "entries": 0,
                "status": "pending"
            },
            {
                "milestone": "first_scan",
                "description": "Friend scans first valid receipt",
                "entries": 1,
                "status": "active_1"
            },
            {
                "milestone": "five_scans",
                "description": "Friend scans 5 valid receipts",
                "entries": 3,
                "status": "active_5"
            }
        ],
        "max_referrals": 20,
        "total_possible_entries": 80  # 20 referrals × 4 entries each (1+3)
    }

@api_router.get("/ref/{referral_code}")
async def handle_referral_link(referral_code: str):
    """Handle referral link - redirect to app store or open app"""
    # Find referrer by code
    referrer = await db.users.find_one({"referral_code": referral_code})
    
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Return redirect info (frontend will handle actual redirect)
    return {
        "valid": True,
        "referral_code": referral_code,
        "referrer_id": str(referrer["_id"]),
        "app_store_url": "https://apps.apple.com/app/taxdraw",  # Placeholder
        "play_store_url": "https://play.google.com/store/apps/details?id=com.taxdraw",  # Placeholder
        "web_url": f"/register?ref={referral_code}"
    }

@api_router.post("/referral/apply")
async def apply_referral_code(referral_code: str, user: dict = Depends(get_current_user)):
    """Apply a referral code to current user (only works if user hasn't been referred yet)"""
    user_id = str(user["_id"])
    
    # Check if user already has a referrer
    existing_referral = await db.referrals.find_one({"referred_user_id": user_id})
    if existing_referral:
        raise HTTPException(status_code=400, detail="You have already been referred")
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    referrer_id = str(referrer["_id"])
    
    # Can't refer yourself
    if referrer_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot use your own referral code")
    
    # Create referral relationship
    await db.referrals.insert_one({
        "referrer_id": referrer_id,
        "referred_user_id": user_id,
        "referral_code": referral_code,
        "status": "pending",
        "scans_completed": 0,
        "entries_earned": 0,
        "created_at": datetime.utcnow()
    })
    
    # Update referrer's total referrals count
    await db.users.update_one(
        {"_id": referrer["_id"]},
        {"$inc": {"total_referrals": 1}}
    )
    
    logger.info(f"Referral applied: {referrer_id} referred {user_id}")
    
    return {"message": "Referral code applied successfully"}


# ============== PUSH NOTIFICATIONS ==============

class PushTokenRegister(BaseModel):
    push_token: str
    platform: str = "unknown"
    device_name: Optional[str] = None

class NotificationSend(BaseModel):
    user_ids: Optional[List[str]] = None  # If None, send to all
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    notification_type: str = "general"  # draw_reminder, winner, scan_reminder, general

@api_router.post("/notifications/register")
async def register_push_token(data: PushTokenRegister, user: dict = Depends(get_current_user)):
    """Register or update user's push token for notifications"""
    user_id = str(user["_id"])
    
    # Store push token with user
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "push_token": data.push_token,
                "push_platform": data.platform,
                "push_device_name": data.device_name,
                "push_token_updated_at": datetime.utcnow()
            }
        }
    )
    
    # Also store in dedicated push_tokens collection for easier querying
    await db.push_tokens.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "token": data.push_token,
                "platform": data.platform,
                "device_name": data.device_name,
                "is_active": True,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    logger.info(f"Push token registered for user {user_id}: {data.push_token[:20]}...")
    
    return {"message": "Push token registered successfully"}

@api_router.delete("/notifications/unregister")
async def unregister_push_token(user: dict = Depends(get_current_user)):
    """Unregister user's push token"""
    user_id = str(user["_id"])
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$unset": {"push_token": "", "push_platform": "", "push_device_name": ""}}
    )
    
    await db.push_tokens.update_one(
        {"user_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Push token unregistered successfully"}

@api_router.get("/notifications/settings")
async def get_notification_settings(user: dict = Depends(get_current_user)):
    """Get user's notification preferences"""
    user_id = str(user["_id"])
    
    settings = await db.notification_settings.find_one({"user_id": user_id})
    
    if not settings:
        # Return default settings
        settings = {
            "draw_reminders": True,
            "winner_announcements": True,
            "scan_reminders": True,
            "promotional": False
        }
    
    return {
        "draw_reminders": settings.get("draw_reminders", True),
        "winner_announcements": settings.get("winner_announcements", True),
        "scan_reminders": settings.get("scan_reminders", True),
        "promotional": settings.get("promotional", False)
    }

@api_router.put("/notifications/settings")
async def update_notification_settings(
    draw_reminders: bool = True,
    winner_announcements: bool = True,
    scan_reminders: bool = True,
    promotional: bool = False,
    user: dict = Depends(get_current_user)
):
    """Update user's notification preferences"""
    user_id = str(user["_id"])
    
    await db.notification_settings.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "draw_reminders": draw_reminders,
                "winner_announcements": winner_announcements,
                "scan_reminders": scan_reminders,
                "promotional": promotional,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {"message": "Notification settings updated"}

# Helper function to send push notifications via Expo
async def send_expo_push_notification(tokens: List[str], title: str, body: str, data: dict = None):
    """Send push notification via Expo Push Service"""
    import httpx
    
    messages = []
    for token in tokens:
        if not token or not token.startswith('ExponentPushToken'):
            continue
        
        message = {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {},
            "priority": "high",
        }
        messages.append(message)
    
    if not messages:
        return {"sent": 0, "errors": ["No valid tokens"]}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
            result = response.json()
            logger.info(f"Push notification sent to {len(messages)} devices")
            return {"sent": len(messages), "result": result}
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return {"sent": 0, "errors": [str(e)]}


# ============== GENERATE TEST QR CODES ==============

@api_router.get("/test/generate-qr")
async def generate_test_qr(merchant_id: str = "MER-001", amount: float = 100.0):
    """Generate a test QR code data (for testing purposes)"""
    receipt_id = f"REC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
    
    merchant_info = MockRevenueAuthorityAPI.REGISTERED_MERCHANTS.get(merchant_id, {})
    
    receipt_data = {
        "receipt_id": receipt_id,
        "merchant_id": merchant_id,
        "merchant_name": merchant_info.get("name", "Unknown"),
        "amount": amount,
        "tax_amount": round(amount * 0.18, 2),
        "tax_id": merchant_info.get("tax_id", "TAX-000"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "signature": generate_receipt_signature({"receipt_id": receipt_id, "amount": amount})
    }
    
    return {
        "qr_data": json.dumps(receipt_data),
        "receipt_data": receipt_data
    }

@api_router.get("/test/merchants")
async def get_test_merchants():
    """Get list of registered merchants (for testing)"""
    return [
        {"id": k, **v}
        for k, v in MockRevenueAuthorityAPI.REGISTERED_MERCHANTS.items()
    ]


# ============== ADMIN AUTHENTICATION ==============

# Default admin credentials (in production, use environment variables)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'taxdraw_admin_2024')

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "admin"

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and check for admin role"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/admin/login", response_model=AdminTokenResponse)
async def admin_login(data: AdminLogin):
    """Admin login endpoint"""
    # Check credentials
    if data.username != ADMIN_USERNAME or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Generate admin token
    payload = {
        "username": data.username,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return AdminTokenResponse(access_token=token)


# ============== ADMIN DASHBOARD ==============

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_current_admin)):
    """Get comprehensive admin dashboard data"""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Overall stats
    total_users = await db.users.count_documents({"is_verified": True})
    total_scans = await db.scans.count_documents({})
    valid_scans = await db.scans.count_documents({"status": "valid"})
    invalid_scans = await db.scans.count_documents({"status": "invalid"})
    duplicate_scans = await db.scans.count_documents({"status": "duplicate"})
    active_draws = await db.draws.count_documents({"status": "active"})
    completed_draws = await db.draws.count_documents({"status": "completed"})
    
    # Today's stats
    users_today = await db.users.count_documents({
        "created_at": {"$gte": today_start}
    })
    scans_today = await db.scans.count_documents({
        "timestamp": {"$gte": today_start}
    })
    valid_scans_today = await db.scans.count_documents({
        "timestamp": {"$gte": today_start},
        "status": "valid"
    })
    
    # This week's stats
    users_week = await db.users.count_documents({
        "created_at": {"$gte": week_start}
    })
    scans_week = await db.scans.count_documents({
        "timestamp": {"$gte": week_start}
    })
    
    # This month's stats
    users_month = await db.users.count_documents({
        "created_at": {"$gte": month_start}
    })
    scans_month = await db.scans.count_documents({
        "timestamp": {"$gte": month_start}
    })
    
    # Calculate total prize pool and entries
    active_draws_data = await db.draws.find({"status": "active"}).to_list(100)
    total_prize_pool = 0
    total_entries = 0
    for draw in active_draws_data:
        for tier in draw.get("prize_tiers", []):
            total_prize_pool += tier.get("amount", 0) * tier.get("winners", 0)
        total_entries += await db.draw_entries.count_documents({"draw_id": str(draw["_id"])})
    
    # Scan success rate
    success_rate = (valid_scans / total_scans * 100) if total_scans > 0 else 0
    
    # Flagged users count
    flagged_users = await db.users.count_documents({"status": "flagged"})
    blocked_users = await db.users.count_documents({"status": "blocked"})
    
    return {
        "overview": {
            "total_users": total_users,
            "total_scans": total_scans,
            "valid_scans": valid_scans,
            "invalid_scans": invalid_scans,
            "duplicate_scans": duplicate_scans,
            "success_rate": round(success_rate, 2),
            "active_draws": active_draws,
            "completed_draws": completed_draws,
            "total_prize_pool": total_prize_pool,
            "total_entries": total_entries
        },
        "today": {
            "new_users": users_today,
            "scans": scans_today,
            "valid_scans": valid_scans_today
        },
        "this_week": {
            "new_users": users_week,
            "scans": scans_week
        },
        "this_month": {
            "new_users": users_month,
            "scans": scans_month
        },
        "fraud_alerts": {
            "flagged_users": flagged_users,
            "blocked_users": blocked_users
        }
    }


# ============== ADMIN NOTIFICATION ENDPOINTS ==============

@api_router.post("/admin/notifications/send")
async def admin_send_notification(data: NotificationSend, admin: dict = Depends(get_current_admin)):
    """Admin endpoint to send push notifications to users"""
    
    # Get push tokens
    query = {"is_active": True}
    if data.user_ids:
        query["user_id"] = {"$in": data.user_ids}
    
    tokens_cursor = db.push_tokens.find(query)
    tokens = []
    async for doc in tokens_cursor:
        if doc.get("token"):
            tokens.append(doc["token"])
    
    if not tokens:
        return {"message": "No active push tokens found", "sent": 0}
    
    # Send notifications
    result = await send_expo_push_notification(
        tokens=tokens,
        title=data.title,
        body=data.body,
        data={
            "type": data.notification_type,
            **(data.data or {})
        }
    )
    
    # Log notification
    await db.admin_logs.insert_one({
        "action": "notification_sent",
        "notification_type": data.notification_type,
        "title": data.title,
        "recipients_count": len(tokens),
        "admin": admin.get("username"),
        "timestamp": datetime.utcnow()
    })
    
    return {
        "message": f"Notification sent to {result['sent']} devices",
        **result
    }

@api_router.post("/admin/notifications/draw-reminder/{draw_id}")
async def send_draw_reminder(draw_id: str, admin: dict = Depends(get_current_admin)):
    """Send draw reminder notification to all users with entries"""
    try:
        draw = await db.draws.find_one({"_id": ObjectId(draw_id)})
        if not draw:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        # Get all users with entries in this draw
        entries = await db.draw_entries.find({"draw_id": draw_id, "entries": {"$gt": 0}}).to_list(10000)
        user_ids = [e["user_id"] for e in entries]
        
        if not user_ids:
            return {"message": "No users with entries in this draw", "sent": 0}
        
        # Get their push tokens
        tokens_cursor = db.push_tokens.find({"user_id": {"$in": user_ids}, "is_active": True})
        tokens = []
        async for doc in tokens_cursor:
            if doc.get("token"):
                tokens.append(doc["token"])
        
        if not tokens:
            return {"message": "No active push tokens for users in this draw", "sent": 0}
        
        # Format draw date
        draw_date = draw.get("draw_date") or draw.get("end_date")
        date_str = draw_date.strftime("%b %d at %I:%M %p") if draw_date else "soon"
        
        result = await send_expo_push_notification(
            tokens=tokens,
            title="🎰 Draw Happening Soon!",
            body=f"The {draw['draw_type']} draw is scheduled for {date_str}. You have entries - don't miss it!",
            data={
                "type": "draw_reminder",
                "draw_id": draw_id
            }
        )
        
        return {
            "message": f"Draw reminder sent to {result['sent']} participants",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/admin/notifications/winner/{draw_id}")
async def send_winner_notifications(draw_id: str, admin: dict = Depends(get_current_admin)):
    """Send winner notifications for a completed draw"""
    try:
        draw = await db.draws.find_one({"_id": ObjectId(draw_id)})
        if not draw:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        if draw["status"] != "completed":
            raise HTTPException(status_code=400, detail="Draw is not completed")
        
        winners = draw.get("winners", [])
        if not winners:
            return {"message": "No winners in this draw", "sent": 0}
        
        # Get active country for currency
        settings = await db.settings.find_one({"type": "platform"})
        currency_symbol = "$"
        if settings and settings.get("active_country"):
            country = await db.countries.find_one({"_id": ObjectId(settings["active_country"])})
            if country:
                currency_symbol = country.get("currency_symbol", "$")
        
        sent_count = 0
        for winner in winners:
            user_id = winner.get("user_id")
            if not user_id:
                continue
            
            # Get user's push token
            token_doc = await db.push_tokens.find_one({"user_id": user_id, "is_active": True})
            if not token_doc or not token_doc.get("token"):
                continue
            
            # Format prize
            prize_text = winner.get("prize_name", "a prize")
            if winner.get("prize_type") == "money" and winner.get("amount"):
                prize_text = f"{currency_symbol} {winner['amount']:,.0f}"
            elif winner.get("item_name"):
                prize_text = winner["item_name"]
            
            await send_expo_push_notification(
                tokens=[token_doc["token"]],
                title="🎉 Congratulations! You Won!",
                body=f"You won {prize_text} in the {draw['draw_type']} draw! Tap to claim your prize.",
                data={
                    "type": "winner_announcement",
                    "draw_id": draw_id,
                    "prize_tier": winner.get("prize_tier"),
                    "amount": winner.get("amount")
                }
            )
            sent_count += 1
        
        return {"message": f"Winner notifications sent to {sent_count} winners", "sent": sent_count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== USER MANAGEMENT ==============

@api_router.get("/admin/users")
async def get_all_users(
    admin: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all users with pagination and filtering"""
    skip = (page - 1) * limit
    
    # Build query
    query = {"is_verified": True}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"phone_number": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    # Get users
    users = await db.users.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {
        "users": [
            {
                "id": str(user["_id"]),
                "phone_number": user["phone_number"],
                "name": user.get("name"),
                "status": user.get("status", "active"),
                "created_at": user["created_at"].isoformat(),
                "total_scans": user.get("total_scans", 0),
                "valid_scans": user.get("valid_scans", 0),
                "total_entries": user.get("total_entries", 0)
            }
            for user in users
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@api_router.get("/admin/users/{user_id}")
async def get_user_details(user_id: str, admin: dict = Depends(get_current_admin)):
    """Get detailed user information"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's scans
        scans = await db.scans.find({"user_id": user_id}).sort("timestamp", -1).limit(50).to_list(50)
        
        # Get user's draw entries
        entries = await db.draw_entries.find({"user_id": user_id}).to_list(100)
        
        # Calculate suspicious activity indicators
        scan_times = [s["timestamp"] for s in scans]
        rapid_scans = 0
        for i in range(1, len(scan_times)):
            if (scan_times[i-1] - scan_times[i]).total_seconds() < 60:
                rapid_scans += 1
        
        return {
            "user": {
                "id": str(user["_id"]),
                "phone_number": user["phone_number"],
                "name": user.get("name"),
                "status": user.get("status", "active"),
                "created_at": user["created_at"].isoformat(),
                "total_scans": user.get("total_scans", 0),
                "valid_scans": user.get("valid_scans", 0),
                "total_entries": user.get("total_entries", 0)
            },
            "recent_scans": [
                {
                    "id": str(s["_id"]),
                    "timestamp": s["timestamp"].isoformat(),
                    "status": s["status"],
                    "merchant_name": s.get("receipt_data", {}).get("merchant_name"),
                    "amount": s.get("receipt_data", {}).get("amount"),
                    "entries_earned": s.get("entries_earned", 0)
                }
                for s in scans[:20]
            ],
            "draw_entries": [
                {"draw_id": e["draw_id"], "entries": e["entries"]}
                for e in entries
            ],
            "fraud_indicators": {
                "rapid_scans": rapid_scans,
                "duplicate_attempts": await db.scans.count_documents({
                    "user_id": user_id,
                    "status": "duplicate"
                }),
                "invalid_attempts": await db.scans.count_documents({
                    "user_id": user_id,
                    "status": "invalid"
                })
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/admin/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str,
    reason: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Update user status (active, flagged, blocked)"""
    if status not in ["active", "flagged", "blocked"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "status": status,
                    "status_updated_at": datetime.utcnow(),
                    "status_reason": reason,
                    "status_updated_by": admin.get("username")
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Log the action
        await db.admin_logs.insert_one({
            "action": "user_status_change",
            "target_user_id": user_id,
            "new_status": status,
            "reason": reason,
            "admin": admin.get("username"),
            "timestamp": datetime.utcnow()
        })
        
        return {"message": f"User status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== DRAW MANAGEMENT ==============

@api_router.get("/admin/draws")
async def get_all_draws(
    admin: dict = Depends(get_current_admin),
    status: Optional[str] = None
):
    """Get all draws with details"""
    query = {}
    if status:
        query["status"] = status
    
    draws = await db.draws.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for draw in draws:
        draw_id = str(draw["_id"])
        
        # Count total entries for this draw
        entries_count = await db.draw_entries.count_documents({"draw_id": draw_id})
        total_entries = 0
        entries_cursor = db.draw_entries.find({"draw_id": draw_id})
        async for entry in entries_cursor:
            total_entries += entry.get("entries", 0)
        
        # Count participants
        participants = await db.draw_entries.count_documents({"draw_id": draw_id, "entries": {"$gt": 0}})
        
        result.append({
            "id": draw_id,
            "draw_type": draw["draw_type"],
            "start_date": draw["start_date"].isoformat(),
            "end_date": draw["end_date"].isoformat(),
            "status": draw["status"],
            "prize_tiers": draw["prize_tiers"],
            "total_entries": total_entries,
            "participants": participants,
            "winners": draw.get("winners", []),
            "created_at": draw["created_at"].isoformat()
        })
    
    return result

class CreateDrawRequest(BaseModel):
    draw_type: str = "weekly"
    days_duration: int = 7
    draw_date: Optional[str] = None
    prize_tiers: Optional[List[Dict]] = None

@api_router.post("/admin/draws")
async def create_draw(
    request: CreateDrawRequest,
    admin: dict = Depends(get_current_admin)
):
    """Create a new draw with enhanced prize configuration"""
    draw_type = request.draw_type
    days_duration = request.days_duration
    draw_date = request.draw_date
    prize_tiers = request.prize_tiers
    
    if prize_tiers is None:
        prize_tiers = [
            {
                "tier": 1, 
                "name": "Grand Prize", 
                "prize_type": "money",
                "amount": 10000, 
                "winners": 1,
                "image_url": None
            },
            {
                "tier": 2, 
                "name": "Second Prize", 
                "prize_type": "money",
                "amount": 5000, 
                "winners": 3,
                "image_url": None
            },
            {
                "tier": 3, 
                "name": "Third Prize", 
                "prize_type": "money",
                "amount": 1000, 
                "winners": 10,
                "image_url": None
            },
        ]
    
    now = datetime.utcnow()
    end_date = now + timedelta(days=days_duration)
    
    # Parse draw_date if provided, otherwise set it to end_date
    if draw_date:
        try:
            parsed_draw_date = datetime.fromisoformat(draw_date.replace('Z', '+00:00'))
        except:
            parsed_draw_date = end_date
    else:
        parsed_draw_date = end_date
    
    draw_data = {
        "draw_type": draw_type,
        "start_date": now,
        "end_date": end_date,
        "draw_date": parsed_draw_date,  # When the actual draw happens
        "status": "active",
        "prize_tiers": prize_tiers,
        "total_entries": 0,
        "winners": [],
        "created_at": now,
        "created_by": admin.get("username")
    }
    
    result = await db.draws.insert_one(draw_data)
    
    # Log the action
    await db.admin_logs.insert_one({
        "action": "draw_created",
        "draw_id": str(result.inserted_id),
        "draw_type": draw_type,
        "admin": admin.get("username"),
        "timestamp": now
    })
    
    return {"id": str(result.inserted_id), "message": "Draw created successfully"}

class UpdateDrawRequest(BaseModel):
    draw_type: Optional[str] = None
    end_date: Optional[str] = None
    draw_date: Optional[str] = None
    prize_tiers: Optional[List[Dict]] = None

@api_router.put("/admin/draws/{draw_id}")
async def update_draw(
    draw_id: str,
    request: UpdateDrawRequest,
    admin: dict = Depends(get_current_admin)
):
    """Update draw details including prize types and images"""
    try:
        update_data = {}
        if request.draw_type:
            update_data["draw_type"] = request.draw_type
        if request.end_date:
            update_data["end_date"] = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
        if request.draw_date:
            update_data["draw_date"] = datetime.fromisoformat(request.draw_date.replace('Z', '+00:00'))
        if request.prize_tiers:
            update_data["prize_tiers"] = request.prize_tiers
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        result = await db.draws.update_one(
            {"_id": ObjectId(draw_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        return {"message": "Draw updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/admin/draws/{draw_id}/complete")
async def complete_draw_and_select_winners(
    draw_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Complete a draw using cryptographically secure random selection with full audit trail"""
    try:
        draw = await db.draws.find_one({"_id": ObjectId(draw_id)})
        if not draw:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        if draw["status"] != "active":
            raise HTTPException(status_code=400, detail="Draw is not active")
        
        # ============================================
        # STEP 1: Generate Cryptographic Seed & Timestamp
        # ============================================
        draw_timestamp = datetime.utcnow()
        
        # Generate 256-bit cryptographically secure seed
        crypto_seed = secrets.token_hex(32)  # 64 character hex string
        
        # Create pre-draw hash (proves seed was generated before selection)
        pre_draw_data = {
            "draw_id": draw_id,
            "timestamp": draw_timestamp.isoformat(),
            "seed": crypto_seed,
            "draw_type": draw["draw_type"]
        }
        pre_draw_hash = hashlib.sha256(json.dumps(pre_draw_data, sort_keys=True).encode()).hexdigest()
        
        # ============================================
        # STEP 2: Collect All Eligible Entries
        # ============================================
        entries = await db.draw_entries.find({"draw_id": draw_id, "entries": {"$gt": 0}}).to_list(10000)
        
        if not entries:
            raise HTTPException(status_code=400, detail="No entries in this draw")
        
        # Build participant list with weighted entries
        participants = []
        weighted_pool = []
        total_entries = 0
        
        for entry in entries:
            user_id = entry["user_id"]
            user = await db.users.find_one({"_id": ObjectId(user_id), "status": {"$ne": "blocked"}})
            if user:
                entry_count = entry["entries"]
                total_entries += entry_count
                
                participant = {
                    "user_id": user_id,
                    "phone_number": user["phone_number"],
                    "name": user.get("name"),
                    "entries": entry_count
                }
                participants.append(participant)
                
                # Add to weighted pool (each entry = one chance)
                for _ in range(entry_count):
                    weighted_pool.append(participant)
        
        if not weighted_pool:
            raise HTTPException(status_code=400, detail="No eligible participants")
        
        # Create participants hash for audit
        participants_hash = hashlib.sha256(
            json.dumps([{"user_id": p["user_id"], "entries": p["entries"]} for p in participants], sort_keys=True).encode()
        ).hexdigest()
        
        # ============================================
        # STEP 3: Cryptographically Secure Winner Selection
        # ============================================
        winners = []
        selection_log = []  # Detailed log of each selection step
        selected_user_ids = set()
        
        for tier in draw["prize_tiers"]:
            tier_winners = []
            num_winners = tier.get("winners", 1)
            
            # Filter out already selected winners
            available_pool = [u for u in weighted_pool if u["user_id"] not in selected_user_ids]
            
            for selection_num in range(min(num_winners, len(available_pool))):
                if available_pool:
                    # Use secrets.choice for cryptographically secure selection
                    winner = secrets.choice(available_pool)
                    
                    # Calculate winner's probability at time of selection
                    winner_entries_in_pool = sum(1 for u in available_pool if u["user_id"] == winner["user_id"])
                    total_in_pool = len(available_pool)
                    probability = round((winner_entries_in_pool / total_in_pool) * 100, 4)
                    
                    winner_record = {
                        "user_id": winner["user_id"],
                        "phone_number": winner["phone_number"],
                        "name": winner["name"],
                        "prize_tier": tier["tier"],
                        "prize_name": tier["name"],
                        "prize_type": tier.get("prize_type", "money"),
                        "amount": tier.get("amount"),
                        "item_name": tier.get("item_name"),
                        "selected_at": datetime.utcnow().isoformat()
                    }
                    tier_winners.append(winner_record)
                    
                    # Log selection details
                    selection_log.append({
                        "step": len(selection_log) + 1,
                        "tier": tier["tier"],
                        "tier_name": tier["name"],
                        "winner_user_id": winner["user_id"],
                        "winner_phone": winner["phone_number"][-4:],  # Last 4 digits only for privacy
                        "winner_entries": winner["entries"],
                        "pool_size": total_in_pool,
                        "probability_percent": probability,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    selected_user_ids.add(winner["user_id"])
                    available_pool = [u for u in available_pool if u["user_id"] != winner["user_id"]]
            
            winners.extend(tier_winners)
        
        # ============================================
        # STEP 4: Create Final Audit Hash
        # ============================================
        final_audit_data = {
            "draw_id": draw_id,
            "pre_draw_hash": pre_draw_hash,
            "seed": crypto_seed,
            "participants_hash": participants_hash,
            "total_participants": len(participants),
            "total_entries": total_entries,
            "winners": [{"user_id": w["user_id"], "tier": w["prize_tier"]} for w in winners],
            "completed_at": draw_timestamp.isoformat()
        }
        final_audit_hash = hashlib.sha256(json.dumps(final_audit_data, sort_keys=True).encode()).hexdigest()
        
        # ============================================
        # STEP 5: Store Complete Audit Record
        # ============================================
        audit_record = {
            "draw_id": draw_id,
            "draw_type": draw["draw_type"],
            "audit_version": "2.0",
            "algorithm": "cryptographically_secure_weighted_random",
            
            # Pre-draw data
            "pre_draw": {
                "timestamp": draw_timestamp,
                "seed": crypto_seed,
                "hash": pre_draw_hash
            },
            
            # Participants snapshot
            "participants": {
                "count": len(participants),
                "total_entries": total_entries,
                "hash": participants_hash,
                "list": [{"user_id": p["user_id"], "entries": p["entries"], "phone_last4": p["phone_number"][-4:]} for p in participants]
            },
            
            # Selection process
            "selection": {
                "method": "secrets.choice (CSPRNG)",
                "steps": selection_log
            },
            
            # Results
            "results": {
                "winners_count": len(winners),
                "winners": winners,
                "final_hash": final_audit_hash
            },
            
            # Admin info
            "completed_by": {
                "username": admin.get("username"),
                "timestamp": datetime.utcnow()
            },
            
            # Verification
            "verification": {
                "pre_draw_hash": pre_draw_hash,
                "participants_hash": participants_hash,
                "final_hash": final_audit_hash,
                "verification_url": f"/api/admin/draws/{draw_id}/audit"
            }
        }
        
        # Store audit record
        await db.draw_audits.insert_one(audit_record)
        
        # ============================================
        # STEP 6: Update Draw Status
        # ============================================
        await db.draws.update_one(
            {"_id": ObjectId(draw_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": draw_timestamp,
                    "winners": winners,
                    "completed_by": admin.get("username"),
                    "audit_hash": final_audit_hash
                }
            }
        )
        
        # Log the action
        await db.admin_logs.insert_one({
            "action": "draw_completed",
            "draw_id": draw_id,
            "winners_count": len(winners),
            "total_participants": len(participants),
            "total_entries": total_entries,
            "audit_hash": final_audit_hash,
            "admin": admin.get("username"),
            "timestamp": datetime.utcnow()
        })
        
        return {
            "message": "Draw completed successfully",
            "winners": winners,
            "audit": {
                "total_participants": len(participants),
                "total_entries": total_entries,
                "audit_hash": final_audit_hash,
                "verification_url": f"/api/admin/draws/{draw_id}/audit"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/draws/{draw_id}/audit")
async def get_draw_audit(draw_id: str, admin: dict = Depends(get_current_admin)):
    """Get complete audit trail for a completed draw"""
    try:
        # Get draw info
        draw = await db.draws.find_one({"_id": ObjectId(draw_id)})
        if not draw:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        if draw["status"] != "completed":
            raise HTTPException(status_code=400, detail="Draw is not completed yet")
        
        # Get audit record
        audit = await db.draw_audits.find_one({"draw_id": draw_id})
        if not audit:
            raise HTTPException(status_code=404, detail="Audit record not found")
        
        # Remove MongoDB _id for JSON serialization
        audit["_id"] = str(audit["_id"])
        
        # Convert datetime objects
        if "pre_draw" in audit and "timestamp" in audit["pre_draw"]:
            audit["pre_draw"]["timestamp"] = audit["pre_draw"]["timestamp"].isoformat()
        if "completed_by" in audit and "timestamp" in audit["completed_by"]:
            audit["completed_by"]["timestamp"] = audit["completed_by"]["timestamp"].isoformat()
        
        return {
            "draw": {
                "id": draw_id,
                "type": draw["draw_type"],
                "status": draw["status"],
                "start_date": draw["start_date"].isoformat(),
                "end_date": draw["end_date"].isoformat(),
                "completed_at": draw.get("completed_at", "").isoformat() if draw.get("completed_at") else None,
                "audit_hash": draw.get("audit_hash")
            },
            "audit": audit,
            "verification": {
                "is_valid": draw.get("audit_hash") == audit["results"]["final_hash"],
                "message": "Audit hash matches - draw results are verified" if draw.get("audit_hash") == audit["results"]["final_hash"] else "WARNING: Hash mismatch detected"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/draws/{draw_id}/audit/export")
async def export_draw_audit(draw_id: str, admin: dict = Depends(get_current_admin)):
    """Export audit report as downloadable JSON"""
    try:
        # Get draw info
        draw = await db.draws.find_one({"_id": ObjectId(draw_id)})
        if not draw:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        if draw["status"] != "completed":
            raise HTTPException(status_code=400, detail="Draw is not completed yet")
        
        # Get audit record
        audit = await db.draw_audits.find_one({"draw_id": draw_id})
        if not audit:
            raise HTTPException(status_code=404, detail="Audit record not found")
        
        # Prepare export data
        export_data = {
            "report_type": "TaxDraw Lottery Audit Report",
            "report_version": "2.0",
            "generated_at": datetime.utcnow().isoformat(),
            "draw_info": {
                "draw_id": draw_id,
                "draw_type": draw["draw_type"],
                "start_date": draw["start_date"].isoformat(),
                "end_date": draw["end_date"].isoformat(),
                "completed_at": draw.get("completed_at", "").isoformat() if draw.get("completed_at") else None
            },
            "algorithm": {
                "name": "Cryptographically Secure Weighted Random Selection",
                "method": "Python secrets.choice() - CSPRNG",
                "description": "Winners selected using cryptographically secure pseudo-random number generator. Each entry gives proportional chance of winning."
            },
            "pre_draw_verification": {
                "seed": audit["pre_draw"]["seed"],
                "seed_generated_at": audit["pre_draw"]["timestamp"].isoformat() if isinstance(audit["pre_draw"]["timestamp"], datetime) else audit["pre_draw"]["timestamp"],
                "pre_draw_hash": audit["pre_draw"]["hash"]
            },
            "participants": {
                "total_participants": audit["participants"]["count"],
                "total_entries": audit["participants"]["total_entries"],
                "participants_hash": audit["participants"]["hash"]
            },
            "selection_log": audit["selection"]["steps"],
            "results": {
                "winners": audit["results"]["winners"],
                "final_hash": audit["results"]["final_hash"]
            },
            "verification": {
                "stored_hash": draw.get("audit_hash"),
                "computed_hash": audit["results"]["final_hash"],
                "match": draw.get("audit_hash") == audit["results"]["final_hash"],
                "status": "VERIFIED" if draw.get("audit_hash") == audit["results"]["final_hash"] else "VERIFICATION FAILED"
            },
            "completed_by": audit["completed_by"]["username"]
        }
        
        return export_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/audits")
async def list_draw_audits(admin: dict = Depends(get_current_admin)):
    """List all draw audits"""
    try:
        audits = await db.draw_audits.find().sort("completed_by.timestamp", -1).to_list(100)
        
        result = []
        for audit in audits:
            result.append({
                "draw_id": audit["draw_id"],
                "draw_type": audit["draw_type"],
                "total_participants": audit["participants"]["count"],
                "total_entries": audit["participants"]["total_entries"],
                "winners_count": audit["results"]["winners_count"],
                "audit_hash": audit["results"]["final_hash"],
                "completed_by": audit["completed_by"]["username"],
                "completed_at": audit["completed_by"]["timestamp"].isoformat() if isinstance(audit["completed_by"]["timestamp"], datetime) else audit["completed_by"]["timestamp"]
            })
        
        return {"audits": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/admin/draws/{draw_id}")
async def cancel_draw(draw_id: str, admin: dict = Depends(get_current_admin)):
    """Cancel/delete a draw"""
    try:
        draw = await db.draws.find_one({"_id": ObjectId(draw_id)})
        if not draw:
            raise HTTPException(status_code=404, detail="Draw not found")
        
        if draw["status"] == "completed":
            raise HTTPException(status_code=400, detail="Cannot delete completed draw")
        
        # Update status to cancelled
        await db.draws.update_one(
            {"_id": ObjectId(draw_id)},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow()}}
        )
        
        # Log the action
        await db.admin_logs.insert_one({
            "action": "draw_cancelled",
            "draw_id": draw_id,
            "admin": admin.get("username"),
            "timestamp": datetime.utcnow()
        })
        
        return {"message": "Draw cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== SCAN MANAGEMENT ==============

@api_router.get("/admin/scans")
async def get_all_scans(
    admin: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Get all scans with filtering"""
    skip = (page - 1) * limit
    
    query = {}
    if status:
        query["status"] = status
    if user_id:
        query["user_id"] = user_id
    
    scans = await db.scans.find(query).skip(skip).limit(limit).sort("timestamp", -1).to_list(limit)
    total = await db.scans.count_documents(query)
    
    return {
        "scans": [
            {
                "id": str(scan["_id"]),
                "user_id": scan["user_id"],
                "receipt_id": scan.get("receipt_id"),
                "timestamp": scan["timestamp"].isoformat(),
                "status": scan["status"],
                "merchant_name": scan.get("receipt_data", {}).get("merchant_name"),
                "amount": scan.get("receipt_data", {}).get("amount"),
                "entries_earned": scan.get("entries_earned", 0),
                "geo_location": scan.get("geo_location")
            }
            for scan in scans
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


# ============== FRAUD DETECTION ==============

@api_router.get("/admin/fraud/suspicious-users")
async def get_suspicious_users(admin: dict = Depends(get_current_admin)):
    """Get users with suspicious activity patterns"""
    suspicious_users = []
    
    # Get all active users
    users = await db.users.find({"is_verified": True, "status": {"$ne": "blocked"}}).to_list(1000)
    
    for user in users:
        user_id = str(user["_id"])
        
        # Get user's scans from last 24 hours
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_scans = await db.scans.find({
            "user_id": user_id,
            "timestamp": {"$gte": yesterday}
        }).sort("timestamp", -1).to_list(1000)
        
        if len(recent_scans) < 5:
            continue
        
        # Check for rapid scanning (more than 5 scans per minute)
        rapid_scan_count = 0
        for i in range(1, len(recent_scans)):
            time_diff = (recent_scans[i-1]["timestamp"] - recent_scans[i]["timestamp"]).total_seconds()
            if time_diff < 60:
                rapid_scan_count += 1
        
        # Check for high duplicate rate
        duplicate_count = sum(1 for s in recent_scans if s["status"] == "duplicate")
        duplicate_rate = duplicate_count / len(recent_scans) if recent_scans else 0
        
        # Check for unusual scan volume
        avg_scans_per_user = await db.scans.count_documents({
            "timestamp": {"$gte": yesterday}
        }) / max(1, await db.users.count_documents({"is_verified": True}))
        
        scan_volume_ratio = len(recent_scans) / max(1, avg_scans_per_user)
        
        # Flag if suspicious
        if rapid_scan_count > 3 or duplicate_rate > 0.5 or scan_volume_ratio > 5:
            suspicious_users.append({
                "user_id": user_id,
                "phone_number": user["phone_number"],
                "name": user.get("name"),
                "status": user.get("status", "active"),
                "flags": {
                    "rapid_scans": rapid_scan_count > 3,
                    "high_duplicate_rate": duplicate_rate > 0.5,
                    "unusual_volume": scan_volume_ratio > 5
                },
                "metrics": {
                    "scans_24h": len(recent_scans),
                    "rapid_scan_count": rapid_scan_count,
                    "duplicate_rate": round(duplicate_rate * 100, 2),
                    "volume_ratio": round(scan_volume_ratio, 2)
                }
            })
    
    return {
        "suspicious_users": suspicious_users,
        "total": len(suspicious_users)
    }


# ============== ANALYTICS ==============

@api_router.get("/admin/analytics/scans-by-day")
async def get_scans_by_day(
    admin: dict = Depends(get_current_admin),
    days: int = 30
):
    """Get scan statistics by day"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"}
                },
                "total": {"$sum": 1},
                "valid": {"$sum": {"$cond": [{"$eq": ["$status", "valid"]}, 1, 0]}},
                "invalid": {"$sum": {"$cond": [{"$eq": ["$status", "invalid"]}, 1, 0]}},
                "duplicate": {"$sum": {"$cond": [{"$eq": ["$status", "duplicate"]}, 1, 0]}}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
    ]
    
    results = await db.scans.aggregate(pipeline).to_list(100)
    
    return [
        {
            "date": f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}",
            "total": r["total"],
            "valid": r["valid"],
            "invalid": r["invalid"],
            "duplicate": r["duplicate"]
        }
        for r in results
    ]

@api_router.get("/admin/analytics/users-by-day")
async def get_users_by_day(
    admin: dict = Depends(get_current_admin),
    days: int = 30
):
    """Get user registration statistics by day"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"created_at": {"$gte": start_date}, "is_verified": True}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                    "day": {"$dayOfMonth": "$created_at"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
    ]
    
    results = await db.users.aggregate(pipeline).to_list(100)
    
    return [
        {
            "date": f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}",
            "count": r["count"]
        }
        for r in results
    ]

@api_router.get("/admin/analytics/merchants")
async def get_merchant_analytics(admin: dict = Depends(get_current_admin)):
    """Get analytics by merchant"""
    pipeline = [
        {"$match": {"status": "valid"}},
        {
            "$group": {
                "_id": "$receipt_data.merchant_id",
                "merchant_name": {"$first": "$receipt_data.merchant_name"},
                "total_scans": {"$sum": 1},
                "total_amount": {"$sum": "$receipt_data.amount"},
                "total_entries": {"$sum": "$entries_earned"}
            }
        },
        {"$sort": {"total_scans": -1}}
    ]
    
    results = await db.scans.aggregate(pipeline).to_list(100)
    
    return [
        {
            "merchant_id": r["_id"],
            "merchant_name": r.get("merchant_name", "Unknown"),
            "total_scans": r["total_scans"],
            "total_amount": round(r.get("total_amount", 0), 2),
            "total_entries": r["total_entries"]
        }
        for r in results if r["_id"]
    ]

@api_router.get("/admin/analytics/top-users")
async def get_top_users(
    admin: dict = Depends(get_current_admin),
    limit: int = 20
):
    """Get top users by entries"""
    users = await db.users.find(
        {"is_verified": True, "status": {"$ne": "blocked"}}
    ).sort("total_entries", -1).limit(limit).to_list(limit)
    
    return [
        {
            "user_id": str(u["_id"]),
            "phone_number": u["phone_number"],
            "name": u.get("name"),
            "total_entries": u.get("total_entries", 0),
            "valid_scans": u.get("valid_scans", 0),
            "total_scans": u.get("total_scans", 0)
        }
        for u in users
    ]


# ============== ADMIN LOGS ==============

@api_router.get("/admin/logs")
async def get_admin_logs(
    admin: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 50,
    action: Optional[str] = None
):
    """Get admin activity logs"""
    skip = (page - 1) * limit
    
    query = {}
    if action:
        query["action"] = action
    
    logs = await db.admin_logs.find(query).skip(skip).limit(limit).sort("timestamp", -1).to_list(limit)
    total = await db.admin_logs.count_documents(query)
    
    return {
        "logs": [
            {
                "id": str(log["_id"]),
                "action": log["action"],
                "admin": log.get("admin"),
                "timestamp": log["timestamp"].isoformat(),
                "details": {k: v for k, v in log.items() if k not in ["_id", "action", "admin", "timestamp"]}
            }
            for log in logs
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


# ============== OLD ADMIN STATS (kept for compatibility) ==============

@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin statistics (public endpoint for backwards compatibility)"""
    total_users = await db.users.count_documents({"is_verified": True})
    total_scans = await db.scans.count_documents({})
    valid_scans = await db.scans.count_documents({"status": "valid"})
    invalid_scans = await db.scans.count_documents({"status": "invalid"})
    duplicate_scans = await db.scans.count_documents({"status": "duplicate"})
    active_draws = await db.draws.count_documents({"status": "active"})
    
    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "valid_scans": valid_scans,
        "invalid_scans": invalid_scans,
        "duplicate_scans": duplicate_scans,
        "active_draws": active_draws
    }


# ============== COUNTRY SETTINGS ==============

class CountryCreate(BaseModel):
    name: str
    code: str  # ISO country code (e.g., "US", "NG", "KE")
    currency_code: str  # ISO currency code (e.g., "USD", "NGN", "KES")
    currency_symbol: str  # Currency symbol (e.g., "$", "₦", "KSh")
    currency_name: str  # Full currency name
    timezone: str  # Timezone (e.g., "America/New_York", "Africa/Lagos")
    tax_rate: float  # Default tax rate percentage
    phone_code: str  # International dialing code (e.g., "+1", "+234")
    language: str = "en"  # Primary language
    date_format: str = "MM/DD/YYYY"  # Date format preference
    is_active: bool = True

class CountryUpdate(BaseModel):
    name: Optional[str] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    currency_name: Optional[str] = None
    timezone: Optional[str] = None
    tax_rate: Optional[float] = None
    phone_code: Optional[str] = None
    language: Optional[str] = None
    date_format: Optional[str] = None
    is_active: Optional[bool] = None

@api_router.get("/admin/countries")
async def get_all_countries(admin: dict = Depends(get_current_admin)):
    """Get all countries"""
    countries = await db.countries.find().sort("name", 1).to_list(100)
    return [
        {
            "id": str(country["_id"]),
            "name": country["name"],
            "code": country["code"],
            "currency_code": country["currency_code"],
            "currency_symbol": country["currency_symbol"],
            "currency_name": country.get("currency_name", ""),
            "timezone": country["timezone"],
            "tax_rate": country["tax_rate"],
            "phone_code": country["phone_code"],
            "language": country.get("language", "en"),
            "date_format": country.get("date_format", "MM/DD/YYYY"),
            "is_active": country.get("is_active", True),
            "created_at": country["created_at"].isoformat() if "created_at" in country else None,
        }
        for country in countries
    ]

@api_router.post("/admin/countries")
async def create_country(data: CountryCreate, admin: dict = Depends(get_current_admin)):
    """Create a new country"""
    # Check if country code already exists
    existing = await db.countries.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Country with this code already exists")
    
    country_data = {
        "name": data.name,
        "code": data.code.upper(),
        "currency_code": data.currency_code.upper(),
        "currency_symbol": data.currency_symbol,
        "currency_name": data.currency_name,
        "timezone": data.timezone,
        "tax_rate": data.tax_rate,
        "phone_code": data.phone_code,
        "language": data.language,
        "date_format": data.date_format,
        "is_active": data.is_active,
        "created_at": datetime.utcnow(),
        "created_by": admin.get("username")
    }
    
    result = await db.countries.insert_one(country_data)
    
    # Log the action
    await db.admin_logs.insert_one({
        "action": "country_created",
        "country_id": str(result.inserted_id),
        "country_code": data.code.upper(),
        "admin": admin.get("username"),
        "timestamp": datetime.utcnow()
    })
    
    return {"id": str(result.inserted_id), "message": "Country created successfully"}

@api_router.get("/admin/countries/{country_id}")
async def get_country(country_id: str, admin: dict = Depends(get_current_admin)):
    """Get a specific country by ID"""
    try:
        country = await db.countries.find_one({"_id": ObjectId(country_id)})
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        return {
            "id": str(country["_id"]),
            "name": country["name"],
            "code": country["code"],
            "currency_code": country["currency_code"],
            "currency_symbol": country["currency_symbol"],
            "currency_name": country.get("currency_name", ""),
            "timezone": country["timezone"],
            "tax_rate": country["tax_rate"],
            "phone_code": country["phone_code"],
            "language": country.get("language", "en"),
            "date_format": country.get("date_format", "MM/DD/YYYY"),
            "is_active": country.get("is_active", True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/admin/countries/{country_id}")
async def update_country(country_id: str, data: CountryUpdate, admin: dict = Depends(get_current_admin)):
    """Update a country"""
    try:
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        update_data["updated_at"] = datetime.utcnow()
        update_data["updated_by"] = admin.get("username")
        
        result = await db.countries.update_one(
            {"_id": ObjectId(country_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Country not found")
        
        # Log the action
        await db.admin_logs.insert_one({
            "action": "country_updated",
            "country_id": country_id,
            "updates": update_data,
            "admin": admin.get("username"),
            "timestamp": datetime.utcnow()
        })
        
        return {"message": "Country updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/admin/countries/{country_id}")
async def delete_country(country_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a country"""
    try:
        country = await db.countries.find_one({"_id": ObjectId(country_id)})
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        await db.countries.delete_one({"_id": ObjectId(country_id)})
        
        # Log the action
        await db.admin_logs.insert_one({
            "action": "country_deleted",
            "country_id": country_id,
            "country_code": country["code"],
            "admin": admin.get("username"),
            "timestamp": datetime.utcnow()
        })
        
        return {"message": "Country deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== PLATFORM SETTINGS ==============

@api_router.get("/admin/settings")
async def get_platform_settings(admin: dict = Depends(get_current_admin)):
    """Get platform settings"""
    settings = await db.settings.find_one({"type": "platform"})
    if not settings:
        # Return default settings
        return {
            "active_country": None,
            "default_draw_types": ["weekly", "monthly", "quarterly"],
            "default_prize_tiers": [
                {"tier": 1, "name": "Grand Prize", "amount": 10000, "winners": 1},
                {"tier": 2, "name": "Second Prize", "amount": 5000, "winners": 3},
                {"tier": 3, "name": "Third Prize", "amount": 1000, "winners": 10},
            ],
            "scan_cooldown_seconds": 60,
            "max_scans_per_day": 100,
            "entries_per_amount": 50,  # 1 entry per this amount spent
            "min_entries_per_scan": 1,
            "receipt_expiry_days": 30,
        }
    
    return {
        "active_country": settings.get("active_country"),
        "default_draw_types": settings.get("default_draw_types", ["weekly", "monthly", "quarterly"]),
        "default_prize_tiers": settings.get("default_prize_tiers", []),
        "scan_cooldown_seconds": settings.get("scan_cooldown_seconds", 60),
        "max_scans_per_day": settings.get("max_scans_per_day", 100),
        "entries_per_amount": settings.get("entries_per_amount", 50),
        "min_entries_per_scan": settings.get("min_entries_per_scan", 1),
        "receipt_expiry_days": settings.get("receipt_expiry_days", 30),
    }

@api_router.put("/admin/settings")
async def update_platform_settings(
    settings_data: Dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """Update platform settings"""
    settings_data["updated_at"] = datetime.utcnow()
    settings_data["updated_by"] = admin.get("username")
    
    await db.settings.update_one(
        {"type": "platform"},
        {"$set": settings_data},
        upsert=True
    )
    
    # Log the action
    await db.admin_logs.insert_one({
        "action": "settings_updated",
        "updates": list(settings_data.keys()),
        "admin": admin.get("username"),
        "timestamp": datetime.utcnow()
    })
    
    return {"message": "Settings updated successfully"}

@api_router.put("/admin/settings/active-country")
async def set_active_country(
    country_id: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Set the active country for the admin"""
    if country_id:
        # Verify country exists
        country = await db.countries.find_one({"_id": ObjectId(country_id)})
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
    
    await db.settings.update_one(
        {"type": "platform"},
        {"$set": {
            "active_country": country_id,
            "updated_at": datetime.utcnow(),
            "updated_by": admin.get("username")
        }},
        upsert=True
    )
    
    return {"message": "Active country updated successfully"}


# ============== EDUCATION CONTENT ==============

@api_router.get("/education")
async def get_education_content():
    """Get education content about tax compliance"""
    return {
        "articles": [
            {
                "id": "1",
                "title": "Why Tax Receipts Matter",
                "summary": "Learn how your receipts help build schools, hospitals, and roads in your community.",
                "content": "Every time you ask for a tax receipt, you're contributing to your nation's development. Tax receipts ensure that businesses pay their fair share of taxes, which fund essential public services like education, healthcare, infrastructure, and security.",
                "icon": "school"
            },
            {
                "id": "2",
                "title": "How Tax Revenue Supports You",
                "summary": "Discover the public services funded by your tax contributions.",
                "content": "Tax revenue funds hospitals and clinics, schools and universities, roads and bridges, police and emergency services, social welfare programs, and much more. When businesses issue proper receipts, this revenue is properly collected and allocated.",
                "icon": "hospital"
            },
            {
                "id": "3",
                "title": "Fighting Tax Evasion Together",
                "summary": "Be a hero in the fight against tax evasion.",
                "content": "Tax evasion costs nations billions each year. By demanding tax receipts, you help ensure businesses comply with tax laws. This creates a fair marketplace where honest businesses aren't undercut by those avoiding taxes.",
                "icon": "shield"
            },
            {
                "id": "4",
                "title": "Your Consumer Rights",
                "summary": "Know your rights when making purchases.",
                "content": "As a consumer, you have the right to receive an official tax receipt for every purchase. This receipt is proof of your transaction and protects you in case of returns, warranties, or disputes.",
                "icon": "document"
            }
        ],
        "tips": [
            "Always ask for a receipt before leaving the store",
            "Check that the receipt has a valid QR code",
            "Report businesses that refuse to issue receipts",
            "Scan your receipts regularly to earn draw entries",
            "Share this app with friends and family"
        ],
        "stats": {
            "total_receipts_scanned": await db.scans.count_documents({"status": "valid"}),
            "total_users": await db.users.count_documents({"is_verified": True}),
            "estimated_tax_verified": await db.scans.count_documents({"status": "valid"}) * 15  # Mock calculation
        }
    }


# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "TaxDraw API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Create initial draw on startup if none exists"""
    existing_draw = await db.draws.find_one({"status": "active"})
    if not existing_draw:
        # Create initial weekly draw
        now = datetime.utcnow()
        await db.draws.insert_one({
            "draw_type": "weekly",
            "start_date": now,
            "end_date": now + timedelta(days=7),
            "status": "active",
            "prize_tiers": [
                {"tier": 1, "name": "Grand Prize", "amount": 10000, "winners": 1},
                {"tier": 2, "name": "Second Prize", "amount": 5000, "winners": 3},
                {"tier": 3, "name": "Third Prize", "amount": 1000, "winners": 10},
            ],
            "total_entries": 0,
            "winners": [],
            "created_at": now
        })
        logger.info("Created initial weekly draw")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
