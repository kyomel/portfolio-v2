---
title: "Hedged Requests (Request Hedging)"
termSlug: "hedged-requests-request-hedging"
year: 2026
month: 9
monthName: "September"
day: 24
order: 18
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "A hedged request is a second copy of a request. The client sends this copy to another backend while the first copy is still in flight. The client uses the first answer that arrives. Then the client..."
---
### Definition:

A **hedged request** is a second copy of a request. The client sends this copy to another backend while the first copy is still in flight. The client uses the first answer that arrives. Then the client cancels every other copy.

The trigger is slowness, not failure. The first copy has not failed yet. It is only late. A hedge covers that gap. This is the main difference from a retry. A retry waits for a failure or a timeout, then sends the request again. A hedge starts before the failure exists.

The technique comes from Jeff Dean and Luiz André Barroso. Their paper "The Tail at Scale" (CACM, 2013) names the problem. One backend can answer in 10 ms on average and still take 1 second at the 99th percentile. A single user request fans out to many backends. The user waits for the slowest one. Suppose each backend is slow in 1 of 100 calls and the request touches 100 backends. Then the user waits on a slow backend in 63 of 100 requests:

```
  1 − (1 − 0.01)^100  =  1 − 0.99^100  ≈  0.634
```

The rare tail of one backend becomes the normal case for the user. This is the order-statistic effect. It is why tail latency gets worse as a system grows.

Hedging attacks that tail directly. The client sends the duplicate only when the primary crosses a threshold. Good practice puts the threshold at a high percentile of the backend latency. The p95 is the classic choice. About 5% of calls cross that line, so the extra traffic stays near 5%. The duplicate is slow in 1 of 100 calls as well. Both copies are slow in 1 of 10,000 calls:

```
  P(both slow)  =  0.01 × 0.01  =  0.0001
```

That independence is the whole reason hedging works. Hedging does not make one backend faster. It makes the slow path rare enough to ignore.

```text
SEQUENTIAL RETRY (reactive)                HEDGED REQUEST (proactive)
════════════════════════════════════════   ════════════════════════════════════

  client                                     client
    │                                          │
    │ t = 0   attempt 1                        │ t = 0   attempt 1
    ▼                                          ▼
 ┌───────────┐                              ┌───────────┐
 │ backend A │   slow, no answer            │ backend A │   slow, no answer
 └─────┬─────┘                              └─────┬─────┘
       │                                          │
       │   wait for a FAILURE                     │   t = 50 ms: threshold
       │   or a TIMEOUT                          │   crossed, still no answer
       │   nothing races the primary              ▼
       ▼                                    ┌────────────────────┐
 ┌───────────────┐                          │ send a SECOND copy │
 │ t = 2000 ms   │                          │ to backend B       │
 │ timeout fires │                          └─────────┬──────────┘
 └───────┬───────┘                                    ▼
         ▼                                      ┌───────────┐
 ┌───────────────┐                              │ backend B │  answers fast
 │ attempt 2     │                              └─────┬─────┘
 │ starts at 0   │                                    │
 └───────┬───────┘                                    │ first answer wins
         ▼                                            ▼
 ┌───────────────────────┐                    ┌────────────────────┐
 │ user waits 2000 ms    │                    │ the slow copy is   │
 │ plus attempt-2 time   │                    │ CANCELED           │
 └───────────────────────┘                    └────────────────────┘

  worst case: timeout + retry time        worst case: threshold + hedge time
  extra load: after a real failure        extra load: about 5% of calls
  helps with: a DEAD backend              helps with: a SLOW STRAGGLER

  ┌──────────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: a retry buys a second chance AFTER a failure.             │
  │  A hedge buys a second chance DURING a slow call.                    │
  │  Duplicate only the tail. Never duplicate all traffic.               │
  └──────────────────────────────────────────────────────────────────────┘
```

The hedge delay is the one number that decides the cost. The table below shows the trade. The numbers are the share of calls that cross the threshold.

```text
  HEDGE DELAY            EXTRA LOAD          WHAT IT REMOVES
  ────────────────────────────────────────────────────────────────────
  no delay (all at once) 100%                nothing. This is plain
                                             request duplication.
  p50                    50%                 a little
  p90                    10%                 a lot
  p95                    5%                  the classic choice
  p99                    1%                  narrow but still useful

  ┌────────────────────────────────────────────────────────────────────┐
  │  Measure the delay from a healthy latency distribution, not from   │
  │  the mean. A delay near the p95 leaves 95% of calls untouched.     │
  │  A fixed delay goes stale. 50 ms is aggressive at 03:00 and too    │
  │  slow at peak. Prefer a threshold that follows the distribution.   │
  └────────────────────────────────────────────────────────────────────┘
```

A hedge is not free. It spends real backend work. Three conditions make it safe.

```
A HEDGE FITS THESE CONDITIONS           A HEDGE IS THE WRONG TOOL FOR
═════════════════════════════════════   ═════════════════════════════════════

  1. THE OPERATION IS IDEMPOTENT          • a write with side effects and
     Canceling the loser does not           no deduplication key
     undo work that already committed.
     A GET is safe. A POST is safe        • streaming RPCs and large uploads.
     only with a dedup key shared           The client cannot replay the
     by every copy.                         outbound history cheaply.

  2. THE BACKEND HAS SPARE ROOM           • a system with no headroom
     A hedge pays only when the             left. A hedge then doubles
     extra work has a place to go.          load at the worst moment.

  3. ALL EXTRA ATTEMPTS SHARE             • an operation with a hard
     ONE BUDGET                             external deadline that is
     Hedges and retries must draw           already tight
     from the same cap. Separate
     caps multiply the load.
```

