---
title: "Chaos Engineering"
termSlug: "chaos-engineering"
year: 2026
month: 8
monthName: "August"
day: 31
order: 21
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "Chaos Engineering is the discipline of running controlled, hypothesis-driven experiments that intentionally inject faults (failures, latency, overload, oracles) into a running production system, in..."
---
### Definition:
**Chaos Engineering** is the discipline of running **controlled, hypothesis-driven experiments** that intentionally inject faults (failures, latency, overload, oracles) into a running production system, in order to *discover weaknesses before real incidents do* and build confidence that the system can withstand turbulent conditions.

It's not "randomly breaking stuff for fun." The core idea (from the *Principles of Chaos* manifesto by Netflix engineers, originators of **Chaos Monkey** in 2011): a system's resilience can't be proven by design review alone — you must continuously *verify* it against the actual, messy, distributed behavior of production. Since you can't predict every failure mode, you deliberately trigger a subset of them on purpose, on your own terms, at a time and scale you control.

A proper chaos experiment follows a scientific loop (an extended "hypothesis → test → measure" cycle):

```
  STEADY STATE            HYPOTHESIS                 INJECT FAULT
  (define normal:         (e.g. "if a pod         (e.g. kill 1 of 3
   latency p95 < 200ms,    dies, traffic            replicas / add 300ms
   error rate < 0.1%)      still served")           latency / CPU spike)
        |                       |                        |
        v                       v                        v
  [observe baseline]     [predict the impact]      [run experiment]
                                                          |
                                                          v
                        +----------------------------+  MEASURE
                        |  steady state preserved?   |---------> compare vs baseline
                        |  hypothesis validated?     |
                        +----------------------------+
                              |             |
                            YES            NO
                             |             |
                             v             v
                        CONFIDENCE     FOUND A WEAKNESS
                        (resilient)    -> fix, harden,
                                         re-test (game day)
```

Contrast with the naive "hope it never breaks" approach:

```
   NAIVE (reactive)                    CHAOS ENGINEERING (proactive)
   ---------------------------------   ---------------------------------
   "Don't touch prod."                 "Break prod on purpose, safely."
   Failures happen at 3am,             Failures happen during a
   during a real launch,               scheduled game day, during
   unannounced, full blast.            work hours, in small blast radius.
   => firefight, post-mortem           => incident you chose to run,
   for every outage                     with a hypothesis, in a box
   REACT to surprises                  ANTICIPATE + verify
   low confidence                      high confidence
```

Key principles: (1) **blast radius** — start tiny (one pod, one region, a sample of traffic) and expand gradually; (2) **hypothesis first** — never inject without a predicted steady-state; (3) **automation + observability** — pair faults with metrics, traces, and SLOs so you can measure the impact objectively; (4) **game days** — formal, scheduled practice sessions where teams rehearse incident response.

Pros: surfaces real unknown unknowns, trains on-call muscle memory, hardens redundancy (multiple AZs, retries, fallbacks), converts brittle assumptions into proven behavior, reduces Mean Time To Recovery (MTTR).
Cons: inherently risky in production (must be gated by blast radius + rollback), requires mature observability to be meaningful, can create fatigue if run too often, needs cultural buy-in and dedicated time/tooling (Gremlin, Litmus, Chaos Mesh, chaos-toolkit).

### Example:
A payments platform runs 6 replicas of its checkout service across 3 availability zones (2 per zone). The SRE team writes a hypothesis: *"If one AZ goes down entirely, p95 checkout latency stays under 400ms and error rate stays under 1%."* They run a controlled experiment using a chaos tool that **blocks network traffic to the whole AZ** for 5 minutes while monitoring dashboards.

```
        USERS
          |
          |   requests
          v
   [Load Balancer]
        |   |   |
        |   |   +----------- AZ-B (healthy)
        |   +--------------- AZ-A (healthy)
        +------------------- AZ-C <<< FAULT: network cut injected here >>
                              |
                              x  (no traffic reaches replicas here)
                              x

   WITHOUT the test: AZ-C dies silently at peak hour => surge into A+B,
   latency spikes, retry storms, maybe outage.
   WITH chaos test (now): balancer fails over to A+B, RPS redistributes,
   p95 stays ~320ms, error <0.3%  => hypothesis VALIDATED => confidence++

   Measure & compare:
   baseline p95 280ms  |  during-fault p95 320ms  |  SLO 400ms  => PASS
   baseline err  0.1%  |  during-fault err  0.3%  |  SLO 1.0%   => PASS
```

Because the team *chose* to cut that AZ during a calm window with a rollback ready, they learned exactly how the failover behaves — and discovered one replica didn't drain connections cleanly, which they then fixed. The same failure in a real outage would have been a customer-facing incident; here it was a learning, not a crisis.
