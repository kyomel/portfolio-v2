---
title: "Change Data Capture (CDC)"
termSlug: "change-data-capture-cdc"
year: 2026
month: 11
monthName: "November"
day: 5
order: 4
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Change Data Capture (CDC) moves every data change out of a database as it happens. The connector does not query the tables. It reads the database's own change log: the MySQL binlog, the PostgreSQL..."
---
### Definition:

**Change Data Capture (CDC)** moves every data change out of a database as it
happens. The connector does not query the tables. It reads the database's own
change log: the MySQL binlog, the PostgreSQL write-ahead log (WAL), the Oracle
redo log. Every committed INSERT, UPDATE, and DELETE appears there in commit
order. The connector turns each log record into one event and publishes it.

CDC solves one structural problem. Several systems must agree on the same
table data. Re-reading the whole table is slow, late, and blind to deletes.
CDC reads the log once, and every downstream system reads the same stream.

**Three ways to find what changed.**

```text
THREE CAPTURE METHODS — same goal, different source of truth
══════════════════════════════════════════════════════════════════════════════

  method        finds a change by              blind spot          cost to source
  ────────────  ─────────────────────────────  ──────────────────  ──────────────
  polling       SELECT ... WHERE updated_at    deletes             full scans on
                > :last_run                    old rows            every run
                needs a timestamp the app      rows that never     reads live
                writes correctly               get touched         tables

  trigger       a trigger writes each          changes inside      one extra
                change to a side table,        the trigger's own   write inside
                in the same transaction        blind spot          every tx

  log-based     the connector reads the        nothing that        near zero: a
                transaction log itself         committed           stream read
                                               has a log record    of the log
```

Log-based is the default meaning of CDC today. The other two methods still
exist where no log is reachable: managed SaaS databases, or third-party
systems that expose only a table and a timestamp column.

**WITHOUT CDC vs WITH CDC.**

```text
WITHOUT CDC — the batch job guesses           WITH CDC — the log knows
═══════════════════════════════════════════════════════════════════════════════

  app writes ─► SELECT every 15 min           app writes ─► WAL at commit
                 │                                            │
                 ▼                                            ▼
  ┌──────────────────────────────┐            ┌───────────────────────────────┐
  │ WHERE updated_at > :last_run │            │ connector reads the log       │
  │ runs every 15 minutes        │            │ one event per change          │
  └──────────────┬───────────────┘            └───────────────┬───────────────┘
                 ▼                                            ▼
  misses deletes          the row is gone     search · cache · warehouse · services
  misses old rows         no timestamp        shipping · analytics
  spikes the source       big scans
  always 15 min late      app's timestamp
```

**One event, one envelope.** The event carries the old row and the new row.
Downstream code picks what it needs.

```text
THE ENVELOPE — one change event as it lands in Kafka
══════════════════════════════════════════════════════════════════════════════

  {
    "op":     "u",                         c = create, u = update,
                                           d = delete, r = snapshot read
    "before": { "id": 40, "qty": 1 },      old row (null on create)
    "after":  { "id": 40, "qty": 2 },      new row (null on delete)
    "source": {
      "db":     "shop",
      "table":  "orders",
      "lsn":    "0/16B3A7C8",              position in the log = the cursor
      "txid":   88421,                     the transaction it belongs to
      "ts_ms":  1762348800123
    }
  }
```

**Ordering: one key is safe, two keys are not.** The log has a global commit
order. A streaming pipeline usually splits rows across partitions by primary
key. Order survives inside a partition. Order does not survive across them.

```text
ORDERING GUARANTEE — what CDC promises, and what it does not
══════════════════════════════════════════════════════════════════════════════

  same key  →  same partition  →  order kept
  ─────────────────────────────────────────────────────────────────────────
    commits on orders id=40             events for id=40
      UPDATE qty = 2    ─┐
      UPDATE qty = 5     ├──►     ┌──────────────────────┐
      DELETE            ─┘        │ partition 3          │  2 → 5 ✓
                                  │ key = id % N         │  then gone ✓
                                  └──────────────────────┘

  different keys  →  maybe different partitions  →  no global order
  ─────────────────────────────────────────────────────────────────────────
      orders id=40  →  partition 3      (qty 2, then 5)
      orders id=41  →  partition 7      (qty 9)
      "did id=40 change before or after id=41?"   the pipeline cannot say
      one transaction spanning two tables lands in two topics
      a consumer that needs atomicity must use txid to group the events
```

**Delivery: at-least-once by default.** The connector saves its log position
(offset) after it publishes. If it crashes in between, it replays the last
events. Duplicates are normal. A consumer that counts on "exactly once"
without doing work returns wrong results after a replay.

```text
DELIVERY SEMANTICS — where duplicates come from
══════════════════════════════════════════════════════════════════════════════

  connector                     broker                      consumer
  ─────────                     ──────                      ────────
  read event (lsn X)  ──────►   publish event
  save offset X       ──┐
                        │ CRASH HERE (before offset saved)
                        ▼
  restart at saved offset X-1   ──►  same event published again

  fix that works: the consumer is idempotent
    key          = primary key of the row
    dedupe rule  = keep the event with the highest LSN per key
    result       = duplicates become invisible (effective exactly-once)
```

