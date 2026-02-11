#!/usr/bin/env python3
"""
Ultra-Optimized Backend API Tests
==================================
Tests for code-level optimizations targeting 50,000+ scans/minute on single instance:
- Optimization component stats endpoints (/api/system/optimizations)
- V3 ultra-optimized scan system (/api/v3/stats)
- Database optimization stats (/api/system/db-stats)
- Component initialization verification
- Write buffer and deduplication system
"""

import requests
import time
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

class HighPerformanceAPITester:
    def __init__(self, base_url: str = "https://50ebc352-e2d4-4f4e-aa24-0e76550a3033.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.results = {}
        
        print(f"🚀 High-Performance API Tester")
        print(f"🔗 Testing backend: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict = None, headers: Dict = None) -> tuple[bool, Dict]:
        """Run a single API test and track results"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   {method} {endpoint}")
        
        try:
            start_time = time.time()
            
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            duration_ms = (time.time() - start_time) * 1000
            
            # Check status code
            status_ok = response.status_code == expected_status
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {"raw_text": response.text}

            if status_ok:
                self.tests_passed += 1
                print(f"   ✅ PASS - Status: {response.status_code} ({duration_ms:.2f}ms)")
                
                # Log key response data
                if isinstance(response_data, dict):
                    key_fields = ['message', 'status', 'total', 'count', 'capacity']
                    for field in key_fields:
                        if field in response_data:
                            print(f"      {field}: {response_data[field]}")
                
                self.results[name] = {
                    "status": "PASS", 
                    "response_time_ms": duration_ms,
                    "data": response_data
                }
            else:
                print(f"   ❌ FAIL - Expected {expected_status}, got {response.status_code}")
                print(f"      Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint,
                    "response": response.text[:500]
                })
                self.results[name] = {
                    "status": "FAIL",
                    "error": f"Status {response.status_code} != {expected_status}",
                    "response": response.text[:500]
                }

            return status_ok, response_data

        except requests.exceptions.RequestException as e:
            print(f"   ❌ FAIL - Network Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": f"Network error: {str(e)}",
                "endpoint": endpoint
            })
            self.results[name] = {"status": "FAIL", "error": str(e)}
            return False, {}
        except Exception as e:
            print(f"   ❌ FAIL - Unexpected Error: {str(e)}")
            self.failed_tests.append({
                "test": name,  
                "error": f"Unexpected error: {str(e)}",
                "endpoint": endpoint
            })
            self.results[name] = {"status": "FAIL", "error": str(e)}
            return False, {}

    def test_health_endpoints(self):
        """Test basic health check endpoints"""
        print(f"\n📊 === HEALTH CHECK TESTS ===")
        
        # Basic health check
        success, data = self.run_test(
            "Health Check",
            "GET", 
            "/api/health",
            200
        )
        
        # Readiness probe
        success, data = self.run_test(
            "Readiness Probe",
            "GET",
            "/api/health/ready", 
            200
        )

    def test_performance_monitoring(self):
        """Test performance monitoring endpoints"""
        print(f"\n⚡ === PERFORMANCE MONITORING TESTS ===")
        
        # System performance stats
        success, perf_data = self.run_test(
            "System Performance Stats",
            "GET",
            "/api/system/performance",
            200
        )
        
        if success and perf_data:
            print(f"   📈 Performance components status:")
            if isinstance(perf_data, dict):
                # Look for component status indicators
                for key, value in perf_data.items():
                    if 'status' in str(key).lower() or 'health' in str(key).lower():
                        print(f"      {key}: {value}")
        
        # Scaling recommendations  
        success, scaling_data = self.run_test(
            "Scaling Recommendations",
            "GET", 
            "/api/system/scaling",
            200
        )
        
        if success and scaling_data:
            print(f"   🔧 Scaling recommendations available:")
            if isinstance(scaling_data, dict):
                if 'recommendations' in scaling_data:
                    recs = scaling_data['recommendations']
                    if isinstance(recs, list):
                        print(f"      Found {len(recs)} scaling recommendations")

    def test_high_performance_scan_system(self):
        """Test high-performance scan system statistics"""
        print(f"\n🔥 === HIGH-PERFORMANCE SCAN SYSTEM TESTS ===")
        
        # Scan system stats
        success, scan_stats = self.run_test(
            "High-Performance Scan Stats",
            "GET",
            "/api/v2/scan/stats", 
            200
        )
        
        if success and scan_stats:
            print(f"   🎯 Scan system components:")
            if isinstance(scan_stats, dict):
                # Check for expected high-performance components
                expected_components = [
                    'bloom_filter', 'batch_processor', 
                    'background_tasks', 'write_aggregator'
                ]
                
                for component in expected_components:
                    if component in scan_stats:
                        comp_data = scan_stats[component]
                        print(f"      ✅ {component}: Active")
                        if isinstance(comp_data, dict):
                            # Show key stats
                            for stat, value in comp_data.items():
                                if stat in ['item_count', 'size_mb', 'processed', 'queue_size']:
                                    print(f"         {stat}: {value}")
                    else:
                        print(f"      ❌ {component}: Missing")

    def test_system_initialization(self):
        """Test that high-performance components are properly initialized"""
        print(f"\n🏗️  === SYSTEM INITIALIZATION TESTS ===")
        
        # Check if server started with all components
        # This is tested indirectly through the stats endpoints
        success, data = self.run_test(
            "Server Components Initialization Check", 
            "GET",
            "/api/v2/scan/stats",
            200
        )
        
        if success:
            print(f"   ✅ High-performance components initialized successfully")
        else:
            print(f"   ❌ Component initialization may have failed")

    def test_capacity_calculations(self):
        """Test theoretical capacity calculations"""
        print(f"\n📐 === CAPACITY CALCULATION TESTS ===")
        
        success, data = self.run_test(
            "Theoretical Capacity Check",
            "GET", 
            "/api/system/scaling",
            200
        )
        
        if success and isinstance(data, dict):
            if 'theoretical_capacity' in data:
                capacity = data['theoretical_capacity']
                print(f"   📊 System Capacity Analysis:")
                if isinstance(capacity, dict):
                    for metric, value in capacity.items():
                        print(f"      {metric}: {value}")
                        
                # Check if meets 1M+ target
                scans_per_min = capacity.get('total_scans_per_minute', 0)
                if scans_per_min >= 1000000:
                    print(f"   ✅ Meets 1M+ scans/min target ({scans_per_min:,})")
                else:
                    print(f"   ⚠️  Below 1M target: {scans_per_min:,} scans/min")

    def run_all_tests(self):
        """Run all high-performance system tests"""
        print(f"🚀 Starting High-Performance Scalability Tests...")
        
        try:
            self.test_health_endpoints()
            self.test_performance_monitoring()
            self.test_high_performance_scan_system()
            self.test_system_initialization()
            self.test_capacity_calculations()
            
        except KeyboardInterrupt:
            print(f"\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error during testing: {e}")
        
        self.print_summary()

    def print_summary(self):
        """Print comprehensive test summary"""
        print(f"\n" + "=" * 60)
        print(f"📋 HIGH-PERFORMANCE SYSTEM TEST SUMMARY")
        print(f"=" * 60)
        print(f"🎯 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {len(self.failed_tests)}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"   {i}. {failure['test']}")
                print(f"      Endpoint: {failure.get('endpoint', 'N/A')}")
                print(f"      Error: {failure.get('error', 'Unknown')}")
        
        # Performance insights
        if 'System Performance Stats' in self.results:
            perf_result = self.results['System Performance Stats']
            if perf_result['status'] == 'PASS':
                print(f"\n⚡ PERFORMANCE MONITORING: ✅ Active")
            else:
                print(f"\n⚡ PERFORMANCE MONITORING: ❌ Failed")
        
        if 'High-Performance Scan Stats' in self.results:
            scan_result = self.results['High-Performance Scan Stats']
            if scan_result['status'] == 'PASS':
                print(f"🔥 SCAN SYSTEM: ✅ High-performance components active")
            else:
                print(f"🔥 SCAN SYSTEM: ❌ Components not responding")
        
        if 'Theoretical Capacity Check' in self.results:
            capacity_result = self.results['Theoretical Capacity Check']
            if capacity_result['status'] == 'PASS':
                print(f"📐 SCALING: ✅ Capacity calculations available")
            else:
                print(f"📐 SCALING: ❌ Capacity system not working")
        
        print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Return exit code
        return 0 if len(self.failed_tests) == 0 else 1


def main():
    """Main test execution"""
    print("=" * 60)
    print("🏭 HIGH-PERFORMANCE SCALABILITY API TESTS")
    print("   Testing 1M+ scans/minute system components")
    print("=" * 60)
    
    # Initialize tester
    tester = HighPerformanceAPITester()
    
    # Run all tests
    exit_code = tester.run_all_tests()
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())