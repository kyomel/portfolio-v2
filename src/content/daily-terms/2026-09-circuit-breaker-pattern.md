---
title: "Circuit Breaker Pattern"
termSlug: "circuit-breaker-pattern"
year: 2026
month: 9
monthName: "September"
day: 15
order: 11
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "The Circuit Breaker Pattern is a resilience pattern in which every outbound call to one specific dependency is wrapped in a small state machine that watches recent outcomes and, once that dependenc..."
---
### Definition:

The **Circuit Breaker Pattern** is a resilience pattern in which every outbound call to *one specific dependency* is wrapped in a small **state machine** that watches recent outcomes and, once that dependency's failure rate (or its latency) crosses a threshold, **stops calling it at all** — failing instantly and locally instead of letting requests pile up on a service that is already falling over.

The name is borrowed straight from electrical engineering, and the analogy is unusually honest: when a wire shorts, the breaker pops so the *house* does not burn down. The wire is already lost. What the breaker protects is everything downstream of it. Software circuit breakers protect exactly the same thing — not the failing dependency, but the caller, its thread pool, its connection pool, its latency, and every user who never asked for that dependency in the first place.

To understand why it exists, you have to notice an asymmetry that fools almost everyone the first time:

```
A DEPENDENCY THAT FAILS FAST  ── almost harmless
   connection refused in 1 ms → you hold a connection for
   1 ms, return an error, move on. Nobody notices except the
   one user who got the error.

A DEPENDENCY THAT FAILS SLOW  ── a loaded gun pointed at YOU
   the same dependency at 10 s instead of 100 ms:
   • every waiting call holds a goroutine/thread,
   • a socket, and
   • a slot in a pool that has a HARD CEILING.
   Little's Law: in-flight requests ≈ arrival_rate × latency.
   Latency went up 100×, traffic did not change,
   so in-flight requests went up 100× → THE POOL IS GONE.
   → your service now returns 5xx to requests that never
     touched the sick dependency at all.
```

That last line is the whole disaster. The checkout page dies because a recommendation widget's API got slow. Cascading failure is not "the bad service took everyone down" — it is *"the bad service made its callers look bad."*

And naive retries make it strictly worse. This is the counter-intuitive part: retry logic, the thing you added to survive blips, is what turns a blip into an outage. Three retries across a dozen replicas multiplies the load hitting a dependency that was already too weak to answer — a self-inflicted DDoS. AWS's own guidance (Builders' Library, *Timeouts, retries and backoff with jitter* / *Good Retry, Bad Retry*) is blunt about it: a retry loop without a budget is a load amplifier, not a resilience feature.

So the design problem is: **how do I stop paying the cost of waiting, when I already know waiting is hopeless?** A timeout caps a *single* call. It does nothing about the ten thousand calls that will each pay that timeout. The circuit breaker is the missing piece: it lets the caller *learn* from recent outcomes and refuse to wait at all once the evidence says the dependency is down.

The comparative picture:

```
WITHOUT A CIRCUIT BREAKER  vs  WITH A CIRCUIT BREAKER
(retry + timeout only)         (retry + timeout + breaker)
═══════════════════════════    ═══════════════════════════════════

  request ──► [slow dep 10 s]    request ──► [ BREAKER: OPEN ]
                    │                             │
        no state, nobody remembers          "I already know this
        that the last 5,000 calls           dep is dead — from the
        also timed out                      last 20 samples"
                    │                             │ 0 ms
                    ▼                             ▼
     ┌────────────────────────────┐   ┌────────────────────────────┐
     │ POOL (cap 200)             │   │ POOL (cap 200)             │
     │ ████████████████████ 200/200│   │ ██               18/200    │
     │ 199 waiting on a corpse,   │   │ 182 slots still serving    │
     │ the 200th is checkout      │   │ everything else normally   │
     └────────────────────────────┘   └────────────────────────────┘
              │                                  │
              ▼                                  ▼
     p99 = 10 s (the timeout)          p99 = 10 s (only for the
     + retries ×3 → the sick dep       few calls in flight);
       receives 3× MORE traffic        breaker-rejected calls
     + cascade: checkout 5xx →           return in ~0 ms with a
       cart 5xx → gateway 5xx            clear, countable error
     = one slow dep takes the          = one slow dep degrades ONE
       whole product down                FEATURE, product stays up
```

The state machine is the core of the pattern, and it has three normal states — plus, importantly, **edges that are deliberately missing**:

```
CLOSED  ──failure rate ≥ threshold──►  OPEN
OPEN    ──waitDurationInOpenState──►   HALF_OPEN
HALF_OPEN ──probes succeed──► CLOSED
HALF_OPEN ──any probe fails──► OPEN

MISSING EDGES (this is where the design lives):
  CLOSED ──✗──► HALF_OPEN   half-open only means "recovering FROM
                            open" — it is meaningless as an entry
                            point, so the transition must not exist
  OPEN   ──✗──► CLOSED      recovery is never assumed from the
                            passage of time; it must be PROVEN
                            by a probe
Keeping the state graph this small is what makes a breaker testable.
```

What each state actually means:

- **CLOSED** — normal operation, the breaker passes every call through and records the outcome. A healthy system spends effectively all its time here. "Closed" = circuit closed = current flows.
- **OPEN** — the breaker short-circuits: it does not call the dependency, it throws immediately (`CallNotPermittedException` in resilience4j). Rejecting *everything* is what gives the dependency room to recover — it also means the breaker now has **zero information** about whether recovery happened, which forces the third state.
- **HALF_OPEN** — after the cool-down, a **bounded number of probe calls** are let through while everything else is still rejected. The naive alternative (flip back to CLOSED after a fixed cooldown) fires the full traffic load at a service that may still be broken — the exact thundering herd the breaker was built to prevent. Probes decide: enough successes → CLOSED; any failure → straight back to OPEN and the timer restarts.

How you make it *trip* (the part people get wrong):

- **The window is what you measure over.** A count-based sliding window is a circular array of the last N outcomes with incremental aggregation (an O(1) snapshot, which is why it beats storing tuples); a time-based window is a ring of per-second buckets — e.g. "the last 10 seconds", which is what Hystrix used by default. Both are *sliding*, not fixed buckets, so a breaker cannot be fooled by a window boundary.
- **Two thresholds, not one.** Failure rate (errors) *and* slow-call rate (latency). A dependency that answers 200 OK in 8 seconds is functionally down; a failure-rate-only breaker will happily keep hammering it. This is the single most common production miss.
- **Minimum throughput is mandatory.** Without it, "1 call, 1 failure" is a 100% failure rate and the breaker opens on one unlucky request. Hystrix required ≥20 requests in the 10 s window before it would even evaluate; resilience4j's defaults are `slidingWindowSize: 100`, `minimumNumberOfCalls: 100`, `failureRateThreshold: 50`, `slowCallRateThreshold: 100` with `slowCallDurationThreshold: 60s`, `permittedNumberOfCallsInHalfOpenState: 10`, `waitDurationInOpenState: 60s`, `automaticTransitionFromOpenToHalfOpenEnabled: false`. Defaults are a *starting point* for a slow internal RPC — not for a checkout path.
- **Timeouts belong INSIDE the breaker.** The timeout's job inside the chain is not to improve your latency; it is to guarantee that **every admitted attempt eventually settles**, so the window never fills with calls that are still hanging. Retry placement is a real design choice, but the invariant (timeout innermost) is not.
- **Stale results are a real bug.** Calls admitted while the breaker was HALF_OPEN may settle several transitions later; a late success counted as-is can close a breaker that a newer probe just re-opened. Mature implementations carry a **generation counter** (bumped on every transition) and discard results whose generation no longer matches.
- **Special states exist so you can control it in operations:** `METRICS_ONLY` (record but never open — the shadow mode you use to *tune* thresholds before trusting them), `DISABLED`, `FORCED_OPEN` (kill switch for a dependency you know is poisoned).

Now the part that makes this a genuinely 2026 term rather than a 2007 one: **"circuit breaker" now names three different mechanisms**, and teams get burned by assuming they are the same thing.

```
THREE DIFFERENT THINGS CALLED "CIRCUIT BREAKER"
══════════════════════════════════════════════════════════════════

1. LIBRARY-LEVEL  (resilience4j, Polly, gobreaker, Hystrix)
   ── a state machine over a sliding window, KEYED BY DEPENDENCY
   ── OPEN/HALF_OPEN/CLOSED, error-rate + slow-call-rate tripping
   ── lives IN your process (or in a shared store — see below)
   → this is what the rest of this entry is about

2. ENVOY / SERVICE-MESH "circuit_breakers"  ← NOT a state machine
   ── hard CONCURRENCY CEILINGS on a cluster:
        max_connections · max_pending_requests
        max_requests    · max_retries             (defaults: 1024!)
   ── exceed it → instant 503 local reply, NO queueing, NO probe
   ── counters: upstream_cx_overflow, upstream_rq_pending_overflow,
                upstream_rq_overflow, upstream_rq_retry_overflow
   → it is a load-shedding gate, not a health state machine.
     A 1024-request ceiling on a service that peaks at 30 concurrent
     requests is not a circuit breaker — it is decoration.

3. ISTIO/ENVOY "OUTLIER DETECTION"  ← per-HOST ejection
   ── consecutive_5xx (default 5), interval, base_ejection_time
   ── ejects the sick POD from the load-balancing pool, then
      re-introduces it after the ejection period (that cycle is the
      closest thing the mesh has to HALF_OPEN)
   ── Envoy itself calls this PASSIVE HEALTH CHECKING, deliberately
      not "circuit breaking" — the vocabulary matters when you
      debug it at 3 AM
```

