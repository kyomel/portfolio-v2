---
title: "Pod Disruption Budget (PDB)"
termSlug: "pod-disruption-budget-pdb"
year: 2026
month: 10
monthName: "October"
day: 30
order: 22
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "A Pod Disruption Budget is a Kubernetes object that caps how many pods of one application may go down at the same time because someone asked them to. It does not stop a crash. It does not stop a no..."
---
### Definition:

**A Pod Disruption Budget** is a Kubernetes object that caps how many pods of one
application may go down at the same time **because someone asked them to**. It does
not stop a crash. It does not stop a node from failing. It gates only the *voluntary*
case: the drain, the upgrade, the descheduler, the autoscaler. Every one of those tools
asks the Eviction API before it removes a pod. The PDB is the object that API consults.
When the budget is full, the API answers `429 Too Many Requests` and the tool retries
later.

So the PDB is a **rate limiter on disruption**, not a guarantee of uptime. That one
sentence explains most of the confusion around it.

```text
TWO KINDS OF DISRUPTION — ONLY ONE IS NEGOTIABLE
══════════════════════════════════════════════════════════════════════

  INVOLUNTARY                        VOLUNTARY
  ─────────────────────────────      ─────────────────────────────────
  kernel panic                       kubectl drain
  node hardware death                cluster upgrade (node by node)
  cloud VM vanished                  descheduler moving a pod
  OOM kill / node pressure           vertical autoscaler resize
  network partition                  cluster autoscaler scale-down
                                     spot rebalance / reclaim

  PDB: no effect                     PDB: this is the gate
  (nothing asks permission)          (the caller must use Eviction API)

  ──────────────────────────────────────────────────────────────────
  A PDB cannot save you from a dead node.
  A PDB can stop a maintenance script from killing 8 pods at once.
```

**The object has three parts.** A label selector. And exactly one of `minAvailable` or
`maxUnavailable`. Nothing else is required. `apiVersion: policy/v1`, and the feature is
stable since v1.21.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: checkout-api
spec:
  maxUnavailable: 2            # or minAvailable: 10 — never both
  selector:
    matchLabels:
      app: checkout-api
  unhealthyPodEvictionPolicy: AlwaysAllow   # optional, see below
```

**The controller does one subtraction.** It reads `spec.replicas` from the owning
workload, counts pods with `Ready=True`, and publishes three numbers in the status.
Everything else in this topic follows from that subtraction.

```text
status:
  expectedPods:     12     <- from the owner's spec.replicas
  currentHealthy:   12     <- pods with Ready=True right now
  desiredHealthy:   10     <- the floor the budget sets
  disruptionsAllowed: 2    <- currentHealthy - desiredHealthy, never < 0

evict(pod)
  pdb   <- every PDB whose selector matches pod
  for each pdb
    if pdb.status.disruptionsAllowed == 0
      return 429                    # caller retries later
  delete pod gracefully             # after all budgets agree
  return 201
```

Two rules hide in that loop. A pod covered by **several** PDBs must satisfy all of
them. And an **empty** selector `{}` matches every pod in the namespace — a typo that
turns one app's budget into a cluster-wide brake.

```text
WITHOUT A PDB                        WITH maxUnavailable: 2
══════════════════════════════════════════════════════════════════════

  node-7  ┌──────────────┐            node-7  ┌──────────────┐
          │ api-1  api-2 │                    │ api-1  api-2 │
          │ api-3  api-4 │                    │ api-3  api-4 │
          └──────┬───────┘                    └──────┬───────┘
                 │ drain                             │ drain
                 ▼                                   ▼
    DELETE ×4 in one pass               EVICT api-1  -> 201  (down: 1)
    all 4 replicas gone                 EVICT api-2  -> 201  (down: 2)
    at t+0s                             EVICT api-3  -> 429  wait
    service up at t+180s                EVICT api-4  -> 429  wait
                                        api-1 Ready at t+35s
    capacity floor: 0%                  EVICT api-3  -> 201  (down: 2)
    users see errors                    ...
                                        capacity floor: 10 of 12 = 83%
                                        users see nothing
