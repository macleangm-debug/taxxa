"""
Load Testing Script for Taxxa High-Performance API
===================================================
Simulates high-volume scan traffic to test system capacity.

Usage:
    python load_test.py --target-rps 1000 --duration 60
"""

import asyncio
import aiohttp
import argparse
import time
import json
import random
import hashlib
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict
import statistics


@dataclass
class LoadTestResult:
    """Results from load test run"""
    total_requests: int = 0
    successful: int = 0
    failed: int = 0
    duplicate: int = 0
    invalid: int = 0
    errors: int = 0
    
    latencies_ms: List[float] = None
    
    start_time: float = 0
    end_time: float = 0
    
    def __post_init__(self):
        if self.latencies_ms is None:
            self.latencies_ms = []
    
    @property
    def duration_seconds(self) -> float:
        return self.end_time - self.start_time
    
    @property
    def requests_per_second(self) -> float:
        if self.duration_seconds > 0:
            return self.total_requests / self.duration_seconds
        return 0
    
    @property
    def success_rate(self) -> float:
        if self.total_requests > 0:
            return (self.successful / self.total_requests) * 100
        return 0
    
    @property
    def avg_latency_ms(self) -> float:
        if self.latencies_ms:
            return statistics.mean(self.latencies_ms)
        return 0
    
    @property
    def p50_latency_ms(self) -> float:
        if self.latencies_ms:
            return statistics.median(self.latencies_ms)
        return 0
    
    @property
    def p99_latency_ms(self) -> float:
        if len(self.latencies_ms) >= 100:
            sorted_latencies = sorted(self.latencies_ms)
            idx = int(len(sorted_latencies) * 0.99)
            return sorted_latencies[idx]
        return max(self.latencies_ms) if self.latencies_ms else 0
    
    def to_dict(self) -> Dict:
        return {
            "total_requests": self.total_requests,
            "successful": self.successful,
            "failed": self.failed,
            "duplicate": self.duplicate,
            "invalid": self.invalid,
            "errors": self.errors,
            "duration_seconds": round(self.duration_seconds, 2),
            "requests_per_second": round(self.requests_per_second, 2),
            "success_rate": round(self.success_rate, 2),
            "latency_ms": {
                "avg": round(self.avg_latency_ms, 2),
                "p50": round(self.p50_latency_ms, 2),
                "p99": round(self.p99_latency_ms, 2),
                "min": round(min(self.latencies_ms), 2) if self.latencies_ms else 0,
                "max": round(max(self.latencies_ms), 2) if self.latencies_ms else 0,
            }
        }


