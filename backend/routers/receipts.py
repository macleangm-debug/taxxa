"""
Receipt API Router - Standard Tax Receipt Processing APIs
Version: 1.0.0

This module provides industry-standard APIs for:
- QR code decoding with auto-format detection
- Receipt validation (configurable mock/real)
- Receipt submission for draw entries
- Full audit trail logging
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone, timedelta
from enum import Enum
import re
import json
import base64
import hashlib
import logging
import uuid
from bson import ObjectId

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/receipts", tags=["Receipts"])

# Security
security = HTTPBearer()


# ============== ENUMS ==============

class QRFormat(str, Enum):
    """Supported QR code formats"""
    JSON = "json"
    DELIMITED_PIPE = "delimited_pipe"
    DELIMITED_COMMA = "delimited_comma"
    DELIMITED_NEWLINE = "delimited_newline"
    URL_ENCODED = "url_encoded"
    BASE64 = "base64"
    CUSTOM = "custom"
    UNKNOWN = "unknown"


class TaxType(str, Enum):
    """Common tax types worldwide"""
    VAT = "VAT"          # Value Added Tax (EU, UK, etc.)
    GST = "GST"          # Goods and Services Tax (India, Australia, etc.)
    SALES_TAX = "SALES_TAX"  # USA
    CONSUMPTION_TAX = "CONSUMPTION_TAX"  # Japan
    HST = "HST"          # Harmonized Sales Tax (Canada)
    OTHER = "OTHER"


class ReceiptStatus(str, Enum):
    """Receipt processing status"""
    DECODED = "decoded"
    VALID = "valid"
    INVALID = "invalid"
    DUPLICATE = "duplicate"
    EXPIRED = "expired"
    PENDING_VALIDATION = "pending_validation"
    VALIDATION_FAILED = "validation_failed"


class ValidationMode(str, Enum):
    """Validation modes"""
    MOCK = "mock"
    REAL = "real"
    HYBRID = "hybrid"


# ============== PYDANTIC MODELS ==============

class MerchantInfo(BaseModel):
    """Merchant/Business information"""
    tin: str = Field(..., description="Tax Identification Number")
    name: Optional[str] = Field(None, description="Business name")
    trade_name: Optional[str] = Field(None, description="Trading name (DBA)")
    address: Optional[str] = Field(None, description="Business address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="ISO 3166-1 alpha-2 country code")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    category_code: Optional[str] = Field(None, description="Merchant Category Code (MCC)")
    phone: Optional[str] = Field(None, description="Contact phone")
    email: Optional[str] = Field(None, description="Contact email")


class LineItem(BaseModel):
    """Individual line item on receipt"""
    description: str = Field(..., description="Item description")
    quantity: float = Field(1.0, description="Quantity purchased")
    unit_price: float = Field(..., description="Price per unit")
    total_price: float = Field(..., description="Total price for this line")
    tax_rate: Optional[float] = Field(None, description="Tax rate applied (%)")
    tax_amount: Optional[float] = Field(None, description="Tax amount for this line")
    item_code: Optional[str] = Field(None, description="SKU/Product code")
    category: Optional[str] = Field(None, description="Item category")


class TaxBreakdown(BaseModel):
    """Tax breakdown details"""
    tax_type: TaxType = Field(..., description="Type of tax")
    tax_rate: float = Field(..., description="Tax rate as percentage")
    taxable_amount: float = Field(..., description="Amount subject to this tax")
    tax_amount: float = Field(..., description="Tax amount calculated")
    tax_code: Optional[str] = Field(None, description="Tax authority code")


class VerificationInfo(BaseModel):
    """Verification/authenticity information"""
    verification_code: Optional[str] = Field(None, description="Hash/signature from Tax Authority")
    fiscal_device_id: Optional[str] = Field(None, description="POS/fiscal device identifier")
    fiscal_device_serial: Optional[str] = Field(None, description="Fiscal device serial number")
    authority_code: Optional[str] = Field(None, description="Issuing Tax Authority code")
    authority_name: Optional[str] = Field(None, description="Tax Authority name")
    verification_url: Optional[str] = Field(None, description="URL to verify receipt online")
    digital_signature: Optional[str] = Field(None, description="Digital signature")
    certificate_id: Optional[str] = Field(None, description="Signing certificate ID")
    qr_generation_time: Optional[datetime] = Field(None, description="When QR was generated")


class ReceiptCore(BaseModel):
    """Core receipt data - standard fields for all jurisdictions"""
    # Identifiers
    receipt_number: str = Field(..., description="Unique receipt/invoice number")
    receipt_type: Optional[str] = Field("SALE", description="Receipt type: SALE, REFUND, VOID")
    sequence_number: Optional[int] = Field(None, description="Sequential receipt number")
    
    # Merchant
    merchant: MerchantInfo = Field(..., description="Merchant information")
    
    # Transaction details
    transaction_date: datetime = Field(..., description="Date and time of transaction")
    total_amount: float = Field(..., description="Total transaction amount")
    currency: str = Field("USD", description="ISO 4217 currency code")
    
    # Tax information
    subtotal: Optional[float] = Field(None, description="Amount before tax")
    total_tax: Optional[float] = Field(None, description="Total tax amount")
    tax_breakdown: Optional[List[TaxBreakdown]] = Field(None, description="Detailed tax breakdown")
    
    # Line items (optional for QR, may only have totals)
    line_items: Optional[List[LineItem]] = Field(None, description="Individual items purchased")
    
    # Payment
    payment_method: Optional[str] = Field(None, description="CASH, CARD, MOBILE, etc.")
    payment_reference: Optional[str] = Field(None, description="Payment transaction reference")
    
    # Customer (optional)
    customer_tin: Optional[str] = Field(None, description="Customer Tax ID if B2B")
    customer_name: Optional[str] = Field(None, description="Customer name")
    
    # Verification
    verification: Optional[VerificationInfo] = Field(None, description="Verification details")
    
    # Metadata
    raw_qr_data: Optional[str] = Field(None, description="Original QR code content")
    qr_format: Optional[QRFormat] = Field(None, description="Detected QR format")
    jurisdiction: Optional[str] = Field(None, description="Tax jurisdiction code")
    

class DecodeRequest(BaseModel):
    """Request to decode a QR code"""
    qr_data: str = Field(..., description="Raw QR code data (string)")
    format_hint: Optional[QRFormat] = Field(None, description="Optional format hint")
    jurisdiction: Optional[str] = Field(None, description="Expected jurisdiction for parsing")


class DecodeResponse(BaseModel):
    """Response from QR code decoding"""
    success: bool
    decode_id: str = Field(..., description="Unique ID for this decode operation")
    detected_format: QRFormat
    receipt: Optional[ReceiptCore] = None
    confidence_score: float = Field(..., description="Confidence in parsing (0-1)")
    warnings: List[str] = Field(default_factory=list, description="Parsing warnings")
    errors: List[str] = Field(default_factory=list, description="Parsing errors")
    raw_data: str = Field(..., description="Original QR data")
    parsed_fields: Dict[str, Any] = Field(default_factory=dict, description="All extracted fields")


class ValidateRequest(BaseModel):
    """Request to validate a decoded receipt"""
    decode_id: Optional[str] = Field(None, description="ID from decode step")
    receipt: Optional[ReceiptCore] = Field(None, description="Or provide receipt directly")
    validation_mode: ValidationMode = Field(ValidationMode.MOCK, description="Validation mode")
    authority_endpoint: Optional[str] = Field(None, description="Custom validation endpoint URL")


class ValidateResponse(BaseModel):
    """Response from receipt validation"""
    success: bool
    validation_id: str = Field(..., description="Unique validation ID")
    status: ReceiptStatus
    is_valid: bool
    validation_mode: ValidationMode
    checks_performed: List[Dict[str, Any]] = Field(default_factory=list)
    authority_response: Optional[Dict[str, Any]] = Field(None, description="Response from Tax Authority")
    errors: List[str] = Field(default_factory=list)
    validated_at: datetime


class SubmitRequest(BaseModel):
    """Request to submit a valid receipt for draw entry"""
    validation_id: Optional[str] = Field(None, description="ID from validation step")
    receipt: Optional[ReceiptCore] = Field(None, description="Or provide receipt directly")
    geo_location: Optional[Dict[str, float]] = Field(None, description="User location at scan time")
    device_info: Optional[Dict[str, str]] = Field(None, description="Scanning device info")


class SubmitResponse(BaseModel):
    """Response from receipt submission"""
    success: bool
    receipt_id: str = Field(..., description="Stored receipt ID")
    status: ReceiptStatus
    entries_earned: int = Field(0, description="Draw entries earned")
    bonus_entries: int = Field(0, description="Bonus entries earned")
    total_entries: int = Field(0, description="Total entries for this receipt")
    message: str
    submitted_at: datetime
    next_draw: Optional[datetime] = Field(None, description="Next draw date")


class ReceiptListItem(BaseModel):
    """Summary item for receipt list"""
    id: str
    receipt_number: str
    merchant_name: Optional[str]
    total_amount: float
    currency: str
    transaction_date: datetime
    status: ReceiptStatus
    entries_earned: int
    submitted_at: datetime


class ReceiptDetail(BaseModel):
    """Full receipt details"""
    id: str
    receipt: ReceiptCore
    status: ReceiptStatus
    validation_details: Optional[Dict[str, Any]]
    entries_earned: int
    bonus_entries: int
    submitted_at: datetime
    submitted_by: str
    geo_location: Optional[Dict[str, float]]
    audit_trail: List[Dict[str, Any]]


# ============== QR CODE PARSER ==============

class QRCodeParser:
    """
    Universal QR code parser with auto-format detection.
    Supports multiple formats used by Tax Authorities worldwide.
    """
    
    # Common field name mappings across different formats
    FIELD_MAPPINGS = {
        # Receipt/Invoice number
        'receipt_number': ['receipt_no', 'invoice_no', 'inv_no', 'rec_no', 'document_no', 
                          'doc_no', 'ref_no', 'reference', 'number', 'no', 'id', 'fatura'],
        # Merchant TIN
        'merchant_tin': ['tin', 'tax_id', 'vat_no', 'vat_number', 'nif', 'nit', 'ruc', 
                        'gstin', 'abn', 'ein', 'seller_tin', 'merchant_id', 'vendor_tin'],
        # Merchant name
        'merchant_name': ['merchant', 'seller', 'vendor', 'business', 'company', 'store',
                         'shop', 'establishment', 'razao_social', 'nombre'],
        # Total amount
        'total_amount': ['total', 'amount', 'grand_total', 'valor_total', 'importe',
                        'sum', 'net_amount', 'invoice_amount', 'bill_amount'],
        # Tax amount
        'tax_amount': ['tax', 'vat', 'gst', 'tax_total', 'iva', 'igst', 'cgst', 'sgst',
                      'impuesto', 'valor_imposto'],
        # Date
        'transaction_date': ['date', 'datetime', 'timestamp', 'trans_date', 'invoice_date',
                            'data', 'fecha', 'dt', 'created_at'],
        # Currency
        'currency': ['currency', 'curr', 'moeda', 'moneda', 'ccy'],
        # Verification code
        'verification_code': ['verification', 'verify_code', 'hash', 'signature', 'sig',
                             'check_code', 'control_code', 'auth_code', 'digest'],
    }
    
    @classmethod
    def detect_format(cls, qr_data: str) -> QRFormat:
        """Detect the format of QR code data"""
        data = qr_data.strip()
        
        # Try JSON
        if data.startswith('{') or data.startswith('['):
            try:
                json.loads(data)
                return QRFormat.JSON
            except:
                pass
        
        # Try Base64
        if cls._is_base64(data):
            try:
                decoded = base64.b64decode(data).decode('utf-8')
                if decoded.startswith('{') or '|' in decoded or '\n' in decoded:
                    return QRFormat.BASE64
            except:
                pass
        
        # URL encoded
        if data.startswith('http://') or data.startswith('https://') or '?' in data:
            return QRFormat.URL_ENCODED
        
        # Delimited formats
        if '|' in data:
            return QRFormat.DELIMITED_PIPE
        if data.count(',') > 2:
            return QRFormat.DELIMITED_COMMA
        if '\n' in data and data.count('\n') > 2:
            return QRFormat.DELIMITED_NEWLINE
        
        return QRFormat.CUSTOM
    
    @classmethod
    def _is_base64(cls, data: str) -> bool:
        """Check if string is valid base64"""
        try:
            if len(data) % 4 != 0:
                return False
            base64.b64decode(data)
            return len(data) > 20  # Minimum reasonable length
        except:
            return False
    
    @classmethod
    def parse(cls, qr_data: str, format_hint: Optional[QRFormat] = None, 
              jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        """
        Parse QR code data into structured receipt fields.
        Returns dict with parsed fields and metadata.
        """
        result = {
            'success': False,
            'format': QRFormat.UNKNOWN,
            'fields': {},
            'raw_data': qr_data,
            'confidence': 0.0,
            'warnings': [],
            'errors': []
        }
        
        data = qr_data.strip()
        detected_format = format_hint or cls.detect_format(data)
        result['format'] = detected_format
        
        try:
            if detected_format == QRFormat.JSON:
                result['fields'] = cls._parse_json(data)
            elif detected_format == QRFormat.BASE64:
                decoded = base64.b64decode(data).decode('utf-8')
                inner_format = cls.detect_format(decoded)
                if inner_format == QRFormat.JSON:
                    result['fields'] = cls._parse_json(decoded)
                else:
                    result['fields'] = cls._parse_delimited(decoded, inner_format)
            elif detected_format == QRFormat.URL_ENCODED:
                result['fields'] = cls._parse_url(data)
            elif detected_format in [QRFormat.DELIMITED_PIPE, QRFormat.DELIMITED_COMMA, 
                                     QRFormat.DELIMITED_NEWLINE]:
                result['fields'] = cls._parse_delimited(data, detected_format)
            else:
                result['fields'] = cls._parse_custom(data)
            
            # Normalize field names
            result['fields'] = cls._normalize_fields(result['fields'])
            
            # Calculate confidence based on required fields found
            result['confidence'] = cls._calculate_confidence(result['fields'])
            result['success'] = result['confidence'] > 0.3
            
        except Exception as e:
            result['errors'].append(f"Parse error: {str(e)}")
            result['success'] = False
        
        return result
    
    @classmethod
    def _parse_json(cls, data: str) -> Dict[str, Any]:
        """Parse JSON format QR code"""
        parsed = json.loads(data)
        if isinstance(parsed, list) and len(parsed) > 0:
            parsed = parsed[0]  # Take first item if array
        return parsed
    
    @classmethod
    def _parse_url(cls, data: str) -> Dict[str, Any]:
        """Parse URL-encoded QR code"""
        from urllib.parse import urlparse, parse_qs
        
        parsed = urlparse(data)
        fields = {'verification_url': data}
        
        # Parse query parameters
        params = parse_qs(parsed.query)
        for key, value in params.items():
            fields[key.lower()] = value[0] if len(value) == 1 else value
        
        # Try to extract info from path
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) >= 1:
            fields['path_info'] = path_parts
        
        return fields
    
    @classmethod
    def _parse_delimited(cls, data: str, format: QRFormat) -> Dict[str, Any]:
        """Parse delimited format QR codes"""
        if format == QRFormat.DELIMITED_PIPE:
            parts = data.split('|')
        elif format == QRFormat.DELIMITED_COMMA:
            parts = data.split(',')
        else:  # DELIMITED_NEWLINE
            parts = data.split('\n')
        
        fields = {}
        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue
            
            # Check if it's a key=value or key:value pair
            if '=' in part:
                key, value = part.split('=', 1)
                fields[key.strip().lower()] = value.strip()
            elif ':' in part:
                key, value = part.split(':', 1)
                fields[key.strip().lower()] = value.strip()
            else:
                # Positional field
                fields[f'field_{i}'] = part
        
        return fields
    
    @classmethod
    def _parse_custom(cls, data: str) -> Dict[str, Any]:
        """Parse custom/unknown format - best effort extraction"""
        fields = {'raw_content': data}
        
        # Try to extract common patterns
        # Amount pattern (numbers with decimals)
        amounts = re.findall(r'\b(\d+[.,]\d{2})\b', data)
        if amounts:
            fields['detected_amounts'] = amounts
            fields['total_amount'] = amounts[-1]  # Usually last amount is total
        
        # Date patterns
        date_patterns = [
            r'\b(\d{4}-\d{2}-\d{2})\b',  # YYYY-MM-DD
            r'\b(\d{2}/\d{2}/\d{4})\b',  # DD/MM/YYYY or MM/DD/YYYY
            r'\b(\d{2}-\d{2}-\d{4})\b',  # DD-MM-YYYY
        ]
        for pattern in date_patterns:
            matches = re.findall(pattern, data)
            if matches:
                fields['detected_date'] = matches[0]
                break
        
        # TIN/Tax ID patterns (various formats)
        tin_patterns = [
            r'\b([A-Z]{2}\d{9,11})\b',  # EU VAT format
            r'\b(\d{2}-\d{7})\b',       # US EIN format
            r'\b(\d{9,15})\b',          # Generic long number
        ]
        for pattern in tin_patterns:
            matches = re.findall(pattern, data)
            if matches:
                fields['detected_tin'] = matches[0]
                break
        
        return fields
    
    @classmethod
    def _normalize_fields(cls, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize field names to standard schema"""
        normalized = {}
        
        for key, value in fields.items():
            key_lower = key.lower().replace(' ', '_').replace('-', '_')
            
            # Check against our mappings
            mapped = False
            for standard_name, variations in cls.FIELD_MAPPINGS.items():
                if key_lower in variations or key_lower == standard_name:
                    normalized[standard_name] = value
                    mapped = True
                    break
            
            if not mapped:
                normalized[key_lower] = value
        
        return normalized
    
    @classmethod
    def _calculate_confidence(cls, fields: Dict[str, Any]) -> float:
        """Calculate confidence score based on required fields found"""
        required_fields = ['receipt_number', 'merchant_tin', 'total_amount']
        important_fields = ['transaction_date', 'merchant_name', 'tax_amount', 'currency']
        
        score = 0.0
        
        # Required fields contribute 60%
        for field in required_fields:
            if field in fields and fields[field]:
                score += 0.2
        
        # Important fields contribute 40%
        for field in important_fields:
            if field in fields and fields[field]:
                score += 0.1
        
        return min(score, 1.0)