**The bill and the limits.** CDC is cheap to the source, but it is not free.

```text
COST AND LIMIT LEDGER — LOG-BASED CDC
┌──────────────────────────────────┬────────────────────────────────────────────┐
│ PRO                              │ CON                                        │
├──────────────────────────────────┼────────────────────────────────────────────┤
│ near-zero load on the source     │ a stopped connector keeps its replication  │
│ (a stream read, not a scan)      │ slot: PostgreSQL WAL grows until the disk  │
│ sees deletes and old rows        │ fills. Monitor slot lag, or lose the node  │
│ commit order, sub-second lag     │ DDL does not travel: logical replication   │
│                                  │ does not carry ALTER TABLE statements      │
│ the app writes to one system     │ one transaction spanning two tables may    │
│ only: the database               │ arrive on two topics, split and reordered  │
│ downstream reads the same log,   │ downstream must be idempotent: replay is   │
│ so every consumer agrees         │ a feature, not an error                    │
│ no dual-write problem: no app    │ snapshot + backfill of huge tables costs   │
│ code writes to DB and bus twice  │ and it runs against production data        │
│ works on any schema: row images  │ you now own a pipeline: connector, broker, │
│ need no app instrumentation      │ schema registry, offsets, monitoring       │
└──────────────────────────────────┴────────────────────────────────────────────┘
```

**Snapshot and stream must join without a gap.** On first run, the table has
history the log does not. The connector takes a snapshot, remembers the log
position (LSN) where the snapshot started, then reads forward from that same
LSN. Rows changed during the snapshot arrive again from the log. The
consumer's idempotent dedupe rule makes the second copy harmless.

```text
INITIAL SNAPSHOT → STREAM — the join point is one LSN
══════════════════════════════════════════════════════════════════════════════

  table (200M rows)                 transaction log
  ┌──────────────────────┐          ──────────────────────────────────►
  │ snapshot read in     │          LSN X ──► new changes stream from here
  │ chunks, low priority │              ▲
  └──────────┬───────────┘              │
             │  records LSN X           │
             └──────────────────────────┘
  snapshot ends                     stream starts at the same LSN: no gap, no overlap

  rows changed DURING the snapshot:
    snapshot read them at old state  ─┐
    log replays them at new state    ─┴─► consumer keeps highest LSN per key
```

**CDC vs the transactional outbox pattern.** Both fix the same enemy: the
dual-write problem, where one request must update a database and publish an
event, and only one of the two can succeed.

```text
DUAL WRITE — the bug both patterns remove
══════════════════════════════════════════════════════════════════════════════

  request handler
       │
       ├──── write to DB   ─── OK
       └──── publish event ─── FAILED (broker down, timeout)
       result: the row exists. No event exists. The systems disagree.
       Nothing in the code records that it happened.

  fix A  transactional outbox   the app writes the event row inside the same
                                transaction. A relay publishes it later
                                → you control the event: names, not row images
  fix B  CDC                    the app writes only to the DB. The connector
                                reads the committed log and publishes it
                                → zero app code. You get row images, not names

  choose outbox when you need domain events or no log is reachable
  choose CDC when row state is enough and the database already logs it
```

**Production traps, in the order they hit teams.**

```text
TRAP LEDGER — what actually breaks
══════════════════════════════════════════════════════════════════════════════

  1. slot left behind      connector stops over the weekend.
                           PostgreSQL keeps the WAL for the slot.
                           The disk grows from 12 GB to 400+ GB in 3 days.
                           fix: alert on replication slot lag and
                           WAL disk usage, not only on connector status

  2. DDL during streaming  logical replication does not carry DDL.
                           RENAME or type change breaks the consumer
                           while the connector reports "healthy"
                           fix: schema registry with compatibility rules
                           (BACKWARD) + freeze DDL during cutover windows

  3. duplicate handling    broker retries, connector restarts, and
                           re-snapshots all replay events
                           fix: dedupe on (primary key, LSN) in the
                           consumer, before anything else writes

  4. full table as one     a 200M-row snapshot holds resources for hours
     snapshot              fix: chunked snapshot at low priority,
                           start streaming from the snapshot's LSN first

  5. trust in "the          CDC moves rows, not intent: a correction, a
     latest row"           merge, and a revert can look identical downstream
                           fix: keep op + LSN + txid in the event, and let
                           the consumer replay history instead of guessing
```

The honest part. CDC copies row state. It does not copy transactions as one
atomic unit across topics, it does not carry DDL, and it does not replace
application-level events when the meaning matters more than the row image.
A pipeline that reads the log still needs offsets, idempotent consumers,
schema rules, and alerts on lag. Treat CDC as the cheapest correct way to
keep secondary systems in sync with a database, not as a complete
integration strategy.

The punchline: CDC moves one decision from "query the table again" to "read
the log once". The database already wrote every change down. Reading that
record gives all downstream systems the same ordered history, at near-zero
cost to the source. The work moves to the consumer: idempotent writes,
schema discipline, and lag alerts.

