---
title: "Transactional Outbox Pattern"
termSlug: "transactional-outbox-pattern"
year: 2026
month: 9
monthName: "September"
day: 9
order: 7
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "The Transactional Outbox Pattern makes publishing an event as reliable as committing a database transaction — by not publishing from the application at all. Instead of sending a message to a broker..."
---
### Definition:

The Transactional Outbox Pattern makes **publishing an event as reliable as committing a database transaction** — by not publishing from the application at all. Instead of sending a message to a broker inside your request handler, you write the event as a row into an **outbox table, in the *same* database transaction** as the business change. A separate *relay* process later reads those rows and forwards them to the broker. Your database transaction becomes the single point of atomicity: business data and its events either commit together or not at all.

The pattern exists because of the **dual-write problem**. In any event-driven system, some operation must do two writes that no single transaction can span: (1) change rows in your database and (2) publish an event to a broker. A relational transaction cannot reach into Kafka; a broker transaction cannot reach into Postgres. So the two writes are never atomic, and whichever order you pick, you expose a window where the two systems disagree — the two classic failure modes:

- **Save-then-publish**: the order commits, the process crashes before the event goes out → the event is *lost forever*. The order exists but nothing downstream ever hears about it, and that inconsistency never heals on its own.
- **Publish-then-save**: the event goes out, then the business write rolls back → a *phantom event*. Consumers eagerly send a confirmation email, decrement stock, and charge a card for an order that does not exist.

The outbox closes both windows with one trick: the event stops being a side effect and becomes **data**. You move the publish outside the transaction and outside the request path entirely, and the message broker becomes just one more *consumer of your database*.

NAIVE DUAL-WRITE vs OUTBOX — where atomicity lives:
════════════════════════════════════════════════════════════════════════

```
NAIVE — two writes, two systems, NO shared atomicity:

  handler
    │  ① write business row        ② send event to broker
    ▼                                ▼
  ┌───────────────┐              ┌──────────────┐
  │  ORDERS  DB   │              │   BROKER     │
  └───────────────┘              └──────────────┘
      no transaction can span both ──► either write fails alone:
        • ① ok, crash before ②  → event LOST (order exists,
                                     nobody notified, never heals)
        • ② ok, ① rolls back    → PHANTOM event (consumers act on
                                     an order that doesn't exist)

OUTBOX — the event is a ROW, committed atomically with the change:

  handler
    │  BEGIN TX
    │    INSERT INTO orders (...)
    │    INSERT INTO outbox (id, aggregate_id, type,
    │                        payload, created_at)
    │  COMMIT                      ← one transaction: both or neither
    ▼
  ┌───────────────────────────────────────┐
  │            ORDERS  DB                 │   the DB is now source of
  │  ┌──────────────┐  ┌───────────────┐  │   truth for state AND events
  │  │ orders       │  │ outbox        │  │
  │  │              │  │ OrderPlaced…  │──┼──► ② relay reads new rows
  │  └──────────────┘  └───────────────┘  │     (polling OR CDC tailer)
  └───────────────────────┬───────────────┘
                          │ ③ publish — relay retries forever,
                          ▼    crash/restart loses nothing
                  ┌───────────────┐
                  │    BROKER     │   at-least-once delivery
                  └───────┬───────┘
                          │ ④ consumers MUST be idempotent
                          ▼    (duplicates are expected, not bugs)
```

  ┌────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: you never "send" an event in the request path —     │
  │  you SAVE it. Delivery becomes a separate, retryable job       │
  │  owned by a relay, fully decoupled from the business write.    │
  └────────────────────────────────────────────────────────────────┘

How the relay works — two flavors, same job (read new rows → publish → mark dispatched):

```
POLLING PUBLISHER                          TRANSACTION LOG TAILING (CDC)
─────────────────────                      ─────────────────────────────
  app process, your code                    Debezium / CDC connector
  every N ms (or on commit hook):           reads the DB's write-ahead
                                            log / replication stream
  SELECT ... FROM outbox
  WHERE dispatched_at IS NULL               ┌───────────────────────┐
  ORDER BY id                               │  outbox table          │
  FOR UPDATE SKIP LOCKED                    │  INSERT ... ──► WAL    │
        │                                   └───────────┬───────────┘
        ▼                                               │ tails binary
  publish each row ──► broker                           ▼
        │                                     ┌───────────────────────┐
        ▼                                     │  Debezium / CDC       │
  UPDATE outbox                               │  ──► broker           │
  SET dispatched_at = now()                   └───────────────────────┘
        │                                     • zero app code, no
  + easy to write, test, debug                  polling latency
  + full control (batching, retry)            • but read-only window
  – adds latency (poll interval)                on your DB internals
  – watch out: MULTIPLE relay instances        • ordering preserved by
    can double-publish → make the relay         the log itself
    idempotent (UNIQUE(id)) or run ONE
```

Non-negotiable companions of the pattern:

- **At-least-once, never exactly-once.** A relay can crash after publishing but before marking the row dispatched, so the same event *will* sometimes arrive twice. Consumers must dedupe (store `processed_event_id` with a UNIQUE constraint, or make the consumer's own write idempotent by natural key). This is not a flaw — it's the honest contract that makes the whole system simple.
- **Ordering is a choice, not a given.** If per-aggregate ordering matters (events for the *same order* must arrive in sequence), either run a single relay or partition the topic by `aggregate_id` — and remember multiple relay instances polling in parallel can hand rows to the broker out of order.
- **The outbox table needs a janitor.** Dispatched rows accumulate forever if nobody deletes them. Common policy: delete rows older than N days/hours (after confirming the broker took them), or keep them briefly as an audit/replay trail. Retention is a business decision — storage is cheap, ordering guarantees are not.
- **It is not Event Sourcing.** Event sourcing stores *all* state as events and rebuilds aggregates from them; the outbox is just a delivery queue that mirrors your normal writes. They coexist happily — and so do the outbox and CQRS (day - 1): the outbox is often the reliable pipe that feeds a CQRS read model.

When you should *not* reach for it: purely synchronous request/response with no events; workloads where a lost event is genuinely tolerable (metrics, best-effort notifications) — there the pattern is pure overhead; and systems that need a broker message *before* the DB commit becomes visible. Otherwise, for anything where "this happened" must eventually reach other services exactly once per occurrence, the outbox is the standard answer — which is why it shows up in every serious microservices guide, and why CDC-based relays (Debezium + Kafka Connect) turned it into mainstream production practice through 2024–2026.

### Example:

"KopiKode" — an online coffee-subscription shop — splits checkout into services. The `orders` service is the source of truth for orders. When a customer checks out, three other services must learn about it: `billing` (charge), `inventory` (reserve beans), and `notifications` (send "order received" email). The first version did the naive dual-write — and production found both failure modes within a week:

```
NAIVE VERSION — the week from hell:

  checkout handler
    │  INSERT order (ok)
    │  kafka.send("OrderPlaced")        ── ① 3 AM: crash between the
    ▼                                      two lines → order stored,
  ┌────────────┐   ┌──────────┐            email never sent, stock
  │ orders DB  │   │  broker  │            never reserved. Support
  └────────────┘   └──────────┘            tickets: "I ordered, no
                                           confirmation, beans never
    and the reverse: a retry sent the      shipped."
    event twice for ONE order after a
    timeout → customer charged 2×,         ── ② double-send on retry:
    two emails, beans reserved 2×.             no dedupe anywhere.
```

They rebuilt it with an outbox. The checkout handler now does exactly ONE transactional write; a polling relay (their Go service, `SELECT … FOR UPDATE SKIP LOCKED`, every 100 ms) does the publishing; and consumers dedupe on `event_id`:

```
WITH THE OUTBOX — order → event → three consumers, no lost or phantom events:

  CUSTOMER taps "Checkout"
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │ ORDERS SERVICE — ONE local transaction      │
  │                                             │
  │   BEGIN;                                   │
  │     INSERT INTO orders (id, sku, qty, …)   │   ← business change
  │     INSERT INTO outbox (id, aggregate_id,  │
  │       type, payload)                       │   ← the event, same tx
  │       VALUES (evt_9f2c, 'order_4711',      │
  │               'OrderPlaced', '{…}');       │
  │   COMMIT;                                  │
  │                                             │
  │   ┌──────────────┐   ┌───────────────────┐ │
  │   │ orders       │   │ outbox            │ │
  │   └──────────────┘   │ evt_9f2c OrderPl… │ │
  │                      └───────────────────┘ │
  └─────────────────────────────┬───────────────┘
                                │
                  RELAY (Go, polls every 100 ms:
                  SELECT … FOR UPDATE SKIP LOCKED)
                                │
                                │  publish evt_9f2c ──► topic "orders"
                                ▼
                     ┌──────────────────────┐
                     │        KAFKA         │   at-least-once
                     └──┬───────┬───────┬───┘
                        │       │       │
            ┌───────────┴──┐ ┌──┴──────┐ └──────────┐
            ▼              ▼          ▼            ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │   BILLING    │ │INVENTORY │ │ NOTIFICATIONS │
     │  charge $12  │ │reserve 1 │ │  send email   │
     └──────┬───────┘ │bag "Gayo"│ └──────┬───────┘
            │         └──────────┘        │
            └─────────── all dedupe on ───┘
                 event_id: INSERT INTO processed (event_id)
                 … UNIQUE(event_id) → duplicate delivery of
                 evt_9f2c is swallowed silently, never re-applied
```

```
THE CRASH TEST — why this survives what the naive version didn't:

  relay publishes evt_9f2c ──► broker ACKs ──► crash
        │                                        │
        │         relay dies BEFORE marking       │
        ▼         outbox row dispatched           ▼
  outbox: evt_9f2c  dispatched_at = NULL    (row still pending)

  relay restarts → re-reads evt_9f2c → publishes AGAIN
        │
        ▼
  billing receives evt_9f2c twice:
     1st: INSERT processed(evt_9f2c) ✓ → charge $12
     2nd: INSERT processed(evt_9f2c) ✗ UNIQUE VIOLATION
          → caught, skipped, NO second charge

  RESULT: the event is delivered at least once, the CHARGE happens
  exactly once (thanks to the consumer's dedupe), and no order is
  ever silently missing its events. Even a crash in the relay is
  just "publish again" — the DB never lies about what happened.
```

The team's final shape: orders DB holds state + outbox; the Go relay (or, later, Debezium tailing the WAL) moves events to Kafka; billing, inventory, and notifications all dedupe by `event_id`; a nightly cleanup job deletes outbox rows dispatched more than 24 h ago. The checkout path gained a few microseconds writing one extra row — and lost an entire class of "it happened but nobody knows" incidents.

The punchline: the Transactional Outbox Pattern is the pragmatic answer to the oldest lie in distributed systems — "I'll write to my DB and then tell everyone about it." You cannot make two systems commit atomically, so you stop trying: you make the *event itself* part of the one transaction you do control, and you treat the broker as a downstream consumer that lags a little. Events become durable facts that survive crashes, restarts, and deploys by construction — and the only price is a relay you can restart freely and consumers that must tolerate (and dedupe) a duplicate now and then. That trade — atomicity where it's free, idempotency where it's needed — is why the outbox, not distributed transactions, became the default backbone of event-driven systems.