The mesh variant is the dangerous one, because it looks like free safety and behaves like a feedback loop. A real incident (Mercari, presented at CloudCon 2026: *"When your circuit breaker backfires — outlier detection in Istio and Envoy"*) went exactly like this: outlier detection started ejecting misbehaving pods, the mesh shifted that traffic onto the *remaining* pods, those pods crossed their own saturation point, got ejected too — and traffic concentrated onto fewer and fewer endpoints until they crashed. Errors spread to services that had nothing to do with the change, and the setting had passed every automated policy check. Each component did its job; together they produced a cascade.

There is a deeper version of that trap, and it is the one that should make you cautious about breakers in *sharded* and *cell-based* systems: a breaker aggregates outcomes into a single verdict. If 10% of your dependency's shards are hot, your window sees a 10% error rate, trips, and your caller short-circuits **100% of its traffic — including the 90% of requests that would have succeeded.** Marc Brooker's framing is the sharpest one available: *circuit breakers can misinterpret a partial failure as a total failure and inadvertently bring the system down.* Cells and shards (see day - 14, Cell-Based Architecture) are exactly the topologies where this bites, because partial failure is the normal state of a sharded system. The workaround — the server tells the client *which* shard is overloaded and the client keeps per-shard mini breakers — works and is genuinely painful: more state, more keys, more things to monitor.

So the honest pro/con ledger:

```
┌────────────────────────────────────────────────────────────────┐
│  ✅ WHAT YOU GET                                               │
│  • Converts "wait 10 s, then fail" into "fail in 0 ms"         │
│  • Frees the bounded resource (threads, conns, goroutines)     │
│    that every waiting call was holding                         │
│  • Gives a still-recovering dependency QUIET — no hammering    │
│  • Makes the failure a COUNTABLE, ALERTABLE event              │
│    (rejected_count / calls_total rises before your SLO dies)   │
│  • Turns an unbounded cascade into a bounded, local outage     │
│                                                                │
│  ❌ WHAT YOU PAY / WHAT IT DOES NOT DO                         │
│  • New tuning surface: window type, size, min throughput,      │
│    two thresholds, open duration, probe count — all coupled    │
│  • Does not make requests succeed — it makes them FAIL; you    │
│    still owe the user a fallback, a cached answer or a 503     │
│  • Local breaker state = N replicas each must learn on their   │
│    own → slow collective reaction, and every replica can be    │
│    wrong independently (fixed by a shared window)              │
│  • Can misfire on PARTIAL failure (hot shard, bad tenant,      │
│    single bad region) and short-circuit healthy traffic        │
│  • Without an accompanying RETRY BUDGET, retries outside the   │
│    breaker re-amplify exactly what the breaker stopped         │
│  • A breaker that trips constantly is a SYMPTOM, not a fix —   │
│    the real bug is the dependency, and the breaker is why you  │
│    still have a product while you fix it                       │
└────────────────────────────────────────────────────────────────┘
```

Scaling it beyond one process — this is where the modern design work happens. A breaker per replica sees only the traffic the load balancer happened to send it, so with 20 replicas each needs its own `minimumThroughput` observations before it reacts, and they react at different times. The fix is to move the **window** into a shared store every replica can reach (Redis is the common choice, with the check-and-record done in Lua so it stays atomic):

- **Choose the share key deliberately.** One window per *dependency* (`global`) reacts fastest, because every replica's failures land in the same window — and it is also the most dangerous, since one bad tenant or region opens the breaker for everyone. `region:<x>` or `tenant:<y>` is the middle ground, and scope keys should never contain sensitive data because they live in the coordinator's keyspace.
- **The threshold math must survive the trip.** Compare in integer thousandths (`windowFail * 1000 >= threshold * windowTotal`) — a float threshold rounded to `1.0` becomes "every single observation must fail", i.e. a breaker that never opens. Looks fine in a config file, undebuggable at runtime.
- **The probe budget has to be global**, claimed with a lease. Otherwise every replica independently transitions to HALF_OPEN and races for the slots — recreating the herd in miniature (and the lease must be longer than the slowest possible probe, which is why the timeout inside the breaker matters again).
- **Generation becomes epoch, and the epoch must not move on the OPEN→HALF_OPEN edge** — keeping the epoch *is* how a window is preserved; moving it is how a window is thrown away.
- **A breaker that is not CLOSED must never be allowed to expire.** A missing state record reads as CLOSED, so a silently-TTL'd OPEN state admits all traffic at once — the failure the breaker existed to prevent, delivered on schedule.