```

**Percentages round up — in both directions.** This surprises people, and the code is
deliberate about it.

- `minAvailable: "50%"` with 7 pods → floor is `ceil(3.5)` = **4** pods. Safer than the
  number suggests.
- `maxUnavailable: "25%"` with 3 pods → `ceil(0.75)` = **1** pod may go. Also safer.
- `maxUnavailable: "25%"` with 7 pods → `ceil(1.75)` = **2** pods may go. That is 28.6%,
  more than the 25% you wrote. The docs say this plainly: a disruption can exceed the
  percentage you set.

So a percentage is not a precise promise. An integer is. On small replica counts the
rounding error is large, and that is where the surprise lands.

```text
DISRUPTIONS ALLOWED — minAvailable, computed with ceil
──────────────────────────────────────────────────────────────────
  minAvailable   3 pods   5 pods   6 pods   10 pods
  ────────────────────────────────────────────────────────────
  50%               1        2        3         5
  67%               0        1        1         3
  80%               0        1        1         2
  90%               0        0        0         1
  100%              0        0        0         0     <- freeze
```

Read the 67% column. An operator copies `minAvailable: 67%` (quorum of 3) onto a
3-replica service and gets **zero** allowed disruptions. The number looks right. The
budget is a wall.

**maxUnavailable scales, minAvailable does not.** This is the reason the docs recommend
`maxUnavailable`. Suppose traffic doubles and you scale 12 → 40 replicas.

```text
SAME PDB, TWO SIZES — capacity floor during a drain
──────────────────────────────────────────────────────────────────
  replicas  minAvailable: 10        maxUnavailable: 2
  ────────────────────────────────────────────────────────────────
      12    10/12 = 83%  (2 out)     10/12 = 83%  (2 out)
      40    10/40 = 25%  (30 out!)   38/40 = 95%  (2 out)

  minAvailable pins a number. The larger the app, the more of it
  a single drain can remove. maxUnavailable pins a fraction of loss.
```

**A full budget blocks the work forever.** This is the failure mode that pages people
at 2 a.m. `kubectl drain` retries the eviction until it succeeds. If the budget never
opens, the drain never finishes. The node stays cordoned. The upgrade loop stops.

Three ways to build that wall by accident:

```text
THE ZERO-BUDGET DEADLOCK
══════════════════════════════════════════════════════════════════════

  1. SINGLE REPLICA + minAvailable: 1
     replicas 1, desiredHealthy 1, currentHealthy 1
     disruptionsAllowed = 0        -> 429 for every pod, forever

  2. minAvailable: 100%  (or maxUnavailable: 0)
     no room by definition         -> 429 forever
     (valid intent for "never touch this", fatal default for everyone)

  3. CRASHLOOP POD + default policy
     pod not Ready -> counts against budget -> app already under floor
     IfHealthyBudget refuses it     -> drain waits on a pod that
                                       will never become healthy

  symptom in all three cases:
    kubectl drain node-84 ...
    error: cannot evict pod as it would violate the pod's disruption budget
    ... repeated every 5s, no timeout, node cordoned for hours
