import requests
import sys
import json
from datetime import datetime

class TAXXAAPITester:
    def __init__(self, base_url="https://leaderboard-demo.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_phone = f"+255123{datetime.now().strftime('%H%M%S')}"
        self.test_user_data = {
            'phone': self.test_user_phone,
            'password': 'TestPass123!',
            'name': 'Test User'
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - {name} (Expected {expected_status}, got {response.status_code})")
                try:
                    error_detail = response.json() if response.content else {}
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - {name} - Connection Error: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test basic API health"""
        success, response = self.run_test("API Health Check", "GET", "", 200)
        return success and 'message' in response

    def test_language_config(self):
        """Test language configuration endpoint"""
        success, response = self.run_test("Language Config", "GET", "config/languages", 200)
        return success and 'languages' in response

    def test_registration_flow(self):
        """Test complete registration flow: phone -> OTP -> create account"""
        print("\n=== Testing Registration Flow ===")
        
        # Step 1: Register phone number
        success, response = self.run_test(
            "Register Phone", "POST", "auth/register",
            200, {"phone_number": self.test_user_phone}
        )
        if not success or 'otp_for_testing' not in response:
            print("❌ Registration failed - no OTP returned")
            return False
        
        test_otp = response['otp_for_testing']
        print(f"   Got test OTP: {test_otp}")
        
        # Step 2: Verify OTP
        success, response = self.run_test(
            "Verify OTP", "POST", "auth/verify-otp",
            200, {"phone_number": self.test_user_phone, "otp": test_otp}
        )
        if not success:
            return False
        
        # Step 3: Create account with password
        success, response = self.run_test(
            "Create Account", "POST", "auth/create-password",
            200, {
                "phone_number": self.test_user_phone,
                "password": self.test_user_data['password'],
                "name": self.test_user_data['name']
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ Registration complete - Token obtained")
            return True
        return False

    def test_login(self):
        """Test login with created credentials"""
        success, response = self.run_test(
            "Login", "POST", "auth/login",
            200, {
                "phone_number": self.test_user_phone,
                "password": self.test_user_data['password']
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_protected_endpoints(self):
        """Test authenticated endpoints"""
        if not self.token:
            print("❌ Skipping protected endpoints - no token")
            return False
        
        print("\n=== Testing Protected Endpoints ===")
        
        endpoints = [
            ("User Profile", "GET", "user/profile", 200),
            ("User Stats", "GET", "user/stats", 200),
            ("Badges", "GET", "badges", 200),
            ("Streaks", "GET", "streaks", 200),
            ("Draws", "GET", "draws", 200),
            ("Active Draws", "GET", "draws/active", 200),
            ("Leaderboard", "GET", "leaderboard", 200),
            ("Referral Stats", "GET", "referral/stats", 200),
            ("Analytics Overview", "GET", "analytics/overview", 200),
        ]
        
        passed = 0
        for name, method, endpoint, expected in endpoints:
            success, _ = self.run_test(name, method, endpoint, expected)
            if success:
                passed += 1
        
        return passed == len(endpoints)

    def test_scan_functionality(self):
        """Test QR generation and scanning"""
        if not self.token:
            print("❌ Skipping scan tests - no token")
            return False
            
        print("\n=== Testing Scanner Functionality ===")
        
        # Get test merchants
        success, merchants = self.run_test("Test Merchants", "GET", "test/merchants", 200)
        if not success or not merchants:
            return False
        
        # Generate test QR
        success, qr_data = self.run_test(
            "Generate Test QR", "GET", "test/generate-qr", 
            200, params={"merchant_id": "MER-001", "amount": 150.0}
        )
        if not success or 'qr_data' not in qr_data:
            return False
        
        # Scan the generated QR
        success, scan_result = self.run_test(
            "Scan Receipt", "POST", "scan",
            200, {"qr_data": qr_data['qr_data']}
        )
        if success and scan_result.get('status') == 'valid':
            print(f"✅ Scan successful - earned {scan_result.get('entries_earned', 0)} entries")
            return True
        return False

    def test_duplicate_scan(self):
        """Test duplicate scan detection"""
        if not self.token:
            return False
            
        # Generate QR and scan twice
        success, qr_data = self.run_test(
            "Generate QR for Duplicate Test", "GET", "test/generate-qr", 
            200, params={"merchant_id": "MER-002", "amount": 100.0}
        )
        if not success:
            return False
        
        # First scan
        success, _ = self.run_test(
            "First Scan", "POST", "scan",
            200, {"qr_data": qr_data['qr_data']}
        )
        if not success:
            return False
        
        # Second scan (should detect duplicate)
        success, scan_result = self.run_test(
            "Duplicate Scan", "POST", "scan",
            200, {"qr_data": qr_data['qr_data']}
        )
        
        return success and scan_result.get('status') == 'duplicate'

def main():
    print("🚀 Starting TAXXA API Test Suite")
    print("=" * 50)
    
    tester = TAXXAAPITester()
    
    # Test sequence
    tests = [
        ("API Health", tester.test_api_health),
        ("Language Config", tester.test_language_config),
        ("Registration Flow", tester.test_registration_flow),
        ("Login", tester.test_login),
        ("Protected Endpoints", tester.test_protected_endpoints),
        ("Scanner Functionality", tester.test_scan_functionality),
        ("Duplicate Detection", tester.test_duplicate_scan),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - EXCEPTION: {str(e)}")
            failed_tests.append(test_name)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Total API calls: {tester.tests_run}")
    print(f"Successful calls: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed test suites: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All test suites passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())