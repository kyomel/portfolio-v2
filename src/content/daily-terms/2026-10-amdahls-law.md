---
title: "Amdahl's Law"
termSlug: "amdahls-law"
year: 2026
month: 10
monthName: "October"
day: 13
order: 9
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Amdahl's Law predicts the speedup of one fixed task when you add workers to it. The law holds one idea: the part of the task that cannot run in parallel sets the ceiling for the whole task."
---
### Definition:

**Amdahl's Law** predicts the speedup of one fixed task when you add workers to it. The law holds one idea: the part of the task that cannot run in parallel sets the ceiling for the whole task.

Gene Amdahl published the argument in 1967. He used it against a plan for a very large parallel machine. His point was simple. If one section of 10% is serial, the fleet caps out at 10x, no matter how many processors you buy. The hardware changed. The arithmetic did not.

The formula uses four symbols:

```
  S(N) = 1 / ((1 - p) + p / N)

  N     = number of workers
  p     = fraction of the work time that CAN run in parallel
  (1-p) = fraction of the work time that CANNOT run in parallel (serial fraction)
  S(N)  = speedup against one worker
```

Two results come out of the formula. Both matter more than the number itself.

- **The ceiling.** Let N go to infinity. Then p/N goes to zero, and S = 1 / (1 - p). The serial fraction alone decides the maximum speedup. With p = 0.85 the ceiling is 6.7x. With p = 0.95 the ceiling is 20x. No budget removes this limit.
- **The half-way point.** You reach half of the ceiling at N = p / (1 - p). For p = 0.85 that is about 6 workers. The next 90 workers add less speed than the first 6. This is the shape of diminishing returns, and it is why "double the pods" stops working.

The naive plan and the law disagree about the shape of scale. The naive plan assumes the work splits evenly at every N. The law moves one block out of the split. That block stays whole.

```
SAME TASK, MORE WORKERS — NAIVE EXPECTATION vs AMDAHL
════════════════════════════════════════════════════════════════════════
 legend:  ▓ = serial part (never splits)   ░ = parallel part (splits)
          one character ≈ 10 s of wall time, in both views

 NAIVE  (assumes 100% splits)            AMDAHL  (p = 0.85, 15% serial)
 ────────────────────────────────        ────────────────────────────────
 N = 1  ░░░░░░░░░░░░░░░░░░░░   200 s      N = 1  ▓▓▓░░░░░░░░░░░░░░░░░   200 s
 N = 2  ░░░░░░░░░░             100 s      N = 2  ▓▓▓░░░░░░░               115 s
 N = 4  ░░░░░                   50 s      N = 4  ▓▓▓░░░░                   73 s
 N = 8  ░░░                     25 s      N = 8  ▓▓▓░░                     51 s
 N = 16 ░                       13 s      N = 16 ▓▓▓░                      41 s
 N = ∞  the whole bar goes away   0 s     N = ∞  ▓▓▓                       30 s
                                                └─ the wall: 200 / 30 = 6.7x

 cost of the mistake, at N = 8: you pay 8x the money and get 3.9x the speed.
```

The ceiling table makes the arithmetic blunt:

```
 CEILING OF THE SERIAL FRACTION (speedup at large N)
════════════════════════════════════════════════════════════════════════
 serial (1-p)   parallel p    N = 8     N = 64     N = ∞     half ceiling at
 ───────────────────────────────────────────────────────────────────────
      50%           50%       1.78x      1.97x       2.0x     N = 1
      25%           75%       2.91x      3.82x       4.0x     N = 3
      10%           90%       4.71x      8.77x      10.0x     N = 9
       5%           95%       5.93x     15.42x      20.0x     N = 19
       1%           99%       7.48x     39.26x     100.0x     N = 99
 ───────────────────────────────────────────────────────────────────────
 Read the "N = ∞" column first. A serial section of 10% turns a
 "scales forever" system into a 10x system.
```

**Amdahl assumes a fixed problem size.** This assumption is called strong scaling. A second law answers the other question.

```
AMDAHL vs GUSTAFSON — TWO QUESTIONS, TWO ANSWERS
═══════════════════════════════════════════════════════════════════════════
                         AMDAHL                  GUSTAFSON
 question asked      how fast does THIS job    how big a job fits in
                     finish?                   the SAME time?
 problem size        fixed                     grows with N
 speedup             S = 1 / ((1-p) + p/N)     S = N + (1-N)(1-p)
 shape over N        flattens, hits a wall     straight line, slope p
 ceiling             1 / (1-p)                 none from the serial part
 correct use case    backfill, batch job,      training run, simulation,
                     request on the hot path   larger model, bigger batch
 ─────────────────────────────────────────────────────────────────────────
 Both laws are correct. They measure different things. A team that
 quotes the wrong one buys hardware for a shape of work it does not have.
```

**Where the serial fraction hides.** The law is easy to write and hard to apply, because (1-p) does not announce itself. In a modern stack it sits in small, boring places:

```
WHERE (1 - p) HIDES IN A 2026 SERVICE STACK
═════════════════════════════════════════════════════════════════════════
  one request step
  ───────────────────────────────────────────────────────────────────────
   [ tokenize + schedule ]     one CPU thread, every step
   [ all-reduce barrier ]      every GPU waits for the slowest GPU
   [ top-k sampling ]          runs after the last matmul, on one rank
   [ KV-cache eviction ]       one shared HBM budget, one decision
   [ single-writer commit ]    one row lock, one writer per key
   [ leader election ]         one leader serves the ordered log
   [ final merge / sort ]      one reducer joins the parts
                    │
                    └── none of these shrink when a worker joins.
                        the workers only wait on it longer.
```