And it composes with the patterns this journal already covered: a **Bulkhead Pattern** (isolate the pools so a slow dependency cannot eat the checkout pool at all), the **Retry Budget Pattern** (cap retries as a *fraction* of total traffic — AWS Builders' Library suggests a client can also disable retries entirely once its error rate passes a threshold like 10%), **Load Shedding Architecture** (drop the least valuable work when the pool *is* full), **Tail Latency** (a slow-call-rate threshold is the breaker's latency SLO made actionable), and **Graceful Degradation** / **Cell-Based Architecture** for what the user actually sees while the breaker is open.

The one-line summary: **a circuit breaker is a memory.** Timeouts make a single call cheap to abandon; the breaker makes the *next ten thousand calls* free to abandon, because somebody finally wrote down what everyone already knew.

### Example:

"GymFolks" — an Indonesian fitness app whose `workout-service` (Go, 12 replicas on Kubernetes) calls a third-party **exercise-catalog API** to hydrate each workout card with exercise names, muscle groups, and media URLs. Normal: 300 ms p50, no errors. Then, at 19:00 during the gym rush, the vendor pushes a bad deploy and their API degrades — 40% of calls return 503, the rest crawl at 8–12 s.

The first version of `workout-service` had a 10 s timeout and `retryPolicy: 3 attempts`. Here is what that version does:

```
WITHOUT THE BREAKER — 19:00–19:06, twelve replicas, one slow vendor
════════════════════════════════════════════════════════════════════

  19:00:00  vendor degrades (40% 5xx, else 8–12 s)
  19:00:30  workout-service goroutine usage: 41/200  → 188/200
            (Little's Law: same traffic × 12 s latency)
  19:00:45  ┌──── POOL SATURATED: 200/200 ────────────────────────┐
            │ 196 goroutines: waiting on the vendor              │
            │   4 goroutines:  actual user traffic               │
            │ → endpoints that NEVER touch the vendor now queue:  │
            │   GET /sessions (history)   GET /profile            │
            │   POST /log-set (the core action!)                  │
            └────────────────────────────────────────────────────┘
  19:01:00  retries ×3 → the dying vendor receives ~3× more
            traffic than it was already too weak to serve
            (self-inflicted DDoS on a service that is DOWN)
  19:01:30  cascade: gateway sees 5xx from workout-service,
            its OWN retries fire, the notification worker
            retries, the home-feed aggregator retries…
            ⇒ users cannot log a set. The vendor's outage has
              become GymFolks' outage.
  19:06:00  vendor recovers — but GymFolks stays down another
            4 minutes, because the saturated pool has to drain.
```

The team keeps the timeout and the retries (they are still correct) and adds a **breaker per dependency**, plus a fallback. Go, `gobreaker`-style settings that they actually tuned from metrics rather than guessed:

```
breaker "exercise-catalog":
  window          COUNT_BASED, 20 outcomes   (fast reaction)
  minimumCalls    10        ← without this, 1/1 = 100% → instant open
  errorThreshold  50%       ← trips on the vendor's 40%+ 5xx
  slowThreshold   30% of calls slower than 2000 ms
                            ← catches the SOURCE of the problem:
                              even "successful" vendor calls are
                              eating the pool. Latency threshold
                              fires FIRST here — that is the point
  openDuration    15 s (+0–5 s jitter per replica
                        so 12 replicas do not probe in lockstep)
  probes          3 in HALF_OPEN
  timeout(inside) 2500 ms   ← guarantees every admitted attempt
                              settles and leaves the window
  scope           "dep: exercise-catalog" (NOT a global breaker for
                   all dependencies — the vendor must not trip the
                   payment breaker)
```

