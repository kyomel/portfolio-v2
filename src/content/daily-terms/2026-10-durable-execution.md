---
title: "Durable Execution"
termSlug: "durable-execution"
year: 2026
month: 10
monthName: "October"
day: 22
order: 16
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "A durable execution engine writes every step of a program to an append-only log. When the process dies, the engine starts the program again. The program reads the log on the way up. A step that alr..."
---
### Definition:

A **durable execution** engine writes every step of a program to an append-only log. When the process dies, the engine starts the program again. The program reads the log on the way up. A step that already finished returns its recorded result. A step that never finished runs for the first time.

The whole idea fits in one sentence. The engine persists the execution, not the state.

That sentence separates durable execution from a job queue, from a cron job, and from a hand-written `status` column. A queue persists a message. A status column persists your guess about where the work stopped. A durable engine persists the work itself, one event at a time, in order.

Start with the problem. An ordinary function keeps its progress in three fragile places.

```text
WHERE A NORMAL FUNCTION KEEPS ITS PROGRESS
═══════════════════════════════════════════════════════════════════════════

  ┌────────────────────────────┬──────────────────────────────────────────┐
  │ THE PLACE                  │ WHAT ERASES IT                           │
  ├────────────────────────────┼──────────────────────────────────────────┤
  │ the call stack             │ a crash, a deploy, an OOM kill           │
  │ local variables            │ the same, plus a lost node               │
  │ the local clock            │ a restart. the 30-day sleep is gone.     │
  │ the open socket            │ a load balancer idle timeout             │
  └────────────────────────────┴──────────────────────────────────────────┘

  a 30-day wait needs a process alive for 30 days
  a retry needs the code that owns the retry still running
  a human approval needs someone holding the thread open
```

Durable execution removes the process from the durability path. Two parts do the work. The first part is an **append-only event history**: one row per meaningful thing the workflow does. The second part is a **deterministic replay runtime**: a loop that can rebuild the workflow's memory from that history, at any time, on any worker.

Your business logic stays ordinary code. The runtime intercepts each interaction with the outside world and turns that interaction into an event.

```text
THE SHAPE OF EVERY DURABLE ENGINE — one log, many disposable workers
═══════════════════════════════════════════════════════════════════════════

   client
     │  start(order 4471)
     ▼
  ┌───────────────────────── SERVICE ──────────────────────────┐
  │                                                            │
  │   frontend ──► history service ──► append-only log         │
  │                     │                   │                  │
  │                     │                   │  #1 started      │
  │                     │                   │  #2 activity OK  │
  │                     │                   │  #3 timer set    │
  │                     ▼                   │  #4 timer fired  │
  │               matching service ─────────┘                  │
  │                     │  one task per workflow, at a time    │
  └─────────────────────┼──────────────────────────────────────┘
                        │  poll
          ┌─────────────┴─────────────┐
          ▼                           ▼
     worker A                     worker B
     stateless                    stateless
     runs workflow code           runs the same code
     sends commands               replays instead of calling

  ┌────────────────────────────────────────────────────────────────────┐
  │ the service never runs your code. it stores order and results.     │
  │ workers hold no state, so a dead worker costs one task, not a job. │
  └────────────────────────────────────────────────────────────────────┘
```

Now the hard part, and the part most teams get wrong. The log holds results, not code. So the code must produce the same sequence of requests on every run. The runtime matches a request to its recorded result **by position in the sequence**, not by name or argument. Run the function again and take a different branch, and the runtime hands back the result of a different call. A correct engine refuses to guess. It stops with a non-determinism error.

That rule creates a clean split. Workflow code does orchestration only. Anything that touches the outside world moves into an **activity** (Temporal), a **step** (DBOS, Restate, Cloudflare), or a task (Inngest, Trigger.dev).