### Example:

A shop backend runs PostgreSQL. One order row must reach four systems:
the search index, the read cache, the analytics warehouse, and the
shipping service. The team first tried direct writes: the order service
updated the database, then published an event, then updated the cache.

```text
BEFORE — three writers, one truth, no agreement
══════════════════════════════════════════════════════════════════════════════

  order service (one HTTP request)
       │
       ├──── 1. UPDATE orders        OK
       ├──── 2. publish event        FAILED  ← broker timeout, retry lost
       ├──── 3. SET cache key        OK      ← cache now newer than the event
       │
       └──── the systems now disagree:
             search never learns the order exists
             warehouse misses the row until the nightly job
             the cache disagrees with the database for 6 hours
```

The team removes steps 2 and 3 from the request path. The service now writes
only to PostgreSQL. A Debezium connector reads the WAL. Kafka carries the
events. Each downstream system owns one consumer and one job.

```text
AFTER — one writer, one log, four consumers
══════════════════════════════════════════════════════════════════════════════

  order service          PostgreSQL              Debezium connector
       │                     │                            │
       └── UPDATE orders ──► │ commit → WAL record ─────► │ reads WAL stream
                             │                            │ snapshot first,
                             │                            │ then stream (LSN)
                             │                            ▼
                             │                     ┌──────────────┐
                             │                     │ Kafka topics │
                             │                     │ orders (key  │
                             │                     │ = id)        │
                             │                     └──────┬───────┘
                             │                            │
                             │                            ├──► search indexer    (bulk upsert)
                             │                            ├──► cache invalidator (delete on d,
                             │                            │                      upsert on c/u)
                             │                            ├──► shipping service  (consume events,
                             │                            │                      idempotent)
                             │                            └──► analytics sink    (read the same topic)
```

**The join point works the first hour.** The `orders` table holds 40 million
rows. The connector snapshots them in chunks, records LSN `0/16B3A7C8`, and
streams forward from there. During the snapshot a customer places order
`#40,112,001`. The snapshot reads the table before that insert commits. The
log replays the insert right after. The search indexer receives the row
twice. Its dedupe rule keeps the highest LSN per id, so the index shows the
row once.

```text
WEEK ONE IN PRODUCTION — three incidents, three lessons
══════════════════════════════════════════════════════════════════════════════

  MON  the platform team stops the connector for a schema change
       and forgets to restart it.
       ────────────────────────────────────────────────────────────────
       Postgres keeps the replication slot. The WAL grows from 12 GB
       to 400+ GB in 3 days. An alert on WAL disk usage fires before
       the disk fills. Alert list after the fix:
         replication slot lag      > 5 min
         WAL disk usage            > 60% of volume
         consumer lag per topic    > 100k messages
       lesson: alert on what the slot holds, not on "connector: running"

  WED  a migration renames orders.total to orders.grand_total.
       ────────────────────────────────────────────────────────────────
       Logical replication does not carry DDL. The connector keeps
       running. The warehouse consumer starts writing NULL totals.
       The search index keeps the old field name. Nothing fails loudly.
       fix: schema registry with BACKWARD compatibility rejects the
       rename at registration time. A DDL freeze window covers cutover
       lesson: "the pipeline has no errors" and "the data is right" are two
               different claims

  FRI  one transaction updates orders and shipments together.
       ────────────────────────────────────────────────────────────────
       the two rows land in two topics. The shipping consumer sees
       the shipment row before the order row. Its handler reads the order
       from the database, gets the pre-transaction state, and ships to the
       old address
       fix: group events by txid in the consumer, or key both tables
       into one topic when they must move together
       lesson: per-key order is guaranteed. Cross-table atomicity is not
```

The rollout that worked, in order:

```text
ROLLOUT — five steps, each one reversible
══════════════════════════════════════════════════════════════════════════════

  1. enable logical replication on Postgres        no traffic change
  2. start the connector with a limited snapshot   orders only, chunks on
  3. replay 7 days of logged queries against the   compare row counts and
     new topics, diff the results                  spot the diff, no users
  4. move one consumer at a time to the topics     rollback = point it back
  5. remove the old direct writes from the app     last step, not first
```

Step 5 comes last for a reason. Two sources can run at the same time. The
old direct publish and the new log-based publish both write to Kafka. The
consumer's idempotent dedupe rule hides the overlap. Removing the old path
first would leave a window where no path exists.

The honest part. The nightly job still runs. CDC feeds the warehouse in
seconds, but the team keeps one daily reconciliation query that counts rows
in the source and in the warehouse. In the first month it found one real
gap: a table without a primary key. Log-based CDC cannot split that table
into stable partitions, so its events landed unordered. The fix was a
primary key, not a bigger connector. The team also learned the cost they
did not budget: one connector, one broker, one schema registry, and a
person who reads lag charts. The source database stayed nearly untouched
through all of it, which was the point.

The punchline: the database already records every change in commit order.
CDC turns that record into the shared history of every system downstream.
You still owe idempotent consumers, schema rules, and lag alerts. You stop
polling tables, you stop missing deletes, and the request path stops
writing to three places at once.