### Example:

A retail platform runs a catalog service on gRPC. Reads go to three replicas of the catalog store. Each replica answers in 12 ms at the p50, but a garbage collection pause or a queue backlog pushes the p99 to 900 ms.

Product pages call `catalog.v1.Catalog/GetItem`. Each call is small and read-only. The team sees a p99 of 1.2 s on the product page, and the graphs show no errors. The problem is not failure. The problem is a straggler.

The first fix is one block of gRPC service config. The client sends a second copy when the primary crosses 50 ms, and it uses whichever copy answers first.

```
{
  "methodConfig": [
    {
      "name": [
        { "service": "catalog.v1.Catalog", "method": "GetItem" }
      ],
      "hedgingPolicy": {
        "maxAttempts": 3,
        "hedgingDelay": "0.050s",
        "nonFatalStatusCodes": [ "UNAVAILABLE" ]
      }
    }
  ]
}
```

The rules of the gRPC policy matter for the design:

- `maxAttempts` sets the cap on copies in flight. gRPC treats any value above 5 as 5.
- `hedgingDelay` sets the wait before the next copy. If the field is missing, all copies leave at the same time. That is duplication, not hedging.
- `nonFatalStatusCodes` lists the errors that keep the sequence alive. A non-fatal error makes the next copy leave at once. Any other error cancels the rest.
- The call deadline covers the whole chain. It does not restart for each copy.
- A backend can answer with `grpc-retry-pushback-ms` to ask for a longer delay or to stop the sequence.

The flow after the change looks like this:

```text
PRODUCT PAGE CALL — gRPC HEDGING ON catalog.v1.Catalog/GetItem
═══════════════════════════════════════════════════════════════════════

  product-page service
        │
        │  GetItem(item_id)   logical deadline: 300 ms
        ▼
  gRPC client  ── hedgingPolicy: maxAttempts 3, hedgingDelay 50 ms
        │
        ├──► t = 0 ms     copy 1 ──► [replica A]  ... GC pause, no answer
        │                                  │
        │                                  │ still open at t = 50 ms
        │                                  ▼
        ├──► t = 50 ms    copy 2 ──► [replica B]  answers in 11 ms
        │                                  │
        │                                  ▼
        │                          ┌───────────────────────────┐
        │                          │ first answer wins         │
        │                          │ return copy 2 to caller   │
        │                          └───────────────────────────┘
        │                                  │
        └──► copy 3 never leaves       cancel copy 1
                                        drain its body, then
                                        release the connection
                                        back to the pool
        ▼
  user waits 61 ms, not 1200 ms

  COST OF THIS RUN
  ───────────────────────────────────────────────────────────────
   calls that hedged            about 5%
   p99 of the product page      1.2 s  ──►  140 ms
   errors added                 0

  ┌─────────────────────────────────────────────────────────────────┐
  │  Only the slow tail pays the price. 95% of calls still run      │
  │  once, on one replica.                                          │
  └─────────────────────────────────────────────────────────────────┘
```

A fixed 50 ms delay has one weakness. The threshold was set from a Tuesday afternoon measurement. That number does not track the system. At 03:00 the backend is fast and the client hedges too often. At peak the backend is slow and the client hedges too late.

The 2026 production answer is an adaptive threshold. The transport keeps a streaming quantile sketch of the per-backend latency, for example DDSketch, and fires the hedge at the p90 of live traffic. A token bucket caps the hedge rate. With a budget of 10% and a load of 1,000 requests per second, the bucket holds 100 tokens. During a full outage every call is slow, so the bucket empties in about one second and hedging stops by itself. The service degrades instead of doubling its own load.

A 2026 Go reference implementation of this design reported p99 falling from 64 ms to 17 ms in its own benchmark, with the losing hedges capped by the token bucket. Treat that number as one measured case, not as a promise.

The same mechanism now reaches LLM inference, with one correction. The right signal is not time to first byte, because the headers arrive early. The right signal is time to first token. The 2026 benchmark showed the failure of the wrong metric: a transport that hedged on headers fired a backup on nearly every call, so it added 100% overhead while racing on the wrong measurement.

Track these numbers after you turn hedging on:

```
  METRIC                              WHY IT MATTERS
  ───────────────────────────────────────────────────────────────────────
  hedge issue rate                    share of calls that fired a copy.
                                      Keep it near the tail size, ~5%.
  hedge win rate                      how often the copy answers first.
                                      A high rate means the backend is
                                      unhealthy, not lucky.
  wasted work from losing hedges      real backend cost of the design
  latency saved when a hedge wins     the gain that pays for the cost
  share of losers canceled before     if this stays low, the client pays
  the backend starts work             for work it throws away
  attempts per logical call           must stay under the shared budget
```

Two habits keep the pattern honest:

- Hedge only hot paths where a user feels the delay. Hedge a checkout call, not a nightly batch job.
- Couple hedging with a circuit breaker or a token bucket. A hedge on a broken backend makes the outage worse, not better.