```
WITH THE BREAKER — the same vendor outage, six minutes later
════════════════════════════════════════════════════════════════════

  t+0s   vendor degrades
         │
         ▼
  ┌───────────────────── BREAKER: CLOSED ───────────────────────┐
  │ window (last 20 outcomes, sliding)                          │
  │  ✓ ✓ ✓ ✗ ✓ ✗ ✗ ✓ ✗ ✗ ✓ ✗ ✗   ← 8/13 fail (62%) + 9 slow   │
  │  errorRate 62% ≥ 50%   AND   slowRate 69% ≥ 30%             │
  └───────────────────────────┬─────────────────────────────────┘
                              │  TRIP
                              ▼
  ┌───────────────────── BREAKER: OPEN ─────────────────────────┐
  │ EVERY call short-circuits in ~0 ms (no vendor, no socket)   │
  │ goroutines: 41/200 · pool healthy · logs fill with         │
  │   "circuit open for exercise-catalog, serving fallback"     │
  └──────────┬───────────────────────────────┬──────────────────┘
             │                               │
     FALLBACK PATH                    ALL OTHER PATHS
             ▼                               ▼
  ┌──────────────────────────┐   ┌──────────────────────────────┐
  │ local Redis cache of the │   │ /log-set, /sessions,         │
  │ exercise catalog         │   │ /profile, leaderboards       │
  │ (names + muscle groups)  │   │ unaffected, full speed       │
  │ media URLs → placeholder │   │ 182 free goroutine slots     │
  │ card still renders with  │   └──────────────────────────────┘
  │ a "details unavailable"  │
  │ chip — DEGRADED, not     │            ⇒ ONE FEATURE IS
  │ broken (Graceful         │              DEGRADED
  │ Degradation)             │            ⇒ PRODUCT STAYS UP
  └──────────────────────────┘

  t+15s (vendor still sick)
                              ▼
  ┌────────────────── BREAKER: HALF_OPEN ───────────────────────┐
  │ 3 probe calls admitted (only replica #7 wins the lease;    │
  │ the other 11 replicas ask the shared Redis window and are   │
  │ told "probe budget exhausted — keep rejecting")             │
  │   probe 1: 9.8 s ✗  → probe 2 skipped                       │
  │   → back to OPEN, timer restarts (+jitter)                  │
  └──────────────────────────┬──────────────────────────────────┘
                             │  … 4 cycles later, vendor fixed …
                             ▼
  ┌────────────────── BREAKER: HALF_OPEN ───────────────────────┐
  │   probe 1: 287 ms ✓   probe 2: 301 ms ✓   probe 3: 276 ms ✓ │
  │   successRate 100% ≥ threshold → CLOSED                     │
  └──────────────────────────┬──────────────────────────────────┘
                             ▼
  full traffic back to the vendor — returning the FULL payload
  (media URLs, not placeholders) automatically, no deploy, no
  feature flag, no human
```

Two things they got right on the second attempt, both of which are where teams usually lose:

**The breaker state was shared, not local.** With a pure in-process breaker, each of the 12 replicas needs 10 of its *own* outcomes before it reacts — so if the load balancer sends a given replica only 5 vendor calls while the vendor is down, that replica keeps paying 2.5 s timeouts while its neighbours have already given up. They moved the window into Redis, keyed `dep:exercise-catalog`, with admission + recording in one Lua script and a global probe lease — and they kept the scope **per dependency** rather than global precisely because a `global` key means the vendor's bad day also opens the breaker for payments.

**They paired it with a retry budget instead of leaving retries unbounded.** The retry policy now has a budget of 10% of total requests, plus a client-side rule that disables retries entirely when the dependency's error rate passes 10%. That is the difference between "the breaker noticed" and "the breaker noticed *while 11 replicas were still hammering*" — and it is the piece the Mercari incident was missing: outlier detection ejected pods, traffic concentrated on the survivors, and the retries that clients were still sending turned a partial failure into a full one.

And the ending that makes this pattern worth internalising: they deliberately did **not** set the breaker on the *paid* path (`payments`). A breaker there would be wrong the other way around — short-circuiting a payment call fails a user's intent silently and non-retryably, which is worse than paying a few seconds of latency. The rule they wrote into the ADR: **a breaker is for calls you can afford to not make; for calls that must land, you buy latency, not fast failure.**

The punchline: almost all resilience advice is about making individual calls more patient — longer timeouts, more retries, more replicas. The circuit breaker is the one pattern that says the opposite: **patience, applied to a dead dependency, is how you kill yourself.** It does not heal anything and it does not save a single request; it preserves the one resource that lets you survive — the capacity to keep serving the requests that still have a chance. Get the window, the two thresholds and the minimum throughput right, put the timeout inside, share the state once you have more than a few replicas, and pair it with a retry budget; skip any one of those and you have built a device that reliably converts a vendor's bad afternoon into exactly the outage you were trying to avoid.
