#!/usr/bin/env python3
"""
TaxDraw Backend API Test Suite - Receipt API v1 Testing
Testing the new Receipt API v1 endpoints with multi-step flow
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "https://tax-compliance-11.preview.emergentagent.com/api"
RECEIPT_API_BASE = f"{BASE_URL}/v1/receipts"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "taxdraw_admin_2024"

# Test data
TEST_USER = {
    "phone_number": "0700000001",
    "password": "password123"
}

# Test QR data samples
QR_DATA_JSON = {
    "qr_data": json.dumps({
        "receipt_number": "INV-2026-001234",
        "merchant_tin": "12345678901",
        "merchant_name": "ABC Store Ltd",
        "total_amount": 150.50,
        "tax_amount": 22.58,
        "transaction_date": "2026-01-28T10:30:00Z",
        "currency": "USD"
    })
}

QR_DATA_PIPE = {
    "qr_data": "receipt_no=REC-2026-5678|tin=98765432101|merchant=XYZ Retail|total=250.00|tax=37.50|date=2026-01-27|currency=EUR"
}

class TaxDrawAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_admin_login(self):
        """Test admin authentication"""
        try:
            response = self.session.post(
                f"{BASE_URL}/admin/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                if self.admin_token:
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.admin_token}"
                    })
                    self.log_test("Admin Login", True, "Successfully logged in as admin")
                    return True
                else:
                    self.log_test("Admin Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_all_draws(self):
        """Test getting all draws"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/draws", timeout=30)
            
            if response.status_code == 200:
                draws = response.json()
                self.log_test("Get All Draws", True, f"Retrieved {len(draws)} draws")
                return draws
            else:
                self.log_test("Get All Draws", False, f"HTTP {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_test("Get All Draws", False, f"Request failed: {str(e)}")
            return []
    
    def test_create_draw(self):
        """Test creating a new draw"""
        try:
            draw_data = {
                "draw_type": "weekly",
                "days_duration": 1,
                "prize_tiers": [
                    {
                        "tier": 1,
                        "name": "Test Prize",
                        "prize_type": "money",
                        "amount": 100,
                        "winners": 1
                    }
                ]
            }
            
            response = self.session.post(
                f"{BASE_URL}/admin/draws",
                json=draw_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                draw_id = data.get("id")
                if draw_id:
                    self.log_test("Create Draw", True, f"Created draw with ID: {draw_id}")
                    return draw_id
                else:
                    self.log_test("Create Draw", False, "No draw ID in response", data)
                    return None
            else:
                self.log_test("Create Draw", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Create Draw", False, f"Request failed: {str(e)}")
            return None
    
    def create_test_user_and_entries(self, draw_id):
        """Create a test user and add entries to the draw"""
        try:
            # First, register a test user
            phone = f"+1555{int(time.time()) % 10000:04d}"  # Generate unique phone
            
            # Step 1: Register
            register_response = self.session.post(
                f"{BASE_URL}/auth/register",
                json={"phone_number": phone},
                timeout=30
            )
            
            if register_response.status_code != 200:
                self.log_test("Create Test User", False, f"Registration failed: {register_response.status_code}")
                return False
            
            otp = register_response.json().get("otp_for_testing")
            if not otp:
                self.log_test("Create Test User", False, "No OTP received")
                return False
            
            # Step 2: Verify OTP
            verify_response = self.session.post(
                f"{BASE_URL}/auth/verify-otp",
                json={"phone_number": phone, "otp": otp},
                timeout=30
            )
            
            if verify_response.status_code != 200:
                self.log_test("Create Test User", False, f"OTP verification failed: {verify_response.status_code}")
                return False
            
            # Step 3: Create password and get user token
            password_response = self.session.post(
                f"{BASE_URL}/auth/create-password",
                json={"phone_number": phone, "password": "TestPass123", "name": "Test User"},
                timeout=30
            )
            
            if password_response.status_code != 200:
                self.log_test("Create Test User", False, f"Password creation failed: {password_response.status_code}")
                return False
            
            user_token = password_response.json().get("access_token")
            if not user_token:
                self.log_test("Create Test User", False, "No user token received")
                return False
            
            # Step 4: Generate test QR and scan it to create entries
            qr_response = self.session.get(f"{BASE_URL}/test/generate-qr?amount=100", timeout=30)
            if qr_response.status_code != 200:
                self.log_test("Create Test User", False, f"QR generation failed: {qr_response.status_code}")
                return False
            
            qr_data = qr_response.json().get("qr_data")
            if not qr_data:
                self.log_test("Create Test User", False, "No QR data received")
                return False
            
            # Step 5: Scan the receipt to add entries
            scan_response = self.session.post(
                f"{BASE_URL}/scan",
                json={"qr_data": qr_data},
                headers={"Authorization": f"Bearer {user_token}"},
                timeout=30
            )
            
            if scan_response.status_code != 200:
                self.log_test("Create Test User", False, f"Scan failed: {scan_response.status_code}")
                return False
            
            scan_result = scan_response.json()
            entries_earned = scan_result.get("entries_earned", 0)
            
            if entries_earned > 0:
                self.log_test("Create Test User", True, f"Created user and earned {entries_earned} entries")
                return True
            else:
                self.log_test("Create Test User", False, f"No entries earned from scan: {scan_result}")
                return False
                
        except Exception as e:
            self.log_test("Create Test User", False, f"Request failed: {str(e)}")
            return False
    
    def test_complete_draw(self, draw_id):
        """Test completing a draw"""
        try:
            response = self.session.post(
                f"{BASE_URL}/admin/draws/{draw_id}/complete",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                winners = data.get("winners", [])
                audit_info = data.get("audit", {})
                
                self.log_test(
                    "Complete Draw", 
                    True, 
                    f"Draw completed with {len(winners)} winners. Audit hash: {audit_info.get('audit_hash', 'N/A')[:16]}..."
                )
                return True
            else:
                self.log_test("Complete Draw", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Complete Draw", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_draw_audit(self, draw_id):
        """Test getting draw audit information"""
        try:
            response = self.session.get(
                f"{BASE_URL}/admin/draws/{draw_id}/audit",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required audit data structure
                required_fields = ["draw", "audit", "verification"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "Get Draw Audit", 
                        False, 
                        f"Missing required fields: {missing_fields}",
                        data
                    )
                    return False
                
                # Check audit data structure
                audit = data.get("audit", {})
                required_audit_fields = ["pre_draw", "participants", "selection", "results", "verification"]
                missing_audit_fields = [field for field in required_audit_fields if field not in audit]
                
                if missing_audit_fields:
                    self.log_test(
                        "Get Draw Audit", 
                        False, 
                        f"Missing audit fields: {missing_audit_fields}",
                        audit
                    )
                    return False
                
                # Check verification status
                verification = data.get("verification", {})
                is_valid = verification.get("is_valid", False)
                
                # Check for cryptographic verification info
                pre_draw = audit.get("pre_draw", {})
                has_seed = "seed" in pre_draw
                has_hash = "hash" in pre_draw
                
                participants_info = audit.get("participants", {})
                has_participants = "count" in participants_info and "total_entries" in participants_info
                
                selection_info = audit.get("selection", {})
                has_selection_steps = "steps" in selection_info
                
                results_info = audit.get("results", {})
                has_winners = "winners" in results_info
                
                success_message = f"Audit retrieved - Valid: {is_valid}, Seed: {has_seed}, Hash: {has_hash}, Participants: {has_participants}, Selection: {has_selection_steps}, Winners: {has_winners}"
                
                all_checks_pass = all([has_seed, has_hash, has_participants, has_selection_steps, has_winners])
                
                self.log_test("Get Draw Audit", all_checks_pass, success_message)
                return all_checks_pass
                
            else:
                self.log_test("Get Draw Audit", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Draw Audit", False, f"Request failed: {str(e)}")
            return False
    
    def test_export_draw_audit(self, draw_id):
        """Test exporting draw audit as JSON"""
        try:
            response = self.session.get(
                f"{BASE_URL}/admin/draws/{draw_id}/audit/export",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify export structure
                required_export_fields = [
                    "report_type", "report_version", "generated_at", 
                    "draw_info", "algorithm", "pre_draw_verification",
                    "participants", "selection_log", "results", "verification"
                ]
                
                missing_fields = [field for field in required_export_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "Export Draw Audit", 
                        False, 
                        f"Missing export fields: {missing_fields}",
                        data
                    )
                    return False
                
                # Check verification status in export
                verification = data.get("verification", {})
                verification_status = verification.get("status", "UNKNOWN")
                
                # Check if it's a complete export-ready document
                has_algorithm_info = "algorithm" in data and "name" in data["algorithm"]
                has_pre_draw_seed = "pre_draw_verification" in data and "seed" in data["pre_draw_verification"]
                has_selection_log = "selection_log" in data and isinstance(data["selection_log"], list)
                
                export_complete = all([has_algorithm_info, has_pre_draw_seed, has_selection_log])
                
                success_message = f"Export complete - Status: {verification_status}, Algorithm: {has_algorithm_info}, Seed: {has_pre_draw_seed}, Log: {has_selection_log}"
                
                self.log_test("Export Draw Audit", export_complete, success_message)
                return export_complete
                
            else:
                self.log_test("Export Draw Audit", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Export Draw Audit", False, f"Request failed: {str(e)}")
            return False
    
    def run_audit_tests(self):
        """Run the complete audit testing flow"""
        print("🔍 Starting TaxDraw Draw Audit Report API Tests")
        print("=" * 60)
        
        # Step 1: Admin Login
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Step 2: Get all draws
        draws = self.test_get_all_draws()
        
        # Step 3: Create a fresh draw for audit testing
        # We'll create a new draw to ensure we have proper audit records
        print("📝 Creating new draw for audit testing...")
        new_draw_id = self.test_create_draw()
        
        if new_draw_id:
            print(f"👤 Creating test user and entries for draw {new_draw_id}...")
            if self.create_test_user_and_entries(new_draw_id):
                print(f"⏳ Completing draw {new_draw_id}...")
                if self.test_complete_draw(new_draw_id):
                    completed_draw_id = new_draw_id
                else:
                    print("❌ Failed to complete draw")
                    return False
            else:
                print("❌ Failed to create test entries")
                return False
        else:
            print("❌ Failed to create draw")
            return False
        
        # Step 4: Test audit endpoints
        if completed_draw_id:
            print(f"🔍 Testing audit endpoints for draw: {completed_draw_id}")
            
            # Test audit endpoint
            audit_success = self.test_get_draw_audit(completed_draw_id)
            
            # Test export endpoint
            export_success = self.test_export_draw_audit(completed_draw_id)
            
            # Overall success
            overall_success = audit_success and export_success
            
            print("\n" + "=" * 60)
            print("📊 AUDIT TEST SUMMARY")
            print("=" * 60)
            
            for result in self.test_results:
                status = "✅" if result["success"] else "❌"
                print(f"{status} {result['test']}: {result['message']}")
            
            print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
            
            return overall_success
        else:
            print("❌ No completed draw available for audit testing")
            return False


class ReceiptAPITester:
    """Test the new Receipt API v1 endpoints"""
    
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.decode_id = None
        self.validation_id = None
        self.receipt_id = None
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_user_login(self):
        """Test user authentication to get token"""
        self.log("Testing user login...")
        
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json=TEST_USER,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.log(f"✅ Login successful, token obtained")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Login error: {str(e)}", "ERROR")
            return False
    
    def test_decode_endpoint(self):
        """Test POST /api/v1/receipts/decode"""
        self.log("Testing Receipt Decode endpoint...")
        
        # Test JSON format
        try:
            response = self.session.post(
                f"{RECEIPT_API_BASE}/decode",
                json=QR_DATA_JSON,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.decode_id = data.get("decode_id")
                self.log(f"✅ JSON decode successful - ID: {self.decode_id}")
                self.log(f"   Format detected: {data.get('detected_format')}")
                self.log(f"   Confidence: {data.get('confidence_score')}")
                
                if data.get("receipt"):
                    receipt = data["receipt"]
                    self.log(f"   Receipt number: {receipt.get('receipt_number')}")
                    self.log(f"   Merchant: {receipt.get('merchant', {}).get('name')}")
                    self.log(f"   Amount: {receipt.get('total_amount')} {receipt.get('currency')}")
                
                json_success = True
            else:
                self.log(f"❌ JSON decode failed: {response.status_code} - {response.text}", "ERROR")
                json_success = False
                
        except Exception as e:
            self.log(f"❌ JSON decode error: {str(e)}", "ERROR")
            json_success = False
        
        # Test pipe-delimited format
        try:
            response = self.session.post(
                f"{RECEIPT_API_BASE}/decode",
                json=QR_DATA_PIPE,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Pipe-delimited decode successful")
                self.log(f"   Format detected: {data.get('detected_format')}")
                self.log(f"   Confidence: {data.get('confidence_score')}")
                pipe_success = True
            else:
                self.log(f"❌ Pipe-delimited decode failed: {response.status_code} - {response.text}", "ERROR")
                pipe_success = False
                
        except Exception as e:
            self.log(f"❌ Pipe-delimited decode error: {str(e)}", "ERROR")
            pipe_success = False
        
        return json_success and pipe_success
    
    def test_validate_endpoint(self):
        """Test POST /api/v1/receipts/validate"""
        self.log("Testing Receipt Validate endpoint...")
        
        if not self.decode_id:
            self.log("❌ No decode_id available for validation", "ERROR")
            return False
        
        try:
            response = self.session.post(
                f"{RECEIPT_API_BASE}/validate",
                json={
                    "decode_id": self.decode_id,
                    "validation_mode": "mock"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.validation_id = data.get("validation_id")
                self.log(f"✅ Validation successful - ID: {self.validation_id}")
                self.log(f"   Status: {data.get('status')}")
                self.log(f"   Is valid: {data.get('is_valid')}")
                
                checks = data.get("checks_performed", [])
                self.log(f"   Checks performed: {len(checks)}")
                for check in checks:
                    status = "✅" if check.get("passed") else "❌"
                    self.log(f"     {status} {check.get('name')}: {check.get('description')}")
                
                return True
            else:
                self.log(f"❌ Validation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Validation error: {str(e)}", "ERROR")
            return False
    
    def test_submit_endpoint(self):
        """Test POST /api/v1/receipts/submit (requires auth)"""
        self.log("Testing Receipt Submit endpoint...")
        
        if not self.auth_token:
            self.log("❌ No auth token available for submit", "ERROR")
            return False
            
        if not self.validation_id:
            self.log("❌ No validation_id available for submit", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.post(
                f"{RECEIPT_API_BASE}/submit",
                json={"validation_id": self.validation_id},
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.receipt_id = data.get("receipt_id")
                self.log(f"✅ Submit successful - Receipt ID: {self.receipt_id}")
                self.log(f"   Status: {data.get('status')}")
                self.log(f"   Entries earned: {data.get('entries_earned')}")
                self.log(f"   Bonus entries: {data.get('bonus_entries')}")
                self.log(f"   Total entries: {data.get('total_entries')}")
                self.log(f"   Message: {data.get('message')}")
                return True
            else:
                self.log(f"❌ Submit failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Submit error: {str(e)}", "ERROR")
            return False
    
    def test_list_receipts_endpoint(self):
        """Test GET /api/v1/receipts (requires auth)"""
        self.log("Testing List Receipts endpoint...")
        
        if not self.auth_token:
            self.log("❌ No auth token available for list", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(
                f"{RECEIPT_API_BASE}",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ List receipts successful")
                self.log(f"   Found {len(data)} receipts")
                
                for i, receipt in enumerate(data[:3]):  # Show first 3
                    self.log(f"   Receipt {i+1}: {receipt.get('receipt_number')} - {receipt.get('status')} - {receipt.get('entries_earned')} entries")
                
                return True
            else:
                self.log(f"❌ List receipts failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ List receipts error: {str(e)}", "ERROR")
            return False
    
    def test_get_receipt_endpoint(self):
        """Test GET /api/v1/receipts/{receipt_id} (requires auth)"""
        self.log("Testing Get Receipt Details endpoint...")
        
        if not self.auth_token:
            self.log("❌ No auth token available for get receipt", "ERROR")
            return False
            
        if not self.receipt_id:
            self.log("❌ No receipt_id available for get receipt", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(
                f"{RECEIPT_API_BASE}/{self.receipt_id}",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Get receipt details successful")
                self.log(f"   Receipt ID: {data.get('id')}")
                self.log(f"   Status: {data.get('status')}")
                self.log(f"   Entries earned: {data.get('entries_earned')}")
                self.log(f"   Bonus entries: {data.get('bonus_entries')}")
                
                receipt = data.get("receipt", {})
                self.log(f"   Receipt number: {receipt.get('receipt_number')}")
                self.log(f"   Merchant: {receipt.get('merchant', {}).get('name')}")
                self.log(f"   Amount: {receipt.get('total_amount')} {receipt.get('currency')}")
                
                return True
            else:
                self.log(f"❌ Get receipt details failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get receipt details error: {str(e)}", "ERROR")
            return False
    
    def run_full_test_flow(self):
        """Run the complete test flow"""
        self.log("=" * 60)
        self.log("Starting Receipt API v1 Test Suite")
        self.log("=" * 60)
        
        results = {}
        
        # Step 1: Login
        results["login"] = self.test_user_login()
        
        # Step 2: Decode QR code
        results["decode"] = self.test_decode_endpoint()
        
        # Step 3: Validate receipt
        results["validate"] = self.test_validate_endpoint()
        
        # Step 4: Submit receipt (requires auth)
        results["submit"] = self.test_submit_endpoint()
        
        # Step 5: List receipts
        results["list"] = self.test_list_receipts_endpoint()
        
        # Step 6: Get receipt details
        results["get_receipt"] = self.test_get_receipt_endpoint()
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.upper()}: {status}")
        
        self.log(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 All Receipt API v1 tests PASSED!")
            return True
        else:
            self.log(f"⚠️  {total_tests - passed_tests} test(s) FAILED")
            return False


def main():
    """Main test execution"""
    print("🧪 TaxDraw Backend API Test Suite")
    print("=" * 60)
    
    # Test Receipt API v1 endpoints
    receipt_tester = ReceiptAPITester()
    
    try:
        receipt_success = receipt_tester.run_full_test_flow()
        
        print("\n" + "=" * 60)
        print("FINAL TEST SUMMARY")
        print("=" * 60)
        
        if receipt_success:
            print("🎉 All Receipt API v1 tests PASSED!")
            sys.exit(0)
        else:
            print("❌ Some Receipt API v1 tests FAILED!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()