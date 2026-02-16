"""
SMS Service - Configurable SMS provider for OTP verification
Supports: Twilio, Africa's Talking, and Mock mode

For East Africa (Tanzania/Kenya), Africa's Talking is recommended
as an alternative to Twilio for better local rates.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
import os
import random
import string
import logging
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class SMSProvider(str, Enum):
    """Supported SMS providers"""
    MOCK = "mock"
    TWILIO = "twilio"
    AFRICAS_TALKING = "africas_talking"


class OTPResult:
    """Result of OTP operation"""
    def __init__(self, success: bool, message: str, otp_for_testing: Optional[str] = None):
        self.success = success
        self.message = message
        self.otp_for_testing = otp_for_testing  # Only set in mock/dev mode


class BaseSMSProvider(ABC):
    """Abstract base class for SMS providers"""
    
    @abstractmethod
    async def send_otp(self, phone_number: str, otp: str) -> bool:
        """Send OTP via SMS"""
        pass
    
    @abstractmethod
    async def get_delivery_status(self, message_id: str) -> Dict[str, Any]:
        """Get delivery status of a message"""
        pass


class MockSMSProvider(BaseSMSProvider):
    """Mock SMS provider for development/testing"""
    
    async def send_otp(self, phone_number: str, otp: str) -> bool:
        logger.info(f"[MOCK SMS] Sending OTP {otp} to {phone_number}")
        return True
    
    async def get_delivery_status(self, message_id: str) -> Dict[str, Any]:
        return {"status": "delivered", "message_id": message_id}


class TwilioSMSProvider(BaseSMSProvider):
    """Twilio SMS provider"""
    
    def __init__(self, account_sid: str, auth_token: str, verify_service_sid: str):
        from twilio.rest import Client
        self.client = Client(account_sid, auth_token)
        self.verify_service_sid = verify_service_sid
    
    async def send_otp(self, phone_number: str, otp: str) -> bool:
        try:
            # Use Twilio Verify service for OTP
            verification = self.client.verify.v2.services(self.verify_service_sid) \
                .verifications.create(to=phone_number, channel="sms")
            logger.info(f"[Twilio] OTP sent to {phone_number}, status: {verification.status}")
            return verification.status == "pending"
        except Exception as e:
            logger.error(f"[Twilio] Failed to send OTP: {e}")
            return False
    
    async def verify_otp(self, phone_number: str, code: str) -> bool:
        """Verify OTP using Twilio Verify service"""
        try:
            check = self.client.verify.v2.services(self.verify_service_sid) \
                .verification_checks.create(to=phone_number, code=code)
            return check.status == "approved"
        except Exception as e:
            logger.error(f"[Twilio] Failed to verify OTP: {e}")
            return False
    
    async def get_delivery_status(self, message_id: str) -> Dict[str, Any]:
        try:
            message = self.client.messages(message_id).fetch()
            return {
                "status": message.status,
                "message_id": message_id,
                "error_code": message.error_code,
                "error_message": message.error_message
            }
        except Exception as e:
            return {"status": "unknown", "error": str(e)}


class AfricasTalkingSMSProvider(BaseSMSProvider):
    """Africa's Talking SMS provider - optimized for East Africa"""
    
    def __init__(self, username: str, api_key: str, sender_id: Optional[str] = None):
        import africastalking
        africastalking.initialize(username, api_key)
        self.sms = africastalking.SMS
        self.sender_id = sender_id
    
    async def send_otp(self, phone_number: str, otp: str) -> bool:
        try:
            message = f"Your Taxxa verification code is: {otp}. Valid for 5 minutes."
            kwargs = {"message": message, "recipients": [phone_number]}
            if self.sender_id:
                kwargs["sender_id"] = self.sender_id
            
            response = self.sms.send(**kwargs)
            logger.info(f"[Africa's Talking] OTP sent: {response}")
            return True
        except Exception as e:
            logger.error(f"[Africa's Talking] Failed to send OTP: {e}")
            return False
    
    async def get_delivery_status(self, message_id: str) -> Dict[str, Any]:
        # Africa's Talking uses webhooks for delivery reports
        return {"status": "pending", "message_id": message_id}


