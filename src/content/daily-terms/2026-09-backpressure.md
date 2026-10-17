---
title: "Backpressure"
termSlug: "backpressure"
year: 2026
month: 9
monthName: "September"
day: 22
order: 16
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Backpressure is a control signal that travels backward through a pipeline. A slow consumer sends the signal upstream. A fast producer receives the signal and slows down, blocks, or stops. The consu..."
---
### Definition:

**Backpressure** is a control signal that travels backward through a pipeline. A slow consumer sends the signal upstream. A fast producer receives the signal and slows down, blocks, or stops. The consumer sets the pace, not the producer.

The need comes from simple arithmetic. Producers almost always run faster than consumers, at least in bursts. Without a signal, the extra work must go somewhere. It goes into a buffer. The buffer grows with no ceiling. Memory runs out. The process dies, and every request in the buffer dies with it.

Backpressure adds one rule: the buffer has a ceiling, and the producer feels that ceiling.

```
WITHOUT BACKPRESSURE (no ceiling)      WITH BACKPRESSURE (bounded gate)
═════════════════════════════════      ═══════════════════════════════════

  producer  12,000 req/s                 producer  12,000 req/s
      │                                      │
      │  no signal goes up                   │  ◄── "slow down" signal
      ▼                                      ▼
  ┌────────────────────┐                 ┌────────────────────┐
  │ queue   size = ∞   │                 │ queue  max = 10,000│
  │ grows 7,000 req/s  │                 │ held at the ceiling│
  │ + 13.7 MB/s        │                 └─────────┬──────────┘
  └─────────┬──────────┘                           │ 5,000 req/s
            │ 5,000 req/s                         ▼
            ▼                                consumer work
      consumer work
                                            heap stays flat.
  8 GB heap fills in 10 minutes.            New work waits, then
  Then OOM kill. All queued                 gets refused at the gate.
  requests fail together.                   Blast radius stays small.

  RESULT: unbounded queue = a latency       RESULT: latency grows inside
  and memory bug that hides until           a known limit. Refusal is
  traffic spikes.                           explicit and cheap.
```

The signal exists at every layer of the stack. The shape is always the same: credit or space flows back, the sender respects it.

```
ONE MECHANISM, MANY LAYERS — THE SIGNAL ALWAYS TRAVELS BACKWARD
═══════════════════════════════════════════════════════════════════════
  LAYER                SIGNAL                 PRODUCER BEHAVIOR
  ───────────────────────────────────────────────────────────────────
  TCP                  receive window (rwnd)  stops sending when the
                       carried in every ACK   window reaches 0, resumes
                                              on the next window update

  HTTP/2 and gRPC      WINDOW_UPDATE frames   pauses the stream or the
                       per stream, per conn   connection, resumes on
                                              fresh window credit

  Node.js streams      write() returns false  waits for the 'drain'
                       past highWaterMark     event (default 16,384
                       (default 16,384 bytes) bytes per stream)

  Reactive Streams     Subscription           emits at most n items,
                       .request(n)            never more. Demand comes
                                              from the subscriber

  Kafka consumers      consumer lag,          poll() stops fetching,
                       pause() / resume()     the group holds its
                                              position until the
                                              consumer catches up

  Application (LLM)    queue depth + queue    producer holds, or the
                       wait time against      gateway answers 429 or
                       the TTFT budget        503 with Retry-After
  ───────────────────────────────────────────────────────────────────
```

Six design rules carry the pattern:

- Make the signal explicit. An unbounded queue deletes the signal. It converts an overload problem into a slow memory leak that appears only under peak traffic.
- Treat the buffer as a shock absorber, not a reservoir. Size the queue for microbursts of seconds, not for a full traffic spike of minutes.
- Keep the signal cheap. A signal that costs a network round trip makes throughput worse. Local credit counters are cheap. Remote calls are not.
- Add timeouts. A producer that waits for a slow consumer must fail at some point. A wait without a deadline is a deadlock in progress.
- Pair it with shedding. Backpressure slows the arrival rate. Load shedding refuses work. Backpressure alone cannot protect a service that has no spare capacity left.
- Alert on the backlog, not on CPU. Consumer lag, queue depth, and queue wait time show the problem first. CPU stays low while a queue grows, because the consumer is waiting on something else.

What it is not:

```
BACKPRESSURE vs LOAD SHEDDING vs RATE LIMITING
═══════════════════════════════════════════════════════════════════
                WHO ACTS        WHAT IT DOES         WHERE THE
                                                     SIGNAL COMES FROM
  ───────────────────────────────────────────────────────────────
  Backpressure  producer        slows, blocks,       the consumer
                (told by the    or waits             (measured load)
                consumer)

  Rate limiting gateway         caps the arrival     a fixed policy
                (per client)    rate before work     or a quota
                                starts

  Load shedding server          refuses work now     local load or
                (own load)      with 429 or 503      a queue ceiling

  They compose. A gateway rate limit protects the door. Backpressure
  protects the pipe. Load shedding protects the last line of defense.
```

Honest limits of the pattern:

- Backpressure moves the failure to the edge. The producer now waits, so the caller sees higher latency. That latency is the visible price of stability.
- A consumer that is permanently too slow never catches up. Backpressure holds the line. It does not add throughput. Only more capacity or less work does that.
- One stuck consumer can block a shared producer. This is head-of-line blocking. Per-tenant queues, separate connections, and bulkheads contain it.
- Both sides can wait on each other. A blocked request that holds a lock the consumer needs is a deadlock. Timeouts and bounded retries break the cycle.

### Example:

An agent platform runs a self-hosted LLM inference service behind an API gateway. One agent workflow fans out many calls at once, and each call chains 10 to 20 model requests.

