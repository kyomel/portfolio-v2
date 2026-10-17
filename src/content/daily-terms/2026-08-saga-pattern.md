---
title: "Saga Pattern"
termSlug: "saga-pattern"
year: 2026
month: 8
monthName: "August"
day: 28
order: 20
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "A Saga is a sequence of local transactions where each step publishes an event or invokes a call that triggers the next step. If a step fails, the saga runs compensating transactions to undo the alr..."
---
### Definition:
A **Saga** is a sequence of local transactions where each step publishes an event or invokes a call that triggers the next step. If a step fails, the saga runs **compensating transactions** to undo the already-completed steps — it guarantees *eventual* consistency without holding a global lock across services.

It solves a hard problem: a single business action (e.g. "place order") often spans multiple microservices, each owning its own database. You can't do one atomic ACID transaction across them, so you need a pattern that coordinates distributed state change.

Two coordination styles:
- **Choreography** — no central coordinator; each service emits an event and listens for others. Simple, decoupled, but hard to reason about (logic is spread out).
- **Orchestration** — a central "saga orchestrator" tells each service what to do and, on failure, what to undo. Easier to trace and test.

Contrast with the classic distributed transaction (2PC):

```
  DISTRIBUTED TRANSACTION (2PC)          SAGA PATTERN (compensating)
  ------------------------------------   ------------------------------------
  Coordinator holds ALL services         Each step = local, committed txn
  in a global "prepared" state           (no global lock, no long-held txn)

        [Coordinator]                           [Orchestrator]
        /     |     \                                  |
       v      v      v                                 v
  [Order][Pay][Ship]   <-- all blocked,            [Create Order]  --committed
                            one "prepare"               |
                                                         v
                                                      [Charge Card] --committed
                                                         |
                                                         v
                                                      [Ship Item]   --committed
  If ANY fails => rollback ALL                        |  (if charge fails:)
  (requires 2PC-ready stores,                          v
   locks held during network calls)            [Refund Card]  <-- COMPENSATION
   STRONG consistency                             [Cancel Order]
   LOW availability, HIGH coupling              EVENTUAL consistency
                                                HIGH availability, decoupled
```

Pros: high availability (no long-held locks), services stay autonomous, scalable.
Cons: eventual consistency only (readers may see intermediate states), no automatic rollback — you must write compensating logic, harder to reason about.

### Example:
Imagine an e-commerce checkout that spans three services. If card charging fails after the order was created, a plain flow would leave a dangling order. The saga **compensates**: it cancels the order it just made.

```
 [Order Service]                  [Payment Service]              [Shipping Service]
       | 1. create order                |                             |
       +------------------------------->| 2. charge card               |
       |       (committed)              |                             |
       |                                +---------------------------->| 3. ship item
       |                                |                             |   (committed)
       |                                |                             |
       |      << CARD DECLINED >>       |                             |
       |                                |                             |
       |<------ 4. "charge failed" -----|                             |
       |                                |                             |
       | 5. CANCEL order  (compensation)|                             |
       +--[refund card if already       |                             |
           partially charged]--->       |                             |
       |                                |                             |
   final state: order cancelled,        |
   money refunded, nothing orphaned     |
```

Every forward step has a mirror-image compensating step (create→cancel, charge→refund, reserve→release). The saga either completes fully or unwinds cleanly — the system stays consistent *eventually*, with no service ever holding a global lock.