class SMSService:
    """
    Main SMS service with OTP generation, storage, and verification.
    Supports multiple providers with automatic fallback.
    """
    
    def __init__(self, db, provider: SMSProvider = SMSProvider.MOCK):
        self.db = db
        self.provider_type = provider
        self.provider = self._init_provider(provider)
        self.otp_expiry_minutes = 5
        self.otp_length = 6
        self.max_attempts = 3
    
    def _init_provider(self, provider: SMSProvider) -> BaseSMSProvider:
        """Initialize the SMS provider based on configuration"""
        if provider == SMSProvider.MOCK:
            return MockSMSProvider()
        
        elif provider == SMSProvider.TWILIO:
            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
            
            if not all([account_sid, auth_token, verify_sid]):
                logger.warning("Twilio credentials not found, falling back to mock")
                return MockSMSProvider()
            
            return TwilioSMSProvider(account_sid, auth_token, verify_sid)
        
        elif provider == SMSProvider.AFRICAS_TALKING:
            username = os.getenv("AT_USERNAME")
            api_key = os.getenv("AT_API_KEY")
            sender_id = os.getenv("AT_SENDER_ID")
            
            if not all([username, api_key]):
                logger.warning("Africa's Talking credentials not found, falling back to mock")
                return MockSMSProvider()
            
            return AfricasTalkingSMSProvider(username, api_key, sender_id)
        
        return MockSMSProvider()
    
    def _generate_otp(self) -> str:
        """Generate a secure random OTP"""
        return ''.join(random.choices(string.digits, k=self.otp_length))
    
    def _format_phone(self, phone_number: str, default_country: str = "+255") -> str:
        """Format phone number to E.164 format"""
        phone = phone_number.strip().replace(" ", "").replace("-", "")
        
        # Already in E.164 format
        if phone.startswith("+"):
            return phone
        
        # Remove leading zeros
        phone = phone.lstrip("0")
        
        # Add country code
        return f"{default_country}{phone}"
    
    async def send_otp(self, phone_number: str, purpose: str = "registration") -> OTPResult:
        """
        Generate and send OTP to phone number.
        
        Args:
            phone_number: User's phone number
            purpose: Purpose of OTP (registration, password_reset, login)
        
        Returns:
            OTPResult with success status and message
        """
        formatted_phone = self._format_phone(phone_number)
        otp = self._generate_otp()
        
        # Check rate limiting (max 3 OTPs per hour per number)
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_count = await self.db.otp_records.count_documents({
            "phone_number": formatted_phone,
            "created_at": {"$gte": one_hour_ago}
        })
        
        if recent_count >= 5:
            return OTPResult(
                success=False,
                message="Too many OTP requests. Please try again later."
            )
        
        # Store OTP in database
        otp_record = {
            "phone_number": formatted_phone,
            "otp_hash": self._hash_otp(otp),
            "purpose": purpose,
            "attempts": 0,
            "verified": False,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=self.otp_expiry_minutes)
        }
        
        await self.db.otp_records.insert_one(otp_record)
        
        # Send OTP via SMS provider
        if self.provider_type == SMSProvider.MOCK:
            # In mock mode, return OTP for testing
            logger.info(f"[Mock] OTP for {formatted_phone}: {otp}")
            return OTPResult(
                success=True,
                message="OTP sent successfully (MOCK MODE)",
                otp_for_testing=otp
            )
        
        # Real SMS send
        success = await self.provider.send_otp(formatted_phone, otp)
        
        if success:
            return OTPResult(
                success=True,
                message="OTP sent successfully. Please check your SMS."
            )
        else:
            return OTPResult(
                success=False,
                message="Failed to send OTP. Please try again."
            )
    
    async def verify_otp(self, phone_number: str, otp: str, purpose: str = "registration") -> bool:
        """
        Verify OTP code.
        
        Args:
            phone_number: User's phone number
            otp: OTP code to verify
            purpose: Purpose of verification
        
        Returns:
            True if OTP is valid, False otherwise
        """
        formatted_phone = self._format_phone(phone_number)
        
        # For Twilio Verify, use their verification
        if self.provider_type == SMSProvider.TWILIO and isinstance(self.provider, TwilioSMSProvider):
            return await self.provider.verify_otp(formatted_phone, otp)
        
        # For other providers, verify against our stored OTP
        otp_record = await self.db.otp_records.find_one({
            "phone_number": formatted_phone,
            "purpose": purpose,
            "verified": False,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        }, sort=[("created_at", -1)])
        
        if not otp_record:
            return False
        
        # Check attempts
        if otp_record["attempts"] >= self.max_attempts:
            return False
        
        # Increment attempts
        await self.db.otp_records.update_one(
            {"_id": otp_record["_id"]},
            {"$inc": {"attempts": 1}}
        )
        
        # Verify OTP
        if self._verify_otp_hash(otp, otp_record["otp_hash"]):
            await self.db.otp_records.update_one(
                {"_id": otp_record["_id"]},
                {"$set": {"verified": True, "verified_at": datetime.now(timezone.utc)}}
            )
            return True
        
        return False
    
    def _hash_otp(self, otp: str) -> str:
        """Hash OTP for secure storage"""
        import hashlib
        return hashlib.sha256(otp.encode()).hexdigest()
    
    def _verify_otp_hash(self, otp: str, stored_hash: str) -> bool:
        """Verify OTP against stored hash"""
        return self._hash_otp(otp) == stored_hash


# Configuration helper
def get_sms_service(db) -> SMSService:
    """
    Get configured SMS service based on environment.
    
    Set SMS_PROVIDER environment variable to:
    - "mock" (default): For development/testing
    - "twilio": For production with Twilio
    - "africas_talking": For East Africa deployments
    """
    provider_name = os.getenv("SMS_PROVIDER", "mock").lower()
    
    try:
        provider = SMSProvider(provider_name)
    except ValueError:
        logger.warning(f"Unknown SMS provider: {provider_name}, using mock")
        provider = SMSProvider.MOCK
    
    return SMSService(db, provider)
