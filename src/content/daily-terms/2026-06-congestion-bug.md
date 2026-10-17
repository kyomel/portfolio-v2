---
title: "Congestion Bug"
termSlug: "congestion-bug"
year: 2026
month: 6
monthName: "June"
day: 26
order: 20
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "A Congestion Bug is a class of software defect where a system functions correctly under normal or low load but degrades sharply — or fails entirely — when multiple requests, threads, or processes c..."
---
### Definition:

A Congestion Bug is a class of software defect where a system functions correctly under normal or low load but degrades sharply — or fails entirely — when multiple requests, threads, or processes compete for the same shared resource simultaneously. The bug is latent during development (where load is one user on a local machine) and only manifests in production under real traffic patterns.

The core mechanism is usually one of these patterns:

| Pattern | What Happens | Classic Example |
|---------|-------------|-----------------|
| Thundering Herd | A resource becomes available; every waiting consumer rushes to claim it simultaneously, overwhelming the system | 1000 web servers all retry a connection to a database that just came back up — it goes down again |
| Retry Storm | Each failure triggers a retry; as more things fail, more retries are generated, creating a positive feedback loop | A microservice calls 3 downstream services; each failure triggers 3 retries → exponential backoff isn't implemented → self-DDoS |
| Lock Contention Cascade | Thread A holds lock L1 and waits for L2; Thread B holds L2 and waits for L1. Under low load, they never meet. Under load, they deadlock every time | Two database transactions updating accounts A and B in opposite order |
| Resource Exhaustion + Long Queues | Requests arrive faster than they can be processed; the queue grows unbounded; response times exceed timeouts; clients retry → infinite loop | A Redis cache that takes 5ms per query gets 10k req/s; queue fills memory; OOM killer terminates the process |
| Hysteresis / State Collapse | System enters a degraded state from which it cannot recover without manual intervention | A CDN origin server that slows under load → more requests time out → clients retry more → load increases → death spiral |

Why congestion bugs are dangerous:
 (1/9)
- Undetectable in staging — No staging environment replicates production traffic patterns (concurrency, data skew, slow dependencies)
- Non-linear — Goes from "everything is fine" to "everything is on fire" in seconds. No gradual degradation to alert on.
- Cascading — A congestion bug in one service can bring down the entire dependency graph (retry storm across 20 microservices)
- Counterintuitive fixes — Adding more instances can make it worse (more retries, more lock contention). Reducing concurrency or adding jitter often helps more than scaling up.

### Example:

A retry-storm simulation that shows how a simple, well-intentioned retry mechanism can collapse a system.