# ============== RECEIPT VALIDATOR ==============

class ReceiptValidator:
    """
    Configurable receipt validator supporting mock and real Tax Authority APIs.
    """
    
    @classmethod
    async def validate(cls, receipt: ReceiptCore, mode: ValidationMode, 
                      authority_endpoint: Optional[str] = None,
                      db=None) -> Dict[str, Any]:
        """
        Validate a receipt against Tax Authority rules.
        """
        result = {
            'is_valid': False,
            'status': ReceiptStatus.PENDING_VALIDATION,
            'checks': [],
            'authority_response': None,
            'errors': []
        }
        
        # Basic format validation (always performed)
        format_checks = cls._validate_format(receipt)
        result['checks'].extend(format_checks)
        
        # Business rule validation
        business_checks = cls._validate_business_rules(receipt)
        result['checks'].extend(business_checks)
        
        # Duplicate check
        if db is not None:
            duplicate_check = await cls._check_duplicate(receipt, db)
            result['checks'].append(duplicate_check)
            if not duplicate_check['passed']:
                result['status'] = ReceiptStatus.DUPLICATE
                result['errors'].append("Receipt has already been submitted")
                return result
        
        # Authority validation based on mode
        if mode == ValidationMode.MOCK:
            auth_check = cls._mock_authority_validation(receipt)
        elif mode == ValidationMode.REAL and authority_endpoint:
            auth_check = await cls._real_authority_validation(receipt, authority_endpoint)
        else:
            auth_check = cls._mock_authority_validation(receipt)
        
        result['checks'].append(auth_check)
        result['authority_response'] = auth_check.get('response')
        
        # Determine final status
        all_passed = all(c.get('passed', False) for c in result['checks'])
        critical_failed = any(c.get('critical', False) and not c.get('passed', False) 
                            for c in result['checks'])
        
        if critical_failed:
            result['is_valid'] = False
            result['status'] = ReceiptStatus.INVALID
        elif all_passed:
            result['is_valid'] = True
            result['status'] = ReceiptStatus.VALID
        else:
            result['is_valid'] = False
            result['status'] = ReceiptStatus.VALIDATION_FAILED
        
        return result
    
    @classmethod
    def _validate_format(cls, receipt: ReceiptCore) -> List[Dict[str, Any]]:
        """Validate receipt data format"""
        checks = []
        
        # Receipt number format
        checks.append({
            'name': 'receipt_number_format',
            'description': 'Receipt number is valid format',
            'passed': bool(receipt.receipt_number and len(receipt.receipt_number) >= 3),
            'critical': True,
            'details': {'value': receipt.receipt_number}
        })
        
        # Merchant TIN format
        tin_valid = bool(receipt.merchant.tin and len(receipt.merchant.tin) >= 8)
        checks.append({
            'name': 'merchant_tin_format',
            'description': 'Merchant TIN is valid format',
            'passed': tin_valid,
            'critical': True,
            'details': {'value': receipt.merchant.tin if tin_valid else 'INVALID'}
        })
        
        # Amount validation
        checks.append({
            'name': 'amount_valid',
            'description': 'Transaction amount is positive',
            'passed': receipt.total_amount > 0,
            'critical': True,
            'details': {'value': receipt.total_amount}
        })
        
        # Currency format
        checks.append({
            'name': 'currency_format',
            'description': 'Currency is valid ISO 4217 code',
            'passed': bool(receipt.currency and len(receipt.currency) == 3),
            'critical': False,
            'details': {'value': receipt.currency}
        })
        
        return checks
    
    @classmethod
    def _validate_business_rules(cls, receipt: ReceiptCore) -> List[Dict[str, Any]]:
        """Validate against business rules"""
        checks = []
        now = datetime.now(timezone.utc)
        
        # Transaction date not in future
        if receipt.transaction_date.tzinfo is None:
            tx_date = receipt.transaction_date.replace(tzinfo=timezone.utc)
        else:
            tx_date = receipt.transaction_date
        
        checks.append({
            'name': 'date_not_future',
            'description': 'Transaction date is not in the future',
            'passed': tx_date <= now,
            'critical': True,
            'details': {'transaction_date': receipt.transaction_date.isoformat()}
        })
        
        # Transaction not too old (configurable, default 90 days)
        max_age_days = 90
        age = (now - tx_date).days
        checks.append({
            'name': 'date_not_expired',
            'description': f'Transaction is within {max_age_days} days',
            'passed': age <= max_age_days,
            'critical': True,
            'details': {'age_days': age, 'max_days': max_age_days}
        })
        
        # Tax amount validation (if provided)
        if receipt.total_tax is not None and receipt.subtotal is not None:
            expected_total = receipt.subtotal + receipt.total_tax
            tolerance = 0.01 * receipt.total_amount  # 1% tolerance
            checks.append({
                'name': 'amounts_consistent',
                'description': 'Subtotal + Tax = Total',
                'passed': abs(expected_total - receipt.total_amount) <= tolerance,
                'critical': False,
                'details': {
                    'subtotal': receipt.subtotal,
                    'tax': receipt.total_tax,
                    'total': receipt.total_amount
                }
            })
        
        return checks
    
    @classmethod
    async def _check_duplicate(cls, receipt: ReceiptCore, db) -> Dict[str, Any]:
        """Check if receipt was already submitted"""
        # Check by receipt number + merchant TIN combination
        existing = await db.receipts.find_one({
            'receipt.receipt_number': receipt.receipt_number,
            'receipt.merchant.tin': receipt.merchant.tin
        })
        
        return {
            'name': 'duplicate_check',
            'description': 'Receipt has not been previously submitted',
            'passed': existing is None,
            'critical': True,
            'details': {'existing_id': str(existing['_id']) if existing else None}
        }
    
    @classmethod
    def _mock_authority_validation(cls, receipt: ReceiptCore) -> Dict[str, Any]:
        """Mock Tax Authority validation for demo/testing"""
        import random
        
        # Simulate validation with high success rate
        # In real implementation, this would call actual Tax Authority API
        is_valid = random.random() > 0.1  # 90% success rate for demo
        
        mock_response = {
            'authority': 'MOCK_TAX_AUTHORITY',
            'validation_timestamp': datetime.now(timezone.utc).isoformat(),
            'receipt_verified': is_valid,
            'merchant_registered': True,
            'receipt_status': 'VERIFIED' if is_valid else 'NOT_FOUND',
            'message': 'Receipt verified successfully' if is_valid else 'Receipt not found in registry'
        }
        
        return {
            'name': 'authority_validation',
            'description': 'Receipt verified with Tax Authority (MOCK)',
            'passed': is_valid,
            'critical': True,
            'mode': 'mock',
            'response': mock_response
        }
    
    @classmethod
    async def _real_authority_validation(cls, receipt: ReceiptCore, 
                                         endpoint: str) -> Dict[str, Any]:
        """Real Tax Authority API validation"""
        import httpx
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    'receipt_number': receipt.receipt_number,
                    'merchant_tin': receipt.merchant.tin,
                    'total_amount': receipt.total_amount,
                    'transaction_date': receipt.transaction_date.isoformat(),
                    'verification_code': receipt.verification.verification_code if receipt.verification else None
                }
                
                response = await client.post(endpoint, json=payload)
                response_data = response.json()
                
                is_valid = response.status_code == 200 and response_data.get('verified', False)
                
                return {
                    'name': 'authority_validation',
                    'description': 'Receipt verified with Tax Authority',
                    'passed': is_valid,
                    'critical': True,
                    'mode': 'real',
                    'response': response_data
                }
                
        except Exception as e:
            return {
                'name': 'authority_validation',
                'description': 'Receipt verified with Tax Authority',
                'passed': False,
                'critical': True,
                'mode': 'real',
                'error': str(e),
                'response': None
            }


