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
    status: str  # active, completed, upcoming
    prize_tiers: List[Dict[str, Any]]
    total_entries: int = 0
    winners: List[Dict[str, Any]] = []

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
        "past_winnings": past_winnings
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


# ============== ADMIN ENDPOINTS ==============

@api_router.post("/admin/draws/create")
async def create_draw(
    draw_type: str = "weekly",
    days_duration: int = 7,
    prize_tiers: List[Dict] = None
):
    """Create a new draw (admin endpoint)"""
    if prize_tiers is None:
        prize_tiers = [
            {"tier": 1, "name": "Grand Prize", "amount": 10000, "winners": 1},
            {"tier": 2, "name": "Second Prize", "amount": 5000, "winners": 3},
            {"tier": 3, "name": "Third Prize", "amount": 1000, "winners": 10},
        ]
    
    now = datetime.utcnow()
    
    draw_data = {
        "draw_type": draw_type,
        "start_date": now,
        "end_date": now + timedelta(days=days_duration),
        "status": "active",
        "prize_tiers": prize_tiers,
        "total_entries": 0,
        "winners": [],
        "created_at": now
    }
    
    result = await db.draws.insert_one(draw_data)
    
    return {"id": str(result.inserted_id), "message": f"Draw created successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin statistics"""
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