class LoadTester:
    """High-performance load tester for scan API"""
    
    MERCHANTS = ["MER-001", "MER-002", "MER-003", "MER-004", "MER-005"]
    
    def __init__(
        self,
        base_url: str,
        auth_token: str,
        target_rps: int = 100,
        duration_seconds: int = 60,
        concurrency: int = 100
    ):
        self.base_url = base_url.rstrip('/')
        self.auth_token = auth_token
        self.target_rps = target_rps
        self.duration_seconds = duration_seconds
        self.concurrency = concurrency
        
        self.result = LoadTestResult()
        self._running = False
        self._receipt_counter = 0
    
    def _generate_receipt(self) -> str:
        """Generate a unique test receipt"""
        self._receipt_counter += 1
        
        receipt_id = f"LOAD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{self._receipt_counter}"
        merchant_id = random.choice(self.MERCHANTS)
        amount = random.uniform(10, 500)
        
        receipt_data = {
            "receipt_id": receipt_id,
            "merchant_id": merchant_id,
            "amount": round(amount, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "signature": hashlib.sha256(receipt_id.encode()).hexdigest()[:32]
        }
        
        return json.dumps(receipt_data)
    
    async def _make_request(self, session: aiohttp.ClientSession) -> Dict:
        """Make a single scan request"""
        start_time = time.time()
        
        try:
            payload = {
                "qr_data": self._generate_receipt()
            }
            
            async with session.post(
                f"{self.base_url}/api/v2/scan",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.auth_token}",
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                latency_ms = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    status = data.get("status", "unknown")
                    return {
                        "success": True,
                        "status": status,
                        "latency_ms": latency_ms
                    }
                elif response.status == 429:
                    return {
                        "success": False,
                        "status": "rate_limited",
                        "latency_ms": latency_ms
                    }
                else:
                    return {
                        "success": False,
                        "status": "error",
                        "latency_ms": latency_ms,
                        "error": f"HTTP {response.status}"
                    }
                    
        except asyncio.TimeoutError:
            return {
                "success": False,
                "status": "timeout",
                "latency_ms": (time.time() - start_time) * 1000
            }
        except Exception as e:
            return {
                "success": False,
                "status": "error",
                "latency_ms": (time.time() - start_time) * 1000,
                "error": str(e)
            }
    
    async def _worker(self, session: aiohttp.ClientSession, request_interval: float):
        """Worker that sends requests at specified rate"""
        while self._running:
            result = await self._make_request(session)
            
            self.result.total_requests += 1
            self.result.latencies_ms.append(result["latency_ms"])
            
            if result["success"]:
                status = result["status"]
                if status == "valid":
                    self.result.successful += 1
                elif status == "duplicate":
                    self.result.duplicate += 1
                elif status == "invalid":
                    self.result.invalid += 1
                else:
                    self.result.successful += 1
            else:
                self.result.errors += 1
            
            # Rate limiting
            await asyncio.sleep(request_interval)
    
    async def run(self) -> LoadTestResult:
        """Run the load test"""
        print(f"\n{'='*60}")
        print(f"TAXXA API Load Test")
        print(f"{'='*60}")
        print(f"Target: {self.base_url}")
        print(f"Target RPS: {self.target_rps}")
        print(f"Duration: {self.duration_seconds}s")
        print(f"Concurrency: {self.concurrency}")
        print(f"{'='*60}\n")
        
        # Calculate request interval per worker
        requests_per_worker = self.target_rps / self.concurrency
        request_interval = 1.0 / requests_per_worker if requests_per_worker > 0 else 1.0
        
        self.result = LoadTestResult()
        self.result.start_time = time.time()
        self._running = True
        
        # Create connection pool
        connector = aiohttp.TCPConnector(
            limit=self.concurrency * 2,
            limit_per_host=self.concurrency * 2,
            keepalive_timeout=30
        )
        
        async with aiohttp.ClientSession(connector=connector) as session:
            # Start workers
            workers = [
                asyncio.create_task(self._worker(session, request_interval))
                for _ in range(self.concurrency)
            ]
            
            # Progress reporting
            start = time.time()
            while time.time() - start < self.duration_seconds:
                await asyncio.sleep(5)
                elapsed = time.time() - start
                current_rps = self.result.total_requests / elapsed if elapsed > 0 else 0
                print(f"Progress: {elapsed:.0f}s | Requests: {self.result.total_requests} | RPS: {current_rps:.0f}")
            
            # Stop workers
            self._running = False
            for worker in workers:
                worker.cancel()
            
            await asyncio.gather(*workers, return_exceptions=True)
        
        self.result.end_time = time.time()
        
        return self.result
    
    def print_results(self):
        """Print formatted test results"""
        r = self.result.to_dict()
        
        print(f"\n{'='*60}")
        print(f"LOAD TEST RESULTS")
        print(f"{'='*60}")
        print(f"Duration:          {r['duration_seconds']}s")
        print(f"Total Requests:    {r['total_requests']}")
        print(f"Requests/Second:   {r['requests_per_second']}")
        print(f"{'='*60}")
        print(f"Successful:        {r['successful']} ({r['success_rate']}%)")
        print(f"Duplicates:        {self.result.duplicate}")
        print(f"Invalid:           {self.result.invalid}")
        print(f"Errors:            {r['errors']}")
        print(f"{'='*60}")
        print(f"Latency (ms):")
        print(f"  Average:         {r['latency_ms']['avg']}")
        print(f"  P50:             {r['latency_ms']['p50']}")
        print(f"  P99:             {r['latency_ms']['p99']}")
        print(f"  Min:             {r['latency_ms']['min']}")
        print(f"  Max:             {r['latency_ms']['max']}")
        print(f"{'='*60}\n")


async def main():
    parser = argparse.ArgumentParser(description="Taxxa API Load Tester")
    parser.add_argument("--url", default="http://localhost:8001", help="API base URL")
    parser.add_argument("--token", required=True, help="Auth token")
    parser.add_argument("--target-rps", type=int, default=100, help="Target requests per second")
    parser.add_argument("--duration", type=int, default=60, help="Test duration in seconds")
    parser.add_argument("--concurrency", type=int, default=100, help="Number of concurrent workers")
    
    args = parser.parse_args()
    
    tester = LoadTester(
        base_url=args.url,
        auth_token=args.token,
        target_rps=args.target_rps,
        duration_seconds=args.duration,
        concurrency=args.concurrency
    )
    
    await tester.run()
    tester.print_results()


if __name__ == "__main__":
    asyncio.run(main())