# ============== HELPER FUNCTIONS ==============

def build_receipt_from_fields(fields: Dict[str, Any]) -> ReceiptCore:
    """Build a ReceiptCore object from parsed fields"""
    
    # Parse date
    tx_date = fields.get('transaction_date')
    if isinstance(tx_date, str):
        try:
            tx_date = datetime.fromisoformat(tx_date.replace('Z', '+00:00'))
        except:
            tx_date = datetime.now(timezone.utc)
    elif tx_date is None:
        tx_date = datetime.now(timezone.utc)
    
    # Parse amount
    total_amount = fields.get('total_amount', 0)
    if isinstance(total_amount, str):
        total_amount = float(total_amount.replace(',', '.'))
    
    # Build merchant info
    merchant = MerchantInfo(
        tin=fields.get('merchant_tin', 'UNKNOWN'),
        name=fields.get('merchant_name'),
        address=fields.get('merchant_address'),
        city=fields.get('merchant_city'),
        country=fields.get('merchant_country'),
    )
    
    # Build verification info
    verification = None
    if any(k in fields for k in ['verification_code', 'fiscal_device_id', 'verification_url']):
        verification = VerificationInfo(
            verification_code=fields.get('verification_code'),
            fiscal_device_id=fields.get('fiscal_device_id'),
            verification_url=fields.get('verification_url'),
            authority_code=fields.get('authority_code'),
        )
    
    # Build tax breakdown
    tax_breakdown = None
    if 'tax_amount' in fields:
        tax_amount = fields['tax_amount']
        if isinstance(tax_amount, str):
            tax_amount = float(tax_amount.replace(',', '.'))
        tax_breakdown = [TaxBreakdown(
            tax_type=TaxType.VAT,
            tax_rate=fields.get('tax_rate', 0),
            taxable_amount=total_amount - tax_amount if total_amount > tax_amount else total_amount,
            tax_amount=tax_amount,
        )]
    
    return ReceiptCore(
        receipt_number=fields.get('receipt_number', f'AUTO-{uuid.uuid4().hex[:8].upper()}'),
        merchant=merchant,
        transaction_date=tx_date,
        total_amount=total_amount,
        currency=fields.get('currency', 'USD'),
        subtotal=fields.get('subtotal'),
        total_tax=fields.get('tax_amount'),
        tax_breakdown=tax_breakdown,
        payment_method=fields.get('payment_method'),
        customer_tin=fields.get('customer_tin'),
        verification=verification,
        raw_qr_data=fields.get('raw_data'),
        qr_format=fields.get('qr_format'),
        jurisdiction=fields.get('jurisdiction'),
    )