Monday 09:00. The fan-out sends 12,000 requests per second to the gateway. The GPU worker pool completes 5,000 requests per second. The autoscaler sees the pressure at 09:02. A new GPU pod needs about 4 minutes to schedule, pull the image, and load the model weights.

The queue degrades much faster than the GPU fleet grows. Queue growth wins the race.

```
THE RACE — 09:00 SPIKE, NO BACKPRESSURE
═══════════════════════════════════════════════════════════════════════

  09:00  arrival 12,000 req/s   workers 5,000 req/s   gap 7,000 req/s
         │
         │  2 KB headers per request → +13.7 MB/s into the queue
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ queue depth                                                      │
  │   0 ──► 420,000 ──► 840,000 ──►        ... ──►  2,100,000        │
  │  09:00      09:01       09:02       (spike for 300 s)            │
  └──────────────────────────────────────────────────────────────────┘
         │
         │  8 GB of queue space fills in 10 minutes
         ▼
  09:10  ┌───────────────────────────────────────────────────────────┐
         │ OOM kill. Every queued request fails together.            │
         │ Clients retry. The retries arrive on top of the backlog.  │
         │ The condition is now self-sustaining.                     │
         └───────────────────────────────────────────────────────────┘

  The new GPU pod lands at 09:06. Useful, but late.
  Draining 2,100,000 queued requests at 5,000 req/s takes 420 s (7 min).
  Requests that waited 300 s already blew a 2 s TTFT budget 150x over.
  Queue growth outran both the autoscaler and the SLO.
```

The fix uses four layers. Each layer answers a failure the layer below cannot.

```
CONTROL LOOP THAT HOLDS — SLO + BACKPRESSURE + SHEDDING + AUTOSCALING
═══════════════════════════════════════════════════════════════════════

  client / agent fan-out
        │  12,000 req/s
        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ LAYER 1  API GATEWAY — admission control at the door            │
  │          reads queue state, then decides: queue or refuse       │
  └─────────────────────────────┬───────────────────────────────────┘
             accepted           │            refused
                                │             └──► 429 or 503
                                ▼                  + Retry-After: 2
  ┌─────────────────────────────────────────────────────────────────┐
  │ LAYER 2  BOUNDED QUEUE — max_queued_requests = 10,000,          │
  │          max wait = 0.75 s (40% of a 1.9 s TTFT budget)         │
  │          the ceiling IS the backpressure signal                 │
  └─────────────────────────────┬───────────────────────────────────┘
                                │  workers pull at 5,000 req/s
                                ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ LAYER 3  GPUs (vLLM) — continuous batching, priority lanes.     │
  │          A P0 interactive request preempts a P2 batch request,  │
  │          keeps its KV cache, and resumes when credit returns.   │
  └─────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ LAYER 4  AUTOSCALER — scales on queue depth and TTFT, not CPU.  │
  │          Adds supply. Needs 4 min. Backpressure covers those    │
  │          4 minutes without losing the whole queue.              │
  └─────────────────────────────────────────────────────────────────┘
```

The gateway rule is a two-state decision, measured against the wait budget:

```
  STATE   TRIGGER                                     ACTION
  ──────────────────────────────────────────────────────────────────
  GREEN   queue_time < 40% of the TTFT budget         accept normally

  RED     queue_time + expected_scale_up_time         shed now:
          >= the TTFT budget                         429 / 503
                                                     + Retry-After

  Why shed and not queue? A request that waits 4 minutes and then
  times out costs full GPU work, full tokens, and one connection.
  A request refused in 1 ms costs nothing and frees the client to
  pick another route. Failing fast is cheaper than failing slow.
```

A simplified gate, in Python. The `await` on a full queue is the backpressure. The timeout is the point where backpressure becomes shedding.

```python
import asyncio

MAX_QUEUED = 10_000        # ceiling on waiting requests
MAX_WAIT_S = 0.75          # 40% of a 1.9 s TTFT budget

class Overloaded(Exception):
    """The gateway answers 429 or 503 with Retry-After."""

class Gate:
    def __init__(self):
        # maxsize is the backpressure signal. Remove it and the
        # queue grows until the process runs out of memory.
        self.queue = asyncio.Queue(maxsize=MAX_QUEUED)

    async def admit(self, req):
        try:
            # Full queue -> put() waits. The producer feels the ceiling.
            await asyncio.wait_for(self.queue.put(req), timeout=MAX_WAIT_S)
        except asyncio.TimeoutError:
            # The wait budget is gone. Shed the request, do not queue it.
            raise Overloaded("429 Retry-After: 2")

    async def worker(self):
        while True:
            req = await self.queue.get()     # pull at consumer speed
            await run_on_gpu(req)
            self.queue.task_done()
```

Measured on the same 09:00 spike, the two designs diverge:

```
OUTCOME COMPARISON — SAME 12,000 req/s SPIKE
═══════════════════════════════════════════════════════════════════

                        NO BACKPRESSURE      BOUNDED + SHED
  ────────────────────────────────────────────────────────────────
  peak queue depth      2,100,000            10,000 (ceiling)
  queue memory          ~8 GB, OOM at 09:10  ~20 MB, flat
  p99 TTFT              300+ s then fail     inside SLO or refused
  refused requests      0 refused, most      429 in under 1 ms,
                        failed later         client retries safely
  worker work           3.15B tokens spent   tokens spent only on
                        on requests that     requests that can
                        never answered       finish
  recovery              cold restart, then   no restart. The queue
                        retry storm          drains in 2 s at
                                             5,000 req/s.

  Key point: autoscaling adds supply, backpressure caps demand, and the
  SLO decides when the system must act. Backpressure alone does not add
  throughput. It stops the pile-up that hides a capacity shortfall as a
  tail latency problem.
```
