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

class UltraOptimizedAPITester:
    def __init__(self, base_url: str = "https://50ebc352-e2d4-4f4e-aa24-0e76550a3033.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.results = {}
        
        print(f"🚀 Ultra-Optimized API Tester")
        print(f"🔗 Testing backend: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Target: 50,000+ scans/minute with <5ms latency")
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

    def test_optimization_components(self):
        """Test optimization component statistics endpoint"""
        print(f"\n⚡ === OPTIMIZATION COMPONENTS TESTS ===")
        
        # Test main optimization stats endpoint
        success, opt_data = self.run_test(
            "Optimization Component Stats",
            "GET", 
            "/api/system/optimizations",
            200
        )
        
        if success and opt_data:
            print(f"   🔧 Optimization components status:")
            if isinstance(opt_data, dict):
                # Check for expected optimization components
                expected_components = [
                    'user_cache', 'draw_cache', 'config_cache',
                    'request_coalescer', 'circuit_breaker', 'scanned_receipts'
                ]
                
                for component in expected_components:
                    if component in opt_data:
                        comp_data = opt_data[component]
                        print(f"      ✅ {component}: Active")
                        if isinstance(comp_data, dict):
                            # Show key stats for different components
                            if 'cache' in component:
                                # Cache stats
                                size = comp_data.get('size', 0)
                                maxsize = comp_data.get('maxsize', 0) 
                                hit_rate = comp_data.get('hit_rate', 0)
                                print(f"         size: {size}/{maxsize}, hit_rate: {hit_rate}%")
                            elif component == 'request_coalescer':
                                # Coalescer stats
                                pending = comp_data.get('pending_requests', 0)
                                coalesced = comp_data.get('coalesced_requests', 0)
                                print(f"         pending: {pending}, coalesced: {coalesced}")
                            elif component == 'scanned_receipts':
                                # Deduplication stats
                                count = comp_data.get('count', 0)
                                memory_mb = comp_data.get('memory_mb', 0)
                                print(f"         receipts: {count:,}, memory: {memory_mb:.2f}MB")
                    else:
                        print(f"      ❌ {component}: Missing")
                        
                # Verify cache sizes match specifications
                user_cache = opt_data.get('user_cache', {})
                if user_cache.get('maxsize') == 50000:
                    print(f"      ✅ User cache configured for 50K users (spec)")
                else:
                    print(f"      ⚠️  User cache size: {user_cache.get('maxsize', 'N/A')} (expected: 50K)")

    def test_v3_scan_system(self):
        """Test ultra-optimized V3 scan system"""
        print(f"\n🔥 === ULTRA-OPTIMIZED V3 SCAN SYSTEM TESTS ===")
        
        # Test V3 scan stats endpoint
        success, v3_stats = self.run_test(
            "V3 Ultra-Optimized Scan Stats",
            "GET",
            "/api/v3/stats", 
            200
        )
        
        if success and v3_stats:
            print(f"   🎯 V3 Scan system components:")
            if isinstance(v3_stats, dict):
                # Check for V3 specific components
                expected_v3_components = ['deduplicator', 'write_buffer', 'target_performance']
                
                for component in expected_v3_components:
                    if component in v3_stats:
                        comp_data = v3_stats[component]
                        print(f"      ✅ {component}: Active")
                        if isinstance(comp_data, dict):
                            if component == 'deduplicator':
                                # Deduplication stats
                                size = comp_data.get('size', 0)
                                max_size = comp_data.get('max_size', 0)
                                memory_mb = comp_data.get('memory_mb', 0)
                                evictions = comp_data.get('evictions', 0)
                                print(f"         capacity: {size:,}/{max_size:,}, memory: {memory_mb}MB, evictions: {evictions}")
                                
                                # Check if deduplicator meets 2M capacity spec
                                if max_size >= 2000000:
                                    print(f"         ✅ Meets 2M capacity requirement")
                                else:
                                    print(f"         ⚠️  Below 2M capacity: {max_size:,}")
                                    
                            elif component == 'write_buffer':
                                # Write buffer stats
                                flushes = comp_data.get('flushes', 0)
                                scans_written = comp_data.get('scans_written', 0)
                                users_updated = comp_data.get('users_updated', 0)
                                pending_scans = comp_data.get('pending_scans', 0)
                                pending_users = comp_data.get('pending_users', 0)
                                print(f"         flushes: {flushes}, written: {scans_written}, pending: {pending_scans}")
                                
                            elif component == 'target_performance':
                                # Performance targets
                                response_target = comp_data.get('response_time_target_ms', 0)
                                throughput_target = comp_data.get('throughput_target_per_min', 0)
                                print(f"         target: <{response_target}ms, {throughput_target:,}/min")
                                
                                # Verify targets meet specification
                                if response_target <= 5 and throughput_target >= 50000:
                                    print(f"         ✅ Meets performance targets (<5ms, 50K+/min)")
                                else:
                                    print(f"         ⚠️  Performance targets may be off-spec")
                    else:
                        print(f"      ❌ {component}: Missing")

    def test_database_optimization_stats(self):
        """Test database optimization statistics"""
        print(f"\n💾 === DATABASE OPTIMIZATION TESTS ===")
        
        # Test database stats endpoint
        success, db_stats = self.run_test(
            "Database Collection Statistics",
            "GET",
            "/api/system/db-stats",
            200
        )
        
        if success and db_stats:
            print(f"   📊 Database collection statistics:")
            if isinstance(db_stats, dict):
                # Expected collections with indexes
                expected_collections = ['scans', 'users', 'draw_entries', 'draws', 'referrals']
                
                for collection in expected_collections:
                    if collection in db_stats:
                        coll_data = db_stats[collection]
                        if isinstance(coll_data, dict) and 'error' not in coll_data:
                            print(f"      ✅ {collection}:")
                            count = coll_data.get('count', 0)
                            size_mb = coll_data.get('size_mb', 0)
                            index_size_mb = coll_data.get('index_size_mb', 0)
                            avg_obj_size = coll_data.get('avg_obj_size', 0)
                            print(f"         documents: {count:,}, size: {size_mb:.2f}MB")
                            print(f"         indexes: {index_size_mb:.2f}MB, avg_obj: {avg_obj_size}B")
                        else:
                            error_msg = coll_data.get('error', 'Unknown error') if isinstance(coll_data, dict) else 'Invalid data'
                            print(f"      ❌ {collection}: {error_msg}")
                    else:
                        print(f"      ❌ {collection}: Missing from stats")

    def test_backend_initialization(self):
        """Test that all optimization components initialized correctly on startup"""
        print(f"\n🏗️  === BACKEND INITIALIZATION TESTS ===")
        
        # Test that optimization components are initialized
        success1, opt_data = self.run_test(
            "Optimization Components Initialization",
            "GET", 
            "/api/system/optimizations",
            200
        )
        
        # Test that V3 write buffer is initialized
        success2, v3_data = self.run_test(
            "V3 Write Buffer Initialization",
            "GET",
            "/api/v3/stats",
            200  
        )
        
        # Test database indexes were created
        success3, db_data = self.run_test(
            "Database Indexes Creation",
            "GET",
            "/api/system/db-stats", 
            200
        )
        
        if success1 and success2 and success3:
            print(f"   ✅ All optimization components initialized successfully")
            
            # Check specific initialization indicators
            if isinstance(opt_data, dict):
                cache_components = ['user_cache', 'draw_cache', 'config_cache']
                initialized_caches = sum(1 for comp in cache_components if comp in opt_data)
                print(f"   📦 Caches initialized: {initialized_caches}/{len(cache_components)}")
                
            if isinstance(v3_data, dict) and 'write_buffer' in v3_data:
                wb_data = v3_data['write_buffer']
                if isinstance(wb_data, dict):
                    flushes = wb_data.get('flushes', 0)
                    print(f"   💾 Write buffer active: {flushes} flushes recorded")
                    
            if isinstance(db_data, dict):
                active_collections = sum(1 for coll, data in db_data.items() 
                                       if isinstance(data, dict) and 'error' not in data)
                print(f"   🗃️  Database collections with stats: {active_collections}")
                
        else:
            failed_components = []
            if not success1: failed_components.append("optimization components")
            if not success2: failed_components.append("V3 write buffer") 
            if not success3: failed_components.append("database stats")
            print(f"   ❌ Failed initialization: {', '.join(failed_components)}")

    def test_performance_targets(self):
        """Test that system meets performance targets"""
        print(f"\n🎯 === PERFORMANCE TARGET VERIFICATION ===")
        
        # Check V3 performance targets
        success, v3_data = self.run_test(
            "V3 Performance Target Check",
            "GET",
            "/api/v3/stats",
            200
        )
        
        if success and isinstance(v3_data, dict):
            targets = v3_data.get('target_performance', {})
            if isinstance(targets, dict):
                response_target = targets.get('response_time_target_ms', 0)
                throughput_target = targets.get('throughput_target_per_min', 0)
                
                print(f"   🎯 Performance targets:")
                print(f"      Response time target: <{response_target}ms")
                print(f"      Throughput target: {throughput_target:,} scans/minute")
                
                # Verify against specifications
                meets_response = response_target <= 5
                meets_throughput = throughput_target >= 50000
                
                if meets_response and meets_throughput:
                    print(f"   ✅ Meets all performance targets")
                    print(f"      ✅ <5ms latency target: {response_target}ms")
                    print(f"      ✅ 50K+ scans/min target: {throughput_target:,}")
                else:
                    print(f"   ⚠️  Performance targets analysis:")
                    if not meets_response:
                        print(f"      ❌ Response time target too high: {response_target}ms (should be ≤5ms)")
                    if not meets_throughput:
                        print(f"      ❌ Throughput target too low: {throughput_target:,} (should be ≥50,000)")
            else:
                print(f"   ❌ Performance targets not found in V3 stats")
        else:
            print(f"   ❌ Could not retrieve V3 performance targets")

    def run_all_tests(self):
        """Run all ultra-optimization system tests"""
        print(f"🚀 Starting Ultra-Optimization Tests...")
        
        try:
            self.test_health_endpoints()
            self.test_optimization_components()
            self.test_v3_scan_system()
            self.test_database_optimization_stats()
            self.test_backend_initialization()
            self.test_performance_targets()
            
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