Amdahl also keeps the serial fraction constant. Real systems do not. Coordination cost grows with N (chatty protocols, cache coherence, lock contention, garbage collection pauses). That extra term is the **Universal Scalability Law** (USL). It predicts something Amdahl never does: a peak, and then a fall.

```
AMDAHL FLATTENS — USL PEAKS AND FALLS
══════════════════════════════════════════════════════════════════════════
  speedup
       │
   8x  │                  ╭───────────────────  Amdahl: flat wall at 1/(1-p)
       │               ╭──╯
   6x  │            ╭──╯
       │         ╭──╯█████╮
   4x  │      ╭──╯██████████╮
       │   ╭──╯████████████████╮
   2x  │ ╭─╯█████               ╰────────────  real system (USL): peak, then
       │ ███                                   worse with more workers
   1x  │█
       └────────────────────────────────────────▶ workers N
         serial + contention → peak → retrograde
```

**What to do with the law.**

1. Profile one worker first. Find every block that uses one thread, one lock, or one connection. That set is (1-p).
2. Compute the ceiling, 1 / (1 - p), before you size the fleet. If the ceiling is 5x, do not budget for 40x.
3. Attack the serial section before you add a worker. It is usually the cheapest win in the whole job.
4. Audit the parallel part for a shared resource. One connection pool, one lock, one disk bandwidth, and one leader all behave like serial code.
5. If the workload can grow, switch to weak scaling. A larger batch raises p. Fighting (1-p) at a fixed size just burns money.

**The honest boundary of the model.** Amdahl's Law ignores memory bandwidth, queueing delay, and hardware cost. It is a model, not a measurement. Use it to choose the fleet size and to pick the next optimization. Do not read it as a promise.

### Example:

**A backfill job that stops scaling at 4x.**

A media team runs `content-indexer`. The job backfills embeddings for 12,000 documents. The team wants the job to finish before the morning report. So the team plans to scale from 1 worker to 8 workers.

First, the profile on one worker. The profile is the input to the law:

```
PROFILE ON ONE WORKER (N = 1)
═══════════════════════════════════════════════════════════════════════
   30 s   SERIAL     read the work manifest once
                     validate one API token for the whole run
                     write results as 12,000 single-row commits
  170 s   PARALLEL   call the embedding model, write the vector
  ─────────────────────────────────────────────────────────────────────
  200 s   total      p = 170 / 200 = 0.85      (1-p) = 0.15
                     ceiling = 1 / 0.15 = 6.67x
```

Then the scale-out plan runs against the law:

```
SCALE-OUT PLAN vs WHAT THE LAW PAYS OUT
═══════════════════════════════════════════════════════════════════════════
 WORKERS   WALL TIME   SPEEDUP   EFFICIENCY   COST      COST PER 1x SPEEDUP
 ───────────────────────────────────────────────────────────────────────────
    1       200.0 s     1.00x      100%        $120          $120
    2       115.0 s     1.74x       87%        $240          $138
    4        72.5 s     2.76x       69%        $480          $174
    8        51.3 s     3.90x       49%        $960          $246
   16        40.6 s     4.92x       31%       $1,920         $390
   ∞         30.0 s     6.67x        —           ∞             ∞
 ───────────────────────────────────────────────────────────────────────────
 efficiency = speedup / workers.  At N = 8 exactly half of the paid
 compute sits idle and waits on the serial section.
```

The team does not buy 16 workers. The team fixes the serial section instead.

```
THE FIX — SHRINK (1-p), DO NOT ADD WORKERS
═══════════════════════════════════════════════════════════════════════════
   before   30 s serial    read the manifest per worker, commit row by row
   after     6 s serial    load the manifest once from shared storage,
                           use one bulk insert of 1,000 rows per batch
   ───────────────────────────────────────────────────────────────────────
   serial fraction 0.15 → 0.03          ceiling 6.67x → 33.3x

 WORKERS   WALL TIME   SPEEDUP   EFFICIENCY
 ─────────────────────────────────────────────
    8        27.3 s     7.34x       92%
   16        16.6 s    12.03x       75%
   ∞         6.0 s    33.33x         —
```

The fix beats the extra fleet. Eight fixed workers finish in 27.3 s. Sixteen unfixed workers finish in 40.6 s. The same fleet does more work with a smaller serial section, and the monthly bill stays at $960.

**The same law inside LLM serving (2026).**

Tensor parallelism splits each layer of a model across GPUs. The forward pass scales well. The rest of the step does not.

```
TENSOR PARALLELISM — THE PART THAT DOES NOT SPLIT
═══════════════════════════════════════════════════════════════════════════
  TP = 4   [ matmul ████████████████ ]────────  all 4 GPUs busy
  TP = 8   [ matmul ████████ ]───┐
                                 ├── schedule, sampling and I/O run
           [ non-scalable work ]──┘   once per step, on every rank
  ─────────────────────────────────────────────────────────────────────────
  2026 measurement (vLLM, Llama-3.1-70B): throughput at TP = 8 is 21%
  BELOW two times the throughput at TP = 4.
  The extra 4 GPUs pay for communication and coordination, not for speed.
```

One 2026 system, **Albireo**, attacks the serial term instead of the parallel term. It overlaps scheduling and I/O with compute. It also parallelizes sampling across GPUs. The paper reports up to 1.9x higher throughput, 48% lower latency, and 28% higher GPU utilization than vLLM. The useful TP degree rises from 2 to 4 for moderate models and from 4 to 8 for large models.

That is the same lesson as the backfill job. Raise p. Do not raise N.

One honest note about this case. LLM decode is memory-bound. More GPUs also add memory for the KV cache, and that gain sits outside the speedup formula. The paper says so itself: the best TP degree is a balance, not a pure serial-fraction result. Amdahl's Law still explains the shape of the curve. It just does not explain every term in it.
