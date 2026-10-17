---
title: "Serverless Cold Start"
termSlug: "serverless-cold-start"
year: 2026
month: 9
monthName: "September"
day: 3
order: 3
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Serverless Cold Start is the latency penalty a serverless platform pays — and your users feel — when it must create and initialize a brand-new execution environment (sandbox, runtime, and your code..."
---
### Definition:

Serverless Cold Start is the latency penalty a serverless platform pays — and your users feel — when it must **create and initialize a brand-new execution environment** (sandbox, runtime, and your code) before it can run a function that was just invoked. A *warm* request finds an environment that is already alive and skips straight to running the handler; a *cold* request has to build the whole thing from zero first.

The important framing: a cold start is **not a bug — it is the deliberate price of scale-to-zero economics**. Because the platform reclaims idle environments after minutes of silence, you pay exactly nothing while your function sits unused. The first request after that silence is the one that pays the full setup bill. Latency and the pay-per-use billing model are two sides of the same coin: the platform can only charge you for what actually runs if it is free to destroy what isn't running.

That also tells you the three triggers — every cold start is one of these:
1. **Idle reclamation** — environment killed after N minutes without traffic; the next request rebuilds it.
2. **A fresh deploy** — a new code version means new environments, so releases can trigger a burst of cold starts.
3. **Scale-out (the sneaky one)** — N concurrent requests arrive but only M < N environments are warm; the extra N−M cold-start *all at the same time*, in the middle of your busiest moment — precisely when extra latency hurts the most.

COLD vs WARM — what actually happens on each path:

```
COLD START vs WARM START
════════════════════════════════════════════════════════════

  COLD START — no environment ready, request pays full setup:

   request ──► ┌───────────────────────────────────────────────┐
               │  1. ALLOCATE a sandbox (micro-VM / container) │  50–100 ms
               │  2. DOWNLOAD your deployment package          │  50–500 ms
               │     (grows with bundle size!)                 │
               │  3. BOOT the language runtime                 │  50–1,000 ms
               │     (interpreter fast, JVM/.NET slow)         │
               │  4. RUN YOUR init code                        │  0 ms – seconds
               │     imports, SDK clients, DB connections      │  ◄── your lever
               │  5. INVOKE the handler ────────────────► done │
               └───────────────────────────────────────────────┘
                 total added latency: ~100 ms to several seconds
                 THE USER WAITS FOR ALL OF IT BEFORE THE
                 FIRST BYTE OF ACTUAL WORK HAPPENS.

  WARM START — environment kept alive, same request later:

   request ──► ┌────────────────────────────────┐
               │  thaw (~1–10 ms)               │
               │  step 4 results (DB pool, SDK  │
               │  clients) are STILL ALIVE      │
               │  5. INVOKE handler ────► done  │   single-digit ms
               └────────────────────────────────┘
                 init code runs ONCE per env,
                 then is reused across requests
```

How bad is it, honestly? It depends mostly on runtime and bundle size. Interpreted runtimes (JavaScript, Python) typically cold-start in **200–400 ms**; compiled ones (Go, Rust) can stay under ~100–300 ms; VM-based runtimes (JVM, .NET) take **500 ms to several seconds** — which is why snapshot-restore features (freeze a booted runtime, restore it in milliseconds instead of re-booting) exist and cut that figure dramatically. And *frequency* is the half of the story most explainers skip: steady production traffic sees cold starts on under 1% of invocations — but a function invoked once per hour cold-starts almost every single call, and development environments can see cold rates of 30–90%. Tail latencies (p99) run 2–3× the median, which is exactly what your latency budget actually cares about.

Because every cold start is a small bill in *time*, teams climb a **mitigation ladder** — cheapest first:

```
THE MITIGATION LADDER (cost order)
══════════════════════════════════
  FREE (code-level)      shrink the deployment bundle & prune
                         dependencies  ← biggest lever most teams
                         never pull; lazy-load heavy imports;
                         open DB connections in init scope so
                         warm requests reuse them
  CHEAP (config)         raise memory (CPU scales with it);
                         enable snapshot-restore / fast-snapshot
                         features where the platform offers them
  FRAGILE (folk remedy)  keep-warm "ping" every few minutes —
                         keeps ONE environment warm, does nothing
                         on scale-out, and lies to dashboards
  PAID (definitive)      provisioned concurrency / minimum
                         instances: N environments always ready,
                         cold starts eliminated up to N — but you
                         reintroduce always-on cost into a
                         pay-per-use model (the irony is priced in)
  ARCHITECTURAL          isolate-based edge runtimes (V8 isolates:
                         single-digit ms to spawn) trade a full
                         runtime for a sandboxed web-standard env
```

The whole discipline boils down to one question: **is a human waiting on this call?** If yes, cold starts are a UX bug and deserve the ladder. If the work is async — a queued job, a webhook, a scheduled task — the tail is absorbed invisibly and you should spend nothing on it.

### Example:

A ticketing platform ("TiketKilat") runs a flash sale at 15:00 sharp. The checkout function is serverless, pay-per-use — and had zero traffic for the 30 minutes before the sale, so the platform reclaimed every idle environment.

```
FLASH SALE — ONE ENDPOINT, THREE MOMENTS
════════════════════════════════════════════════════════════

  14:30–15:00  no traffic → platform reclaims ALL environments

  ┌─ 15:00:00.000  request #1 arrives ── COLD ─────────────────┐
  │  allocate sandbox → download package → boot runtime →      │
  │  init SDKs + DB pool → finally run handler                 │
  └────────────────────────────────────────────────────────────┘
              user #1 waits 1.3 s (spinner, rage, refresh)

  ┌─ 15:00:00.300  requests #2–#10 arrive — THE SPIKE ────────┐
  │  env #1 is warm now BUT handles one request at a time     │
  │  → #2–#10 each need their OWN environment                 │
  │  → 9 MORE cold starts, all simultaneous                   │
  │    ◄── scale-out: cold starts land exactly when           │
  │        traffic is highest (worst possible timing)         │
  └───────────────────────────────────────────────────────────┘
              first 30 s of the sale: p99 ≈ 1.4 s
              (users abandon carts, sale page trends on X
               for the wrong reason)

  ┌─ 15:00:45  autoscaler finally has 40 warm envs ──────────┐
  │  requests #200+ ── WARM ── 30–50 ms each                 │
  └──────────────────────────────────────────────────────────┘
              p99 five minutes later: ~45 ms — smooth,
              but the first 30 seconds already happened
```

The fix is a direct application of the ladder. TiketKilat *knows* the sale is at 15:00 — that's not a surprise, it's a schedule. So before launch day they:

- **Schedule-based provisioned concurrency**: warm 30 environments at 14:59:30 so the first wave of requests lands on ready envs (predictable traffic → pre-warm ahead of the peak instead of reacting to it).
- **Slim the bundle**: the checkout function was importing a whole SDK for one call — tree-shaken down from 41 MB to 6 MB, shaving hundreds of ms off the unavoidable cold starts.
- **Move the non-blocking work off the hot path**: the confirmation email is pushed to a queue and processed by a separate function where a 1-second cold start is invisible — nobody is staring at it.

```
WITH THE FIX — same flash sale, same spike:
═══════════════════════════════════════════
  14:59:30  provisioned envs spin up (N = 30) ── paid, ready
  15:00:00  request #1 ──► WARM env ──► 45 ms      ✓ no spinner
  15:00:00  requests #2–#100 ──► scale-out absorbs on warm pool
  15:00:05  a few cold starts only if traffic exceeds N
            (rare, and ~300 ms now, not 1.4 s)
```

The punchline: serverless never removes latency — it *relocates* it from idle time to the first request after idle. Cold starts can't be eliminated for free; they can only be (a) shrunk with leaner code, (b) skipped on the paths where a human waits, and (c) paid away with always-warm capacity exactly where the spike is predictable. The engineering skill is knowing which of the three applies per endpoint — and never trusting a keep-warm ping to save you.