# ============== DEPENDENCY INJECTION ==============

# This will be set by the main app
_db = None
_get_current_user = None

def set_database(db):
    """Set the database instance"""
    global _db
    _db = db

def set_auth_dependency(auth_func):
    """Set the authentication dependency"""
    global _get_current_user
    _get_current_user = auth_func

async def get_db():
    """Get database instance"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    return _db


# ============== API ENDPOINTS ==============

@router.post("/decode", response_model=DecodeResponse)
async def decode_qr_code(request: DecodeRequest):
    """
    Decode a QR code and extract receipt data.
    
    This endpoint:
    1. Auto-detects the QR code format
    2. Parses the data into standardized fields
    3. Returns structured receipt data
    
    Supports formats: JSON, delimited (pipe/comma/newline), URL-encoded, Base64
    """
    decode_id = str(uuid.uuid4())
    
    # Parse QR code
    parse_result = QRCodeParser.parse(
        request.qr_data,
        format_hint=request.format_hint,
        jurisdiction=request.jurisdiction
    )
    
    # Build receipt if parsing succeeded
    receipt = None
    if parse_result['success'] and parse_result['fields']:
        try:
            parse_result['fields']['raw_data'] = request.qr_data
            parse_result['fields']['qr_format'] = parse_result['format']
            receipt = build_receipt_from_fields(parse_result['fields'])
        except Exception as e:
            parse_result['warnings'].append(f"Could not build full receipt: {str(e)}")
    
    # Store decode result for later validation
    db = await get_db()
    await db.decode_cache.insert_one({
        '_id': decode_id,
        'qr_data': request.qr_data,
        'parsed_fields': parse_result['fields'],
        'format': parse_result['format'].value,
        'confidence': parse_result['confidence'],
        'created_at': datetime.now(timezone.utc),
        'expires_at': datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour cache
    })
    
    return DecodeResponse(
        success=parse_result['success'],
        decode_id=decode_id,
        detected_format=parse_result['format'],
        receipt=receipt,
        confidence_score=parse_result['confidence'],
        warnings=parse_result['warnings'],
        errors=parse_result['errors'],
        raw_data=request.qr_data,
        parsed_fields=parse_result['fields']
    )


@router.post("/validate", response_model=ValidateResponse)
async def validate_receipt(request: ValidateRequest):
    """
    Validate a decoded receipt against Tax Authority rules.
    
    Validation includes:
    1. Format validation (required fields, data types)
    2. Business rules (date range, amount consistency)
    3. Duplicate check
    4. Tax Authority verification (mock or real)
    """
    validation_id = str(uuid.uuid4())
    db = await get_db()
    
    # Get receipt from decode cache or request
    receipt = request.receipt
    if not receipt and request.decode_id:
        cached = await db.decode_cache.find_one({'_id': request.decode_id})
        if not cached:
            raise HTTPException(status_code=404, detail="Decode ID not found or expired")
        cached['parsed_fields']['raw_data'] = cached['qr_data']
        cached['parsed_fields']['qr_format'] = QRFormat(cached['format'])
        receipt = build_receipt_from_fields(cached['parsed_fields'])
    
    if not receipt:
        raise HTTPException(status_code=400, detail="Either decode_id or receipt must be provided")
    
    # Perform validation
    validation_result = await ReceiptValidator.validate(
        receipt=receipt,
        mode=request.validation_mode,
        authority_endpoint=request.authority_endpoint,
        db=db
    )
    
    # Store validation result
    await db.validation_cache.insert_one({
        '_id': validation_id,
        'receipt': receipt.dict(),
        'result': {
            'is_valid': validation_result['is_valid'],
            'status': validation_result['status'].value,
            'checks': validation_result['checks']
        },
        'mode': request.validation_mode.value,
        'created_at': datetime.now(timezone.utc),
        'expires_at': datetime.now(timezone.utc) + timedelta(hours=1)
    })
    
    return ValidateResponse(
        success=validation_result['is_valid'],
        validation_id=validation_id,
        status=validation_result['status'],
        is_valid=validation_result['is_valid'],
        validation_mode=request.validation_mode,
        checks_performed=validation_result['checks'],
        authority_response=validation_result.get('authority_response'),
        errors=validation_result['errors'],
        validated_at=datetime.now(timezone.utc)
    )


@router.post("/submit", response_model=SubmitResponse)
async def submit_receipt(
    request: SubmitRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Submit a validated receipt to earn draw entries.
    
    Requires authentication. The receipt must pass validation to earn entries.
    """
    db = await get_db()
    
    # Get user from token
    if _get_current_user is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    
    user = await _get_current_user(credentials, db)
    user_id = str(user['_id'])
    
    # Get receipt from validation cache or request
    receipt = request.receipt
    validation_data = None
    
    if request.validation_id:
        cached = await db.validation_cache.find_one({'_id': request.validation_id})
        if not cached:
            raise HTTPException(status_code=404, detail="Validation ID not found or expired")
        receipt = ReceiptCore(**cached['receipt'])
        validation_data = cached['result']
    
    if not receipt:
        raise HTTPException(status_code=400, detail="Either validation_id or receipt must be provided")
    
    # If no validation data, validate now
    if not validation_data:
        validation_result = await ReceiptValidator.validate(
            receipt=receipt,
            mode=ValidationMode.MOCK,
            db=db
        )
        validation_data = {
            'is_valid': validation_result['is_valid'],
            'status': validation_result['status'].value,
            'checks': validation_result['checks']
        }
    
    # Determine entries
    entries_earned = 0
    bonus_entries = 0
    status = ReceiptStatus(validation_data['status'])
    message = "Receipt processed"
    
    if validation_data['is_valid']:
        entries_earned = 1  # Base entry
        
        # Bonus entries based on amount (example: 1 extra entry per $100)
        if receipt.total_amount >= 100:
            bonus_entries = int(receipt.total_amount / 100)
        
        message = f"Receipt validated! You earned {entries_earned + bonus_entries} draw entries."
    else:
        message = f"Receipt validation failed: {status.value}"
    
    # Store receipt
    receipt_id = str(uuid.uuid4())
    receipt_doc = {
        '_id': receipt_id,
        'user_id': user_id,
        'receipt': receipt.dict(),
        'status': status.value,
        'validation': validation_data,
        'entries_earned': entries_earned,
        'bonus_entries': bonus_entries,
        'total_entries': entries_earned + bonus_entries,
        'geo_location': request.geo_location,
        'device_info': request.device_info,
        'submitted_at': datetime.now(timezone.utc),
        'audit_trail': [
            {
                'action': 'submitted',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'user_id': user_id,
                'status': status.value
            }
        ]
    }
    
    await db.receipts.insert_one(receipt_doc)
    
    # Update user stats if valid
    if validation_data['is_valid']:
        await db.users.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$inc': {
                    'total_scans': 1,
                    'valid_scans': 1,
                    'total_entries': entries_earned + bonus_entries
                }
            }
        )
        
        # Create draw entries
        current_draw = await db.draws.find_one(
            {'status': 'active'},
            sort=[('draw_date', 1)]
        )
        
        if current_draw:
            for _ in range(entries_earned + bonus_entries):
                await db.entries.insert_one({
                    'user_id': user_id,
                    'draw_id': str(current_draw['_id']),
                    'receipt_id': receipt_id,
                    'entry_type': 'scan',
                    'created_at': datetime.now(timezone.utc)
                })
    
    # Get next draw date
    next_draw = await db.draws.find_one(
        {'status': 'active'},
        sort=[('draw_date', 1)]
    )
    next_draw_date = next_draw['draw_date'] if next_draw else None
    
    return SubmitResponse(
        success=validation_data['is_valid'],
        receipt_id=receipt_id,
        status=status,
        entries_earned=entries_earned,
        bonus_entries=bonus_entries,
        total_entries=entries_earned + bonus_entries,
        message=message,
        submitted_at=datetime.now(timezone.utc),
        next_draw=next_draw_date
    )