```text
WITHOUT VS WITH — one crash, two very different mornings
═══════════════════════════════════════════════════════════════════════════

WITHOUT DURABILITY — progress lives in the process
───────────────────────────────────────────────────────────────────────────

  renew(order 4471)              process memory      outside world
  ────────────────────────────   ─────────────────   ────────────────────
  1  reserve credit   ok         step = 1            quota -1
  2  charge card      ok         step = 2            $49.00 captured
  3  write receipt    ...        ✗ pod is drained    nothing written
                                (rolling deploy, 02:14)

  restart -> renew(order 4471) runs from line 1
  1  reserve credit   ok         step = 1            quota -2     <-- again
  2  charge card      ok         step = 2            -$49.00      <-- again
  3  write receipt    ok

  ┌───────────────────────────────┬───────────────────────────────────┐
  │ WHAT YOU MUST BUILD YOURSELF  │ WHAT BREAKS WHEN YOU FORGET IT    │
  ├───────────────────────────────┼───────────────────────────────────┤
  │ a status column + state enum  │ double charge, double quota       │
  │ a resume switch per step      │ one missed branch = a redo        │
  │ a sweeper for stuck rows      │ stuck row sits for weeks, no owner│
  │ an idempotency key per call   │ a retry hits the API twice        │
  └───────────────────────────────┴───────────────────────────────────┘

WITH DURABLE EXECUTION — progress lives in the log
───────────────────────────────────────────────────────────────────────────

  02:14:01  worker A   step 1  reserve_credit   -> event #2 completed
  02:14:03  worker A   step 2  charge_card      -> event #4 completed
  02:14:03  worker A   step 3  write_receipt    -> command sent
  02:14:04  worker A   ✗ killed before event #5 is written

  02:14:05  worker B   claims the task, reads the history from #1
  02:14:05            step 1  history has it  -> return quota hold, no call
  02:14:05            step 2  history has it  -> return charge id, no call
  02:14:05            step 3  no record        -> run it now

  ┌────────────────────────────┬─────────────────────────────────────────┐
  │ SAME CODE, SECOND RUN      │ WHAT THE RUNTIME DOES                   │
  ├────────────────────────────┼─────────────────────────────────────────┤
  │ reserve_credit(...)        │ replay. nothing leaves the worker       │
  │ charge_card(...)           │ replay. nothing leaves the worker       │
  │ write_receipt(...)         │ first real execution of this step       │
  └────────────────────────────┴─────────────────────────────────────────┘

  the function ran twice. the card was charged once.
```

Read that last line again, because it is the entire product. The engine may run your function many times. Each side effect lands once, because its result is memoized in the log.

The determinism rule is narrow in theory and easy to break in practice. Four ordinary lines of code break it.

```text
FOUR LINES THAT BREAK REPLAY — and the substitute each engine gives you
═══════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────────┬──────────────────────┬────────────────┐
  │ FORBIDDEN IN WORKFLOW CODE   │ WHY                  │ USE INSTEAD    │
  ├──────────────────────────────┼──────────────────────┼────────────────┤
  │ time.time(), Date.now()      │ replay reads a new   │ workflow.now() │
  │                              │ clock, takes a new   │ engine clock   │
  │                              │ branch               │                │
  │ random(), uuid4()            │ a second value on    │ side_effect(), │
  │                              │ replay               │ seeded id from │
  │                              │                      │ the run id     │
  │ requests.post in the body    │ the call runs twice, │ activity /     │
  │                              │ once per attempt     │ step, journaled│
  │ env var read in the body     │ the value changed on │ pass it in as  │
  │                              │ the new pod          │ a workflow arg │
  │ for k in set_of_ids          │ iteration order is   │ sorted(ids)    │
  │                              │ not stable           │                │
  └──────────────────────────────┴──────────────────────┴────────────────┘

  rule of thumb: if two runs of the same code can disagree,
  the value comes from the log, not from the machine.
```

Every engine in 2026 uses this shape. They differ in where the log lives and what you must operate, and that difference decides adoption more than any benchmark.

```text
WHERE THE LOG LIVES — and what the log costs
═══════════════════════════════════════════════════════════════════════════

  ┌──────────────┬───────────────────────┬──────────────────┬─────────────┐
  │ ENGINE       │ LOG LIVES IN          │ YOU OPERATE      │ HISTORY CAP │
  ├──────────────┼───────────────────────┼──────────────────┼─────────────┤
  │ Temporal     │ its own cluster,      │ worker fleet +   │ 51,200      │
  │              │ Cassandra/PG/MySQL    │ service + DB     │ events or   │
  │              │                       │                  │ 50 MB       │
  │ Restate      │ one binary, embedded  │ one process      │ journal per │
  │              │ RocksDB journal       │                  │ invocation  │
  │ DBOS         │ your Postgres, in the │ Postgres you     │ your tables │
  │              │ same transaction      │ already run      │             │
  │ Inngest /    │ engine side, steps    │ nothing, or a    │ per-step    │
  │ Upstash      │ arrive by HTTP        │ self-host server │ quota       │
  │ Step         │ AWS managed state     │ nothing          │ 25,000      │
  │ Functions    │ machine               │                  │ events      │
  └──────────────┴───────────────────────┴──────────────────┴─────────────┘

  payload per step: Temporal 2 MB, Step Functions 256 KiB.
  exceed the cap and the run fails at the step, not at deploy.
```

A log that only grows needs a way to start fresh. Temporal calls it **Continue-As-New**: the run closes at a clean boundary and a new run starts with the same workflow ID and a small input. The history resets to event #1. Workflows that loop for years use this on a timer or a step count. Skip it, and the run dies at 50 MB with a failure that looks like a bug in your code.

Then the trap that survives every engine: **exactly-once is a property of the log, not of the world.** The engine guarantees the recorded result applies once. It cannot guarantee that your outbound `POST /charge` reached the provider exactly once. A crash between "provider charged the card" and "result written to history" makes the retry fire the charge again. So every outbound call still needs an idempotency key derived from the workflow ID.

Two smaller limits bite in production.