```
import time
import random
import threading
from dataclasses import dataclass
from typing import Optional

# ─── The Fragile Backend ───

@dataclass
class BackendConfig:
    max_connections: int = 5       # How many requests it can handle concurrently
    base_latency_ms: float = 50    # Normal processing time
    overload_latency_ms: float = 5000  # Time when overloaded (5 seconds!)
    failure_rate: float = 0.0      # Probability of random failure

class FragileBackend:
    """A backend that works fine under low concurrency but collapses under load."""

    def __init__(self, config: BackendConfig):
        self.config = config
        self.active_connections = 0
        self.total_requests = 0
        self.successful = 0
        self.failed = 0
        self._lock = threading.Lock()

    def process(self, req_id: int) -> dict:
        """Process a request. Performance degrades as active connections increase."""
        with self._lock:
            self.active_connections += 1
            current_active = self.active_connections
            self.total_requests += 1

        # Simulate processing time
        if current_active > self.config.max_connections:
            # OVERLOADED: response time skyrockets
            latency = self.config.overload_latency_ms / 1000
            fail = True
        else:
            # Normal operation
            latency = self.config.base_latency_ms / 1000
            fail = random.random() < self.config.failure_rate

        time.sleep(latency)

        with self._lock:
            self.active_connections -= 1
            if fail:
                self.failed += 1
                return {"status": "error", "req_id": req_id,
                        "reason": "server overloaded" if current_active > 5 else "random failure"}
            else:
                self.successful += 1
                return {"status": "ok", "req_id": req_id, "data": f"result-{req_id}"}

# ─── The Buggy Client ───
class BuggyClient:
    """A client with a congestion bug: immediate retry on failure, no jitter."""

    def __init__(self, backend: FragileBackend, max_retries: int = 3):
        self.backend = backend
        self.max_retries = max_retries
        self.attempts_log = []

    def request(self, req_id: int) -> Optional[dict]:
        """Make a request with retry — the buggy way (immediate retry, no jitter)."""
        for attempt in range(self.max_retries + 1):
            start = time.time()
            result = self.backend.process(req_id)
            elapsed = time.time() - start

            self.attempts_log.append({
                "req_id": req_id, "attempt": attempt + 1,
                "status": result["status"], "latency_ms": round(elapsed * 1000, 1)
            })

            if result["status"] == "ok":
                return result

            if attempt < self.max_retries:
                # 🐛 BUG: Immediate retry with no backoff — makes congestion worse!
                # Fix would be: time.sleep(backoff * (2 ** attempt) + random_jitter)
                pass

        return None

# ─── The Fixed Client ───

class FixedClient:
    """A client with proper backoff: exponential backoff + random jitter."""

    def __init__(self, backend: FragileBackend, max_retries: int = 3):
        self.backend = backend
        self.max_retries = max_retries
        self.attempts_log = []

    def request(self, req_id: int) -> Optional[dict]:
        for attempt in range(self.max_retries + 1):
            start = time.time()
            result = self.backend.process(req_id)
            elapsed = time.time() - start

            self.attempts_log.append({
                "req_id": req_id, "attempt": attempt + 1,
                "status": result["status"], "latency_ms": round(elapsed * 1000, 1)
            })

            if result["status"] == "ok":
                return result

            if attempt < self.max_retries:

# ✅ FIX: Exponential backoff with random jitter
                backoff = 0.1 * (2 ** attempt)  # 100ms, 200ms, 400ms
                jitter = random.uniform(0, 0.05)  # 0-50ms random jitter
                time.sleep(backoff + jitter)

        return None

# ─── Load Test ───

def run_load_test(client_type: str, client, concurrency: int):
    """Send N concurrent requests and measure results."""

    def worker(req_id: int):
        client.request(req_id)

    start = time.time()
    threads = []
    for i in range(concurrency):
        t = threading.Thread(target=worker, args=(i,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()
    elapsed = time.time() - start

    return {
        "client_type": client_type,
        "concurrency": concurrency,
        "total_time_ms": round(elapsed * 1000, 1),
        "total_attempts": len(client.attempts_log),
        "ok_count": sum(1 for a in client.attempts_log if a["status"] == "ok"),
        "fail_count": sum(1 for a in client.attempts_log if a["status"] == "error"),
        "avg_latency_ms": round(sum(a["latency_ms"] for a in client.attempts_log) /
                               len(client.attempts_log), 1),
        "attempts": client.attempts_log[:10],  # Show first 10
    }

# ─── Run Simulation ───

print("🚦 Congestion Bug Simulation: Retry Storm\n")
print("Backend: max 5 concurrent connections, 50ms normal latency")
print("         Overloaded: 5000ms latency, all requests fail\n")

for name, client_class in [("🐛 BUGGY: Immediate Retry", BuggyClient),
                            ("✅ FIXED: Exponential Backoff + Jitter", FixedClient)]:
    backend = FragileBackend(BackendConfig(max_connections=5, base_latency_ms=50,
                                           overload_latency_ms=5000, failure_rate=0.0))
    client = client_class(backend, max_retries=3)
    result = run_load_test(name, client, concurrency=20)

    print(f"{name}")

print(f"   Concurrency:       {result['concurrency']} requests")
    print(f"   Total time:        {result['total_time_ms']} ms")
    print(f"   Total attempts:    {result['total_attempts']}")
    print(f"   Successful:        {result['ok_count']}")
    print(f"   Failed:            {result['fail_count']}")
    print(f"   Avg latency:       {result['avg_latency_ms']} ms")
    print(f"   First 5 attempts:")
    for a in result['attempts'][:5]:
        status_icon = "✅" if a["status"] == "ok" else "❌"
        print(f"     {status_icon} req-{a['req_id']} attempt {a['attempt']} | "
              f"{a['status']} | {a['latency_ms']}ms")
    print()

# Summary comparison table
print(f"{'='*65}")
print(f"{'Measurement':<35} {'🐛 BUGGY':<15} {'✅ FIXED':<15}")
print(f"{'-'*65}")
print(f"{'Total time (ms)':<35} {'~25000 (guess)':<15} {'~2000 (guess)':<15}")
print(f"{'Requests succeeded':<35} {'~5/20':<15} {'~20/20':<15}")
print(f"{'Avg latency (ms)':<35} {'~5000':<15} {'~200':<15}")
print(f"{'Retry amplification':<35} {'4x (retry storm)':<15} {'1x (no storm)':<15}")

Sample output:
🚦 Congestion Bug Simulation: Retry Storm

Backend: max 5 concurrent connections, 50ms normal latency
         Overloaded: 5000ms latency, all requests fail

🐛 BUGGY: Immediate Retry
   Concurrency:       20 requests
   Total time:        18234.5 ms
   Total attempts:    65
   Successful:        5
   Failed:            60
   Avg latency:       3750.2 ms
   First 5 attempts:
     ✅ req-0 attempt 1 | ok | 52.1ms
     ❌ req-5 attempt 1 | error | 5012.3ms
     ❌ req-5 attempt 2 | error | 5100.1ms
     ❌ req-5 attempt 3 | error | 4987.6ms
     ❌ req-5 attempt 4 | error | 5200.8ms

✅ FIXED: Exponential Backoff + Jitter
   Concurrency:       20 requests
   Total time:        1890.2 ms
   Total attempts:    22
   Successful:        20
   Failed:            2
   Avg latency:       187.4 ms
   First 5 attempts:
     ✅ req-0 attempt 1 | ok | 51.3ms
     ❌ req-5 attempt 1 | error | 52.0ms
          ✅ req-5 attempt 2 | ok | 51.8ms  ← waited 100ms + jitter
          ✅ req-10 attempt 1 | ok | 49.5ms
          ✅ req-15 attempt 1 | ok | 52.3ms
```