```

Case 3 has a real switch. `unhealthyPodEvictionPolicy` arrived in v1.26 and is stable
from v1.31.

- `IfHealthyBudget` (default) — a running-but-unready pod may be evicted only when the
  app is at or above its floor. It protects a recovering app. It also lets one
  `CrashLoopBackOff` pod pin a node forever.
- `AlwaysAllow` — an unready pod may always be evicted. Node drains stay unblocked.
  Cost: a pod that is still starting may get removed before it becomes healthy.

Pods in `Pending`, `Succeeded`, or `Failed` are always evictable, whatever the policy.

**What a PDB does not do.** Five limits, each one a real production surprise:

1. **Rolling updates ignore it.** A Deployment rollout is limited by
   `maxUnavailable`/`maxSurge` in the Deployment, not by the PDB. The two objects do not
   talk. A tight PDB plus a loose rollout still drops half your pods.
2. **It cannot make pods spread.** With 3 replicas on one node, the PDB allows one
   eviction at a time, and then the replacement pod may land anywhere — including back
   on a full cluster as `Pending`. `currentHealthy` drops, the budget closes, and the
   drain waits. Spreading is a job for topology spread constraints or anti-affinity.
3. **It is not capacity-aware.** A budget that allows 2 evictions assumes the cluster
   has room for 2 replacement pods. On a full cluster the replacements queue, and the
   "safe" number becomes downtime.
4. **It does not survive a direct DELETE.** Anything that calls `DELETE
   /api/v1/namespaces/x/pods/y` skips the check. `kubectl delete pod`,
   `kubectl drain --disable-eviction`, and many naive scripts do exactly that. A PDB
   only binds callers that use the Eviction subresource.
5. **It does not cover involuntary loss.** Hardware does not ask permission.

The practical rule: `maxUnavailable: 1` for stateless services, `minAvailable: <quorum>`
for consensus systems, and no PDB at all for Jobs and single-replica internal tools —
unless you accept that their nodes cannot be drained.

### Example:

A payments team runs a 120-node cluster across 3 zones. Twice a quarter they upgrade
Kubernetes: drain one node, wait for the kubelet and workloads to settle, uncordon,
move on. The `checkout-api` Deployment has 12 replicas, spread 4 per zone. Peak traffic
uses about 70% of that capacity. Readiness takes about 35 s for a new pod. The SLO is
99.95% of requests under 400 ms, which leaves roughly 22 minutes of full error budget
per month.

Their first PDB was `minAvailable: "90%"`. Twelve replicas × 90% → `desiredHealthy = 11`
→ `disruptionsAllowed = 1`. Safe on paper. It made every node drain wait a full
graceful-shutdown plus readiness cycle, and the 120-node upgrade took a whole night.

They replaced it with `maxUnavailable: 2`. Now the arithmetic that justified the number
was written down instead of guessed:

```text
PICK THE NUMBER — checkout-api, 12 replicas, peak 70% of capacity
══════════════════════════════════════════════════════════════════════

  need: (12 - allowed) / 12  >=  0.70
         allowed <= 12 * 0.30 = 3.6   ->  at most 3

  allowed  capacity floor   headroom over peak 70%
  ──────────────────────────────────────────────────────────────
     1        91.7%              +21.7 pts   slowest drain
     2        83.3%              +13.3 pts   chosen
     3        75.0%               +5.0 pts   thin, no probe jitter
     4        66.7%              -3.3 pts    SLO breach

  headroom is not luxury. a pod that flaps after eviction makes
  currentHealthy drop by 2 while the budget already spent 2.
```

Then the drain trace, on one node that hosts two `checkout-api` pods and one pod of a
3-replica consensus service (`orders-db`, PDB `minAvailable: 2`, so 1 allowed):

```text
TRACE — kubectl drain node-84, maxUnavailable 2, ready in 35 s (api) / 67 s (db)
══════════════════════════════════════════════════════════════════════

  t=0:00   cordon node-84 ........................ ok
  t=0:00   evict checkout-api-7f9c  -> 201 ....... down: 1 of 12
  t=0:01   evict checkout-api-7f9d  -> 201 ....... down: 2 of 12, floor 83%
  t=0:01   evict orders-db-2        -> 201 ....... quorum 2 of 3 held
  t=0:02   evict checkout-api-7f9e  -> 429 ....... budget spent, retry
  t=0:02   evict orders-db-3        -> 429 ....... would break quorum

  t=0:36   checkout 7f9c and 7f9d Ready  ->  allowed 2 again
  t=0:37   evict checkout-api-7f9e  -> 201 ....... down: 1 of 12
  t=1:08   orders-db-2 Ready (67 s)      ->  allowed 1 again
  t=1:09   evict orders-db-3        -> 201 ....... quorum 2 of 3 held
  t=1:12   checkout-api-7f9e Ready
  t=2:16   orders-db-3 Ready (67 s start to ready)
  t=2:20   uncordon node-84

  wall clock: 140 s       zero 5xx        capacity floor: 83%