- **Workflow code is not ordinary code.** Reordering steps, adding a step in the middle, or changing a timer breaks replay for every run that is already in flight. Temporal answers with `GetVersion` patches and worker versioning. Ship a control-flow change with neither, and old runs fail with a non-determinism error that looks random.
- **A replay is not free.** Rebuilding a long history costs CPU, and a hot workflow replayed 200 times a day costs 200 rebuilds. Keep workflow bodies thin, keep loops bounded, and push bulk work into one activity.

### Example:

**A renewal charge that must survive a rolling deploy, and must not charge twice.**

The billing team runs `renew_subscription`. One execution does five things: reserve credit, charge the card, wait for the settlement webhook, issue a receipt, and notify the customer. The settlement wait is 72 hours. A pod cannot hold a thread for 72 hours, and a deploy arrives every Tuesday.

```text
ONE EXECUTION, ONE TIMELINE — the log is the only thing that survives
═══════════════════════════════════════════════════════════════════════════

  wall clock   worker A              history (durable)        outside world
  ──────────   ───────────────────   ──────────────────────   ─────────────
  02:13:58     claim task            #1 started  run=r-4471   -
  02:13:58     reserve_credit        #2 activity scheduled    quota hold
  02:13:59     reserved              #3 activity completed    hold = h-91
  02:14:00     charge_card           #4 activity scheduled    -
  02:14:02     charged               #5 activity completed    $49.00
  02:14:02     timer 72 h            #6 timer started         -
  02:14:02     worker exits. the pod is drained for a deploy.
               ─────────────── 71 h 59 m of nothing ───────────────
  02:16:10     (72 h later)          #7 timer fired           webhook in
  (3 days)     worker B claims       replay #1..#6            -
  02:16:10     reserve_credit        returned from #3         no call
  02:16:10     charge_card           returned from #5         no call
  02:16:11     issue_receipt         #8 completed             PDF written
  02:16:11     notify                #9 completed             mail sent

  ┌─────────────────────────────────────────────────────────────────────┐
  │ 3 days of downtime, 1 charge, 1 receipt, 0 sweeper scripts.         │
  │ the sleep cost no compute. worker B started after the timer fired.  │
  └─────────────────────────────────────────────────────────────────────┘
```

The workflow body stays small, because every side effect sits behind an activity.

```python
@workflow.defn
class RenewSubscription:
    @workflow.run
    async def run(self, req: RenewRequest) -> str:
        hold = await workflow.execute_activity(
            reserve_credit, req.account_id,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RETRY,                 # 5 tries, backoff
        )

        try:
            charge = await workflow.execute_activity(
                charge_card, Charge(req.account_id, req.amount_cents, hold),
                start_to_close_timeout=timedelta(seconds=60),
                retry_policy=RETRY,
                # the key is derived from the run, so a retry cannot
                # take the money twice at the provider
                heartbeat_timeout=timedelta(seconds=20),
            )
        except ActivityError:
            await workflow.execute_activity(release_credit, hold, ...)
            raise

        # durable timer: no process waits, the log waits
        settled = await workflow.wait_condition(
            lambda: self.settlement is not None,
            timeout=timedelta(hours=72),
        )
        if not settled:
            await workflow.execute_activity(open_dispute, charge.id, ...)
            return "disputed"

        await workflow.execute_activity(issue_receipt, charge, ...)
        await workflow.execute_activity(notify_customer, req.account_id, ...)
        return charge.id

    @workflow.signal
    def settlement(self, payload: dict) -> None:
        self.settlement = payload              # an event in the log
```

The same flow without the engine shows what the log replaces. This is the version most teams ship first, and it looks correct.

```text
THE HAND-ROLLED VERSION — 40 lines, one window, one double charge
═══════════════════════════════════════════════════════════════════════════

  def renew(order):
      row = db.get(order.id)                  # row.status = "reserved"
      if row.status == "reserved":
          charge = gateway.charge(order)      # <- money leaves here
          db.set(order.id, status="charged")  # <- crash lands here
      ...

  ┌───────────────────────┬─────────────────────────────────────────────┐
  │ MOMENT                │ STATE AFTER THE CRASH                       │
  ├───────────────────────┼─────────────────────────────────────────────┤
  │ crash before charge   │ status "reserved", no money taken           │
  │                       │ retry charges once. correct.                │
  │ crash after charge,   │ status "reserved", money already taken      │
  │ before the set        │ retry charges again. customer pays twice.   │
  └───────────────────────┴─────────────────────────────────────────────┘

  the window is 4 ms wide. the deploy happens every Tuesday.
  at 90,000 renewals a week, the window is hit roughly 30 times.
  the support ticket says "charged twice", and the code looks fine.
```

The gap is not a bug in the code. It is a missing transaction between two systems: the payment provider and your database. A durable engine does not close that gap either. It shrinks it to one step and gives the retry a stable identity, so the provider can reject the second attempt by key.

The punchline: durable execution does not make code reliable. It moves the durability boundary from the lines you remembered to write, to every interaction the runtime intercepts. You still owe the engine two things. Keep the workflow body deterministic. Make every outbound call idempotent. Give it those, and a crash becomes a replay instead of an incident.
