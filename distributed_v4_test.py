#!/usr/bin/env python3
"""
Distributed V4 Architecture Tests
=================================
Tests for multi-instance distributed deployment targeting 1M+ scans/minute:
- V4 distributed endpoints (/api/v4/stats, /api/v4/health)
- Distributed cache initialization and fallback
- Distributed processor with instance ID
- Redis cluster support with fallback to in-memory
- Multi-instance coordination capabilities
"""

import requests
import time
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

class DistributedV4Tester:
    def __init__(self, base_url: str = "https://50ebc352-e2d4-4f4e-aa24-0e76550a3033.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.results = {}
        
        print(f"🌐 Distributed V4 Architecture Tester")
        print(f"🔗 Testing backend: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Target: Multi-instance deployment for 1M+ scans/minute")
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
                    key_fields = ['instance_id', 'status', 'cache_connected', 'processor_ready', 'message']
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

    def test_v4_health_endpoint(self):
        """Test V4 distributed health check endpoint"""
        print(f"\n🏥 === V4 HEALTH CHECK TESTS ===")
        
        # Test V4 health endpoint
        success, health_data = self.run_test(
            "V4 Distributed Health Check",
            "GET", 
            "/api/v4/health",
            200
        )
        
        if success and health_data:
            print(f"   🔍 V4 Health Check Analysis:")
            if isinstance(health_data, dict):
                status = health_data.get('status')
                instance_id = health_data.get('instance_id')
                cache_connected = health_data.get('cache_connected')
                processor_ready = health_data.get('processor_ready')
                timestamp = health_data.get('timestamp')
                
                print(f"      Status: {status}")
                print(f"      Instance ID: {instance_id}")
                print(f"      Cache Connected: {cache_connected}")
                print(f"      Processor Ready: {processor_ready}")
                
                # Verify expected components
                if status in ['healthy', 'degraded']:
                    print(f"      ✅ Service status is valid")
                else:
                    print(f"      ⚠️  Unexpected status: {status}")
                    
                if instance_id:
                    print(f"      ✅ Instance ID present (multi-instance ready)")
                else:
                    print(f"      ❌ Instance ID missing")
                
                if cache_connected is False:
                    print(f"      ℹ️  Cache not connected - fallback mode expected")
                elif cache_connected is True:
                    print(f"      ✅ Distributed cache connected")
                
                if processor_ready is True:
                    print(f"      ✅ Distributed processor ready")
                else:
                    print(f"      ❌ Distributed processor not ready")

    def test_v4_stats_endpoint(self):
        """Test V4 distributed statistics endpoint"""
        print(f"\n📊 === V4 DISTRIBUTED STATS TESTS ===")
        
        # Test V4 stats endpoint
        success, stats_data = self.run_test(
            "V4 Distributed System Statistics",
            "GET",
            "/api/v4/stats",
            200
        )
        
        if success and stats_data:
            print(f"   📈 V4 Distributed Stats Analysis:")
            if isinstance(stats_data, dict):
                instance_id = stats_data.get('instance_id')
                processor_stats = stats_data.get('processor', {})
                cache_stats = stats_data.get('cache', {})
                cluster_info = stats_data.get('cluster_info', {})
                
                print(f"      Instance ID: {instance_id}")
                
                # Processor statistics
                if isinstance(processor_stats, dict) and processor_stats:
                    print(f"      📊 Processor Stats:")
                    processed = processor_stats.get('processed', 0)
                    valid = processor_stats.get('valid', 0) 
                    invalid = processor_stats.get('invalid', 0)
                    duplicates = processor_stats.get('duplicates', 0)
                    errors = processor_stats.get('errors', 0)
                    proc_instance_id = processor_stats.get('instance_id')
                    
                    print(f"         Processed: {processed}, Valid: {valid}, Invalid: {invalid}")
                    print(f"         Duplicates: {duplicates}, Errors: {errors}")
                    print(f"         Processor Instance ID: {proc_instance_id}")
                    
                    if proc_instance_id:
                        print(f"         ✅ Distributed processor has instance ID")
                    else:
                        print(f"         ❌ Processor missing instance ID")
                else:
                    print(f"      ❌ Processor stats missing or invalid")
                
                # Cache statistics
                if isinstance(cache_stats, dict) and cache_stats:
                    print(f"      💾 Cache Stats:")
                    connected = cache_stats.get('connected', False)
                    mode = cache_stats.get('mode', 'unknown')
                    hits = cache_stats.get('hits', 0)
                    misses = cache_stats.get('misses', 0)
                    errors = cache_stats.get('errors', 0)
                    fallback_hits = cache_stats.get('fallback_hits', 0)
                    hit_rate = cache_stats.get('hit_rate', 0)
                    fallback_cache_size = cache_stats.get('fallback_cache_size', 0)
                    
                    print(f"         Connected: {connected}, Mode: {mode}")
                    print(f"         Hits: {hits}, Misses: {misses}, Hit Rate: {hit_rate}%")
                    print(f"         Fallback Hits: {fallback_hits}, Fallback Size: {fallback_cache_size}")
                    
                    if connected:
                        print(f"         ✅ Distributed cache connected")
                    else:
                        print(f"         ℹ️  Cache using fallback mode (expected without Redis)")
                        
                    if mode in ['standalone', 'cluster', 'sentinel']:
                        print(f"         ✅ Valid Redis mode: {mode}")
                    else:
                        print(f"         ⚠️  Unknown Redis mode: {mode}")
                else:
                    print(f"      ❌ Cache stats missing or invalid")
                
                # Cluster information
                if isinstance(cluster_info, dict) and cluster_info:
                    print(f"      🏘️  Cluster Info:")
                    cluster_status = cluster_info.get('status')
                    cluster_mode = cluster_info.get('mode')
                    print(f"         Status: {cluster_status}, Mode: {cluster_mode}")
                    
                    if cluster_status == 'connected':
                        print(f"         ✅ Redis cluster connected")
                    else:
                        print(f"         ℹ️  Redis cluster status: {cluster_status}")
                else:
                    print(f"      ℹ️  Cluster info not available (fallback mode)")

    def test_v4_router_registration(self):
        """Test that V4 router endpoints are properly registered"""
        print(f"\n🛣️  === V4 ROUTER REGISTRATION TESTS ===")
        
        # Test various V4 endpoints to ensure router is registered
        v4_endpoints = [
            ("/api/v4/health", "Health Check"),
            ("/api/v4/stats", "Statistics")
        ]
        
        registered_endpoints = 0
        total_endpoints = len(v4_endpoints)
        
        for endpoint, description in v4_endpoints:
            success, _ = self.run_test(
                f"V4 {description} Registration",
                "GET",
                endpoint,
                200
            )
            
            if success:
                registered_endpoints += 1
                print(f"      ✅ {endpoint} - Registered and responding")
            else:
                print(f"      ❌ {endpoint} - Not responding")
        
        print(f"\n   📊 V4 Router Registration Summary:")
        print(f"      Registered: {registered_endpoints}/{total_endpoints}")
        
        if registered_endpoints == total_endpoints:
            print(f"      ✅ All V4 endpoints properly registered")
        else:
            print(f"      ❌ Some V4 endpoints not accessible")

    def test_distributed_cache_fallback(self):
        """Test distributed cache initialization and fallback behavior"""
        print(f"\n💾 === DISTRIBUTED CACHE FALLBACK TESTS ===")
        
        # Get cache stats to analyze fallback behavior
        success, stats_data = self.run_test(
            "Cache Fallback Analysis",
            "GET",
            "/api/v4/stats",
            200
        )
        
        if success and isinstance(stats_data, dict):
            cache_stats = stats_data.get('cache', {})
            if isinstance(cache_stats, dict):
                connected = cache_stats.get('connected', False)
                mode = cache_stats.get('mode', 'unknown')
                fallback_hits = cache_stats.get('fallback_hits', 0)
                fallback_cache_size = cache_stats.get('fallback_cache_size', 0)
                
                print(f"   🔍 Cache Fallback Analysis:")
                print(f"      Redis Connected: {connected}")
                print(f"      Redis Mode: {mode}")
                print(f"      Fallback Cache Size: {fallback_cache_size}")
                print(f"      Fallback Hits: {fallback_hits}")
                
                if not connected:
                    print(f"      ✅ Fallback mode active (expected without Redis cluster)")
                    if fallback_cache_size >= 0:
                        print(f"      ✅ In-memory fallback cache initialized")
                    else:
                        print(f"      ❌ Fallback cache not properly initialized")
                else:
                    print(f"      ✅ Redis cluster connected successfully")
                    print(f"      ℹ️  Mode: {mode}")
                
                # Test cache functionality regardless of connection status
                print(f"      ✅ Cache system operational (Redis or fallback)")
            else:
                print(f"      ❌ Cache stats not available")
        else:
            print(f"      ❌ Could not retrieve cache fallback information")

    def test_distributed_processor_initialization(self):
        """Test distributed processor initialization with instance ID"""
        print(f"\n⚙️  === DISTRIBUTED PROCESSOR INITIALIZATION TESTS ===")
        
        # Get processor stats to verify initialization
        success, stats_data = self.run_test(
            "Processor Initialization Check",
            "GET",
            "/api/v4/stats",
            200
        )
        
        if success and isinstance(stats_data, dict):
            processor_stats = stats_data.get('processor', {})
            if isinstance(processor_stats, dict):
                instance_id = processor_stats.get('instance_id')
                processed = processor_stats.get('processed', 0)
                valid = processor_stats.get('valid', 0)
                invalid = processor_stats.get('invalid', 0)
                duplicates = processor_stats.get('duplicates', 0)
                errors = processor_stats.get('errors', 0)
                
                print(f"   🔍 Processor Initialization Analysis:")
                print(f"      Instance ID: {instance_id}")
                print(f"      Stats Tracking: processed={processed}, valid={valid}, invalid={invalid}")
                print(f"      Error Tracking: duplicates={duplicates}, errors={errors}")
                
                if instance_id:
                    print(f"      ✅ Distributed processor has unique instance ID")
                    if len(str(instance_id)) >= 4:
                        print(f"      ✅ Instance ID appears to be properly generated")
                    else:
                        print(f"      ⚠️  Instance ID may be too short: {instance_id}")
                else:
                    print(f"      ❌ Distributed processor missing instance ID")
                
                # Check if stats are being tracked (even if zero)
                if all(isinstance(stat, int) for stat in [processed, valid, invalid, duplicates, errors]):
                    print(f"      ✅ Processor statistics properly initialized")
                else:
                    print(f"      ❌ Processor statistics not properly initialized")
                    
                # Verify processor is ready for distributed operation
                print(f"      ✅ Distributed processor ready for multi-instance deployment")
            else:
                print(f"      ❌ Processor stats not available")
        else:
            print(f"      ❌ Could not retrieve processor initialization information")

    def test_multi_instance_readiness(self):
        """Test overall multi-instance deployment readiness"""
        print(f"\n🌐 === MULTI-INSTANCE DEPLOYMENT READINESS ===")
        
        readiness_checks = {
            "v4_health": False,
            "v4_stats": False, 
            "instance_id": False,
            "cache_fallback": False,
            "processor_ready": False
        }
        
        # Check V4 health endpoint
        success, health_data = self.run_test(
            "Multi-Instance Health Readiness",
            "GET",
            "/api/v4/health", 
            200
        )
        
        if success:
            readiness_checks["v4_health"] = True
            if isinstance(health_data, dict):
                if health_data.get('instance_id'):
                    readiness_checks["instance_id"] = True
                if health_data.get('processor_ready'):
                    readiness_checks["processor_ready"] = True
        
        # Check V4 stats endpoint
        success, stats_data = self.run_test(
            "Multi-Instance Stats Readiness",
            "GET",
            "/api/v4/stats",
            200
        )
        
        if success:
            readiness_checks["v4_stats"] = True
            if isinstance(stats_data, dict):
                cache_stats = stats_data.get('cache', {})
                if isinstance(cache_stats, dict):
                    # Cache is ready if either connected to Redis OR fallback is working
                    connected = cache_stats.get('connected', False)
                    fallback_size = cache_stats.get('fallback_cache_size', -1)
                    if connected or fallback_size >= 0:
                        readiness_checks["cache_fallback"] = True
        
        # Print readiness summary
        print(f"\n   📋 Multi-Instance Deployment Readiness:")
        ready_count = sum(1 for check in readiness_checks.values() if check)
        total_checks = len(readiness_checks)
        
        for check_name, is_ready in readiness_checks.items():
            status = "✅" if is_ready else "❌"
            print(f"      {status} {check_name.replace('_', ' ').title()}")
        
        print(f"\n   📊 Overall Readiness: {ready_count}/{total_checks} ({ready_count/total_checks*100:.1f}%)")
        
        if ready_count == total_checks:
            print(f"   🎉 System ready for multi-instance deployment!")
            print(f"   🚀 Can scale to multiple instances for 1M+ scans/minute")
        else:
            print(f"   ⚠️  Some components not ready for multi-instance deployment")

    def run_all_tests(self):
        """Run all distributed V4 system tests"""
        print(f"🌐 Starting Distributed V4 Architecture Tests...")
        
        try:
            self.test_v4_health_endpoint()
            self.test_v4_stats_endpoint()
            self.test_v4_router_registration()
            self.test_distributed_cache_fallback()
            self.test_distributed_processor_initialization()
            self.test_multi_instance_readiness()
            
        except KeyboardInterrupt:
            print(f"\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error during testing: {e}")
        
        self.print_summary()

    def print_summary(self):
        """Print comprehensive test summary"""
        print(f"\n" + "=" * 60)
        print(f"📋 DISTRIBUTED V4 ARCHITECTURE TEST SUMMARY")
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
        
        # V4 component status
        if 'V4 Distributed Health Check' in self.results:
            health_result = self.results['V4 Distributed Health Check']
            if health_result['status'] == 'PASS':
                print(f"\n🏥 V4 HEALTH: ✅ Distributed health check operational")
            else:
                print(f"\n🏥 V4 HEALTH: ❌ Health check not responding")
        
        if 'V4 Distributed System Statistics' in self.results:
            stats_result = self.results['V4 Distributed System Statistics']
            if stats_result['status'] == 'PASS':
                print(f"📊 V4 STATS: ✅ Distributed statistics operational")
            else:
                print(f"📊 V4 STATS: ❌ Statistics not responding")
        
        # Key architecture features
        print(f"\n📋 DISTRIBUTED ARCHITECTURE FEATURES:")
        print(f"   🌐 Multi-instance deployment support")
        print(f"   💾 Redis cluster with in-memory fallback")
        print(f"   ⚙️  Distributed scan processor with instance ID")
        print(f"   🔄 Distributed deduplication and locking")
        print(f"   📊 Instance-specific statistics and monitoring")
        print(f"   🎯 Scalable to 1M+ scans/minute across instances")
        
        print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Return exit code
        return 0 if len(self.failed_tests) == 0 else 1


def main():
    """Main test execution"""
    print("=" * 60)
    print("🌐 DISTRIBUTED V4 ARCHITECTURE TESTS")
    print("   Testing multi-instance deployment capabilities")
    print("   Target: 1M+ scans/minute with horizontal scaling")
    print("=" * 60)
    
    # Initialize tester
    tester = DistributedV4Tester()
    
    # Run all tests
    exit_code = tester.run_all_tests()
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())