@router.get("/{receipt_id}", response_model=ReceiptDetail)
async def get_receipt(
    receipt_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get detailed information about a specific receipt.
    """
    db = await get_db()
    
    # Get user from token
    if _get_current_user is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    
    user = await _get_current_user(credentials, db)
    user_id = str(user['_id'])
    
    # Find receipt
    receipt_doc = await db.receipts.find_one({
        '_id': receipt_id,
        'user_id': user_id
    })
    
    if not receipt_doc:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return ReceiptDetail(
        id=receipt_doc['_id'],
        receipt=ReceiptCore(**receipt_doc['receipt']),
        status=ReceiptStatus(receipt_doc['status']),
        validation_details=receipt_doc.get('validation'),
        entries_earned=receipt_doc.get('entries_earned', 0),
        bonus_entries=receipt_doc.get('bonus_entries', 0),
        submitted_at=receipt_doc['submitted_at'],
        submitted_by=receipt_doc['user_id'],
        geo_location=receipt_doc.get('geo_location'),
        audit_trail=receipt_doc.get('audit_trail', [])
    )


@router.get("", response_model=List[ReceiptListItem])
async def list_receipts(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    skip: int = 0,
    limit: int = 20,
    status: Optional[ReceiptStatus] = None
):
    """
    List user's receipts with pagination and optional status filter.
    """
    db = await get_db()
    
    # Get user from token
    if _get_current_user is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    
    user = await _get_current_user(credentials, db)
    user_id = str(user['_id'])
    
    # Build query
    query = {'user_id': user_id}
    if status:
        query['status'] = status.value
    
    # Fetch receipts
    cursor = db.receipts.find(query).sort('submitted_at', -1).skip(skip).limit(limit)
    receipts = await cursor.to_list(length=limit)
    
    return [
        ReceiptListItem(
            id=r['_id'],
            receipt_number=r['receipt']['receipt_number'],
            merchant_name=r['receipt']['merchant'].get('name'),
            total_amount=r['receipt']['total_amount'],
            currency=r['receipt']['currency'],
            transaction_date=r['receipt']['transaction_date'],
            status=ReceiptStatus(r['status']),
            entries_earned=r.get('entries_earned', 0) + r.get('bonus_entries', 0),
            submitted_at=r['submitted_at']
        )
        for r in receipts
    ]


# ============== ADMIN ENDPOINTS ==============

@router.get("/admin/stats")
async def get_receipt_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get aggregate receipt statistics (admin only).
    """
    db = await get_db()
    
    # Verify admin (simplified - should check admin role)
    # In production, add proper admin role check
    
    total_receipts = await db.receipts.count_documents({})
    valid_receipts = await db.receipts.count_documents({'status': 'valid'})
    invalid_receipts = await db.receipts.count_documents({'status': 'invalid'})
    duplicate_receipts = await db.receipts.count_documents({'status': 'duplicate'})
    
    # Aggregate by date (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    pipeline = [
        {'$match': {'submitted_at': {'$gte': thirty_days_ago}}},
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$submitted_at'}},
            'count': {'$sum': 1},
            'total_amount': {'$sum': '$receipt.total_amount'},
            'entries': {'$sum': {'$add': ['$entries_earned', '$bonus_entries']}}
        }},
        {'$sort': {'_id': 1}}
    ]
    
    daily_stats = await db.receipts.aggregate(pipeline).to_list(length=30)
    
    return {
        'total_receipts': total_receipts,
        'valid_receipts': valid_receipts,
        'invalid_receipts': invalid_receipts,
        'duplicate_receipts': duplicate_receipts,
        'validation_rate': valid_receipts / total_receipts if total_receipts > 0 else 0,
        'daily_stats': daily_stats
    }


@router.get("/admin/formats")
async def get_qr_format_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get statistics on QR code formats detected.
    """
    db = await get_db()
    
    pipeline = [
        {'$group': {
            '_id': '$receipt.qr_format',
            'count': {'$sum': 1}
        }},
        {'$sort': {'count': -1}}
    ]
    
    format_stats = await db.receipts.aggregate(pipeline).to_list(length=20)
    
    return {
        'formats': format_stats
    }