```

That is the healthy case: about 140 s per node, so `120 × 140 s ≈ 4.7 h` of upgrade
work. The two budgets overlap in time, so neither one adds a second round trip.

The unhealthy case arrived two releases later. A new service, `ledger-worker`, shipped
with `replicas: 1` and a copy-pasted `minAvailable: 1`. Nobody noticed, because it never
restarted and never failed a probe.

```text
THE UPGRADE THAT STOPPED AT NODE 84
══════════════════════════════════════════════════════════════════════

  node 1 .......... node 83          ok, 140 s each
  node 84
    evict ledger-worker-5b8d  -> 429  (replicas 1, minAvailable 1)
    retry every 5 s
    ...
  03:41  job still on node 84        elapsed 6 h 12 m
  03:41  someone runs:
           kubectl drain node-84 --disable-eviction --ignore-daemonsets
         (this DELETEs. it does not evict. the PDB never sees it.)
  03:42  ledger-worker gone        -> batch window: 4,100 items stuck
  06:10  upgrade finally resumes on node 85

  root cause: minAvailable 1 on 1 replica  ->  0 allowed, by definition
  second cause: the plan had no "budget stuck" alert
```

The fix has three parts, and each one is a different lesson:

```text
  BEFORE                              AFTER
  ─────────────────────────────────────────────────────────────────
  ledger-worker:                      ledger-worker:
    replicas: 1                         replicas: 2
    minAvailable: 1                     maxUnavailable: 1
  (0 allowed, drain wall)             (1 allowed, 50% floor)

  alert: none                         alert:
                                        pdb.status.disruptionsAllowed == 0
                                        for 15 m  ->  page owner

  runbook: "drain --disable-eviction"  runbook: fix the budget, or scale
                                       up, or take a maintenance window
```

Two of the three parts are not YAML. A budget of zero is a silent condition: no error
event, no failed probe, no 5xx. Only a monitor on `disruptionsAllowed` sees it, and only
before the upgrade night, not during it.

```text
WHERE THE TIME ACTUALLY GOES — 120 nodes, one at a time
──────────────────────────────────────────────────────────────────
  per node    cordon + evict + wait Ready + uncordon   140 s
  total       120 x 140 s                            = 4.7 h
  parallel    surge 5% (6 nodes at once)              ~ 0.9 h
  blocked     one zero budget                        = never
  ──────────────────────────────────────────────────────────────────
  the PDB set the floor on parallel factor, not the ceiling.
  every "allowed: 1" app on a node serialises that node.
```

**The honest part.** The 130 s figure is measured against a 35 s readiness probe and a
30 s termination grace period on a cluster where the scheduler has room. It is a model
of the control loop, not a benchmark of your cluster. Three things move it a lot: image
pull time on the target node, the scheduler's ability to place the replacement pod, and
whether the readiness probe is real work or a static `200 OK`. Measure your own
`kubectl drain` on a non-production node before you publish an upgrade window.

One more limit worth stating: a PDB cannot tell you whether the app is *correct* while
degraded. A budget of 2 keeps 10 pods serving, but a cache that cold-starts behind a
missing warmup will still time out for the first requests on the new pods. The PDB buys
time to recover. It does not buy correctness.

The punchline: a PDB is a contract between the application owner and everyone who moves
pods. The application owner says how much loss the app can absorb. The cluster owner
says when the work must happen. When the first number is zero, the second stops being a
schedule and becomes an outage waiting for a shortcut. Write the subtraction down —
`currentHealthy - desiredHealthy` — and you will see the wall before the drain does.
