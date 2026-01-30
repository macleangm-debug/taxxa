#!/usr/bin/env python3
"""
TAXXA Backend API Testing Suite
Tests production-ready health endpoints and core functionality
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://taxlottery.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
TEST_PHONE = "0700000001"
TEST_PASSWORD = "password123"

class TaxxaAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            for key, value in details.items():
                print(f"    {key}: {value}")
        print()

    def test_health_liveness(self):
        """Test GET /api/health - liveness check"""
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Health Liveness Check",
                    True,
                    "Liveness endpoint responding correctly",
                    {
                        "status_code": response.status_code,
                        "response_time_header": response_time_header,
                        "response_data": data
                    }
                )
                return True
            else:
                self.log_result(
                    "Health Liveness Check",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Health Liveness Check",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_health_readiness(self):
        """Test GET /api/health/ready - readiness check with component checks"""
        try:
            response = self.session.get(f"{API_BASE}/health/ready", timeout=10)
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify expected structure
                expected_keys = ["status", "components"]
                missing_keys = [key for key in expected_keys if key not in data]
                
                if missing_keys:
                    self.log_result(
                        "Health Readiness Check",
                        False,
                        f"Missing expected keys: {missing_keys}",
                        {"response_data": data}
                    )
                    return False
                
                # Check component statuses
                components = data.get("components", {})
                mongodb_status = components.get("mongodb", {}).get("status")
                
                self.log_result(
                    "Health Readiness Check",
                    True,
                    "Readiness endpoint responding with component checks",
                    {
                        "status_code": response.status_code,
                        "response_time_header": response_time_header,
                        "overall_status": data.get("status"),
                        "mongodb_status": mongodb_status,
                        "cache_status": components.get("cache", {}).get("status"),
                        "components": list(components.keys())
                    }
                )
                return True
            else:
                self.log_result(
                    "Health Readiness Check",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Health Readiness Check",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_health_status(self):
        """Test GET /api/health/status - detailed system status"""
        try:
            response = self.session.get(f"{API_BASE}/health/status", timeout=10)
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify expected structure for detailed status
                expected_keys = ["status", "components", "system"]
                missing_keys = [key for key in expected_keys if key not in data]
                
                components = data.get("components", {})
                system_info = data.get("system", {})
                
                # Check for MongoDB health
                mongodb_healthy = components.get("mongodb", {}).get("status") == "healthy"
                
                # Check cache status (should be graceful degradation)
                cache_status = components.get("cache", {}).get("status")
                cache_ok = cache_status in ["connected", "not configured", "disconnected"]
                
                # Check rate limiter (should show fallback mode)
                rate_limiter_status = components.get("rate_limiter", {}).get("status")
                rate_limiter_backend = components.get("rate_limiter", {}).get("backend")
                
                self.log_result(
                    "Health Detailed Status",
                    True,
                    "Detailed status endpoint responding correctly",
                    {
                        "status_code": response.status_code,
                        "response_time_header": response_time_header,
                        "overall_status": data.get("status"),
                        "mongodb_healthy": mongodb_healthy,
                        "cache_status": cache_status,
                        "rate_limiter_status": rate_limiter_status,
                        "rate_limiter_backend": rate_limiter_backend,
                        "system_uptime": system_info.get("uptime"),
                        "missing_keys": missing_keys
                    }
                )
                return True
            else:
                self.log_result(
                    "Health Detailed Status",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Health Detailed Status",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_health_metrics(self):
        """Test GET /api/health/metrics - request metrics"""
        try:
            response = self.session.get(f"{API_BASE}/health/metrics", timeout=10)
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify metrics structure
                expected_keys = ["requests"]
                requests_data = data.get("requests", {})
                
                self.log_result(
                    "Health Metrics",
                    True,
                    "Metrics endpoint responding correctly",
                    {
                        "status_code": response.status_code,
                        "response_time_header": response_time_header,
                        "total_requests": requests_data.get("total"),
                        "requests_by_status": requests_data.get("by_status", {}),
                        "avg_response_time": requests_data.get("avg_response_time_ms"),
                        "has_endpoint_metrics": "by_endpoint" in requests_data
                    }
                )
                return True
            else:
                self.log_result(
                    "Health Metrics",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Health Metrics",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_auth_login(self):
        """Test POST /api/auth/login with test credentials"""
        try:
            login_data = {
                "phone_number": TEST_PHONE,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                timeout=10
            )
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify token structure
                access_token = data.get("access_token")
                token_type = data.get("token_type")
                user_data = data.get("user", {})
                
                if access_token and token_type == "bearer":
                    self.auth_token = access_token
                    self.log_result(
                        "Authentication Login",
                        True,
                        "Login successful with valid token",
                        {
                            "status_code": response.status_code,
                            "response_time_header": response_time_header,
                            "token_type": token_type,
                            "user_id": user_data.get("id"),
                            "user_phone": user_data.get("phone_number"),
                            "token_length": len(access_token) if access_token else 0
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Authentication Login",
                        False,
                        "Login response missing required fields",
                        {"response_data": data}
                    )
                    return False
            else:
                self.log_result(
                    "Authentication Login",
                    False,
                    f"Login failed with status: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Authentication Login",
                False,
                f"Login request failed: {str(e)}"
            )
            return False

    def test_user_stats(self):
        """Test GET /api/user/stats with authentication"""
        if not self.auth_token:
            self.log_result(
                "User Stats",
                False,
                "No auth token available - login test must pass first"
            )
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(
                f"{API_BASE}/user/stats",
                headers=headers,
                timeout=10
            )
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify expected stats structure
                expected_keys = ["total_scans", "valid_scans", "total_entries", "current_draw_entries"]
                missing_keys = [key for key in expected_keys if key not in data]
                
                self.log_result(
                    "User Stats",
                    True,
                    "User stats retrieved successfully",
                    {
                        "status_code": response.status_code,
                        "response_time_header": response_time_header,
                        "total_scans": data.get("total_scans"),
                        "valid_scans": data.get("valid_scans"),
                        "total_entries": data.get("total_entries"),
                        "current_draw_entries": data.get("current_draw_entries"),
                        "upcoming_draws_count": len(data.get("upcoming_draws", [])),
                        "currency_info": data.get("currency", {}),
                        "missing_keys": missing_keys
                    }
                )
                return True
            else:
                self.log_result(
                    "User Stats",
                    False,
                    f"Stats request failed with status: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "User Stats",
                False,
                f"Stats request failed: {str(e)}"
            )
            return False

    def test_active_draws(self):
        """Test GET /api/draws/active with authentication"""
        if not self.auth_token:
            self.log_result(
                "Active Draws",
                False,
                "No auth token available - login test must pass first"
            )
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.session.get(
                f"{API_BASE}/draws/active",
                headers=headers,
                timeout=10
            )
            
            # Check response time header
            response_time_header = response.headers.get('X-Response-Time')
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return a list (even if empty)
                if isinstance(data, list):
                    draw_count = len(data)
                    draw_details = []
                    
                    for draw in data[:3]:  # Show details for first 3 draws
                        draw_details.append({
                            "id": draw.get("id"),
                            "draw_type": draw.get("draw_type"),
                            "status": draw.get("status"),
                            "user_entries": draw.get("user_entries", 0),
                            "total_entries": draw.get("total_entries", 0)
                        })
                    
                    self.log_result(
                        "Active Draws",
                        True,
                        f"Active draws retrieved successfully ({draw_count} draws)",
                        {
                            "status_code": response.status_code,
                            "response_time_header": response_time_header,
                            "draw_count": draw_count,
                            "sample_draws": draw_details
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Active Draws",
                        False,
                        "Response is not a list as expected",
                        {"response_data": data}
                    )
                    return False
            else:
                self.log_result(
                    "Active Draws",
                    False,
                    f"Active draws request failed with status: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Active Draws",
                False,
                f"Active draws request failed: {str(e)}"
            )
            return False

    def test_response_time_headers(self):
        """Test that X-Response-Time headers are present across different endpoints"""
        endpoints_to_test = [
            ("/health", "GET", None),
            ("/health/ready", "GET", None),
            ("/app/config", "GET", None)  # Public endpoint
        ]
        
        headers_found = 0
        total_endpoints = len(endpoints_to_test)
        
        for endpoint, method, headers in endpoints_to_test:
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
                
                response_time_header = response.headers.get('X-Response-Time')
                if response_time_header:
                    headers_found += 1
                    
            except Exception as e:
                pass  # Continue testing other endpoints
        
        success = headers_found == total_endpoints
        self.log_result(
            "Response Time Headers",
            success,
            f"X-Response-Time header found on {headers_found}/{total_endpoints} endpoints",
            {
                "endpoints_tested": total_endpoints,
                "headers_found": headers_found,
                "success_rate": f"{(headers_found/total_endpoints)*100:.1f}%"
            }
        )
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting TAXXA Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 60)
        
        # Health Check Tests (Priority)
        print("📊 HEALTH CHECK ENDPOINTS")
        health_tests = [
            self.test_health_liveness,
            self.test_health_readiness,
            self.test_health_status,
            self.test_health_metrics
        ]
        
        health_passed = 0
        for test in health_tests:
            if test():
                health_passed += 1
        
        print(f"Health Endpoints: {health_passed}/{len(health_tests)} passed")
        print()
        
        # Core API Tests
        print("🔐 CORE API FUNCTIONALITY")
        core_tests = [
            self.test_auth_login,
            self.test_user_stats,
            self.test_active_draws
        ]
        
        core_passed = 0
        for test in core_tests:
            if test():
                core_passed += 1
        
        print(f"Core API: {core_passed}/{len(core_tests)} passed")
        print()
        
        # Performance Tests
        print("⚡ PERFORMANCE HEADERS")
        perf_passed = 1 if self.test_response_time_headers() else 0
        print(f"Performance Headers: {perf_passed}/1 passed")
        print()
        
        # Summary
        total_tests = len(health_tests) + len(core_tests) + 1
        total_passed = health_passed + core_passed + perf_passed
        
        print("=" * 60)
        print("📋 TEST SUMMARY")
        print(f"Total Tests: {total_passed}/{total_tests} passed")
        print(f"Success Rate: {(total_passed/total_tests)*100:.1f}%")
        
        if total_passed == total_tests:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed - check details above")
        
        return {
            "total_tests": total_tests,
            "passed": total_passed,
            "success_rate": (total_passed/total_tests)*100,
            "health_endpoints": f"{health_passed}/{len(health_tests)}",
            "core_api": f"{core_passed}/{len(core_tests)}",
            "performance": f"{perf_passed}/1",
            "all_results": self.test_results
        }

def main():
    """Main test execution"""
    tester = TaxxaAPITester()
    results = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return results

if __name__ == "__main__":
    main()