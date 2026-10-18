---
title: "CRDT (Conflict-Free Replicated Data Type)"
termSlug: "crdt-conflict-free-replicated-data-type"
year: 2026
month: 9
monthName: "September"
day: 18
order: 14
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "A CRDT (Conflict-Free Replicated Data Type) is a data type that many replicas update at the same time, without a central coordinator. Any two replicas merge into one identical result. The merge ord..."
---
### Definition:

A **CRDT (Conflict-Free Replicated Data Type)** is a data type that many replicas update at the same time, without a central coordinator. Any two replicas merge into one identical result. The merge order does not matter.

The guarantee has a name: **strong eventual consistency**. Any two replicas that received the same set of updates hold the same state. A replica that received fewer updates is only behind. It is never wrong.

The reason CRDTs work is algebra, not consensus. The merge function must obey three laws:

- **Commutative** — `merge(A, B) = merge(B, A)`. Replicas may exchange updates in any order.
- **Associative** — `merge(merge(A, B), C) = merge(A, merge(B, C))`. A replica may merge in batches.
- **Idempotent** — `merge(A, A) = A`. A duplicate update changes nothing.

These three laws define a **join-semilattice**. That is the whole trick. The network may drop, duplicate, delay, or reorder messages. The state still converges. No lock, no leader, no two-phase commit, no quorum.

```text
NAIVE REPLICATION  vs  CRDT — two replicas edit the same data, no coordinator
════════════════════════════════════════════════════════════════════════════════

NAIVE LAST-WRITE-WINS — the whole record is overwritten
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   phone A (offline)              server                 phone B (online)     │
│   ─────────────────              ──────                 ────────────────     │
│   row = {streak: 12}     ...     row = {streak: 12} ◄──  row = {streak: 13}  │
│   user taps "done"               (B's write lands)                            │
│   row = {streak: 13}                                                          │
│        │                                                                      │
│        │  network returns                                                     │
│        └──────► pushes WHOLE row {streak: 13} ──► server row = {streak: 13}   │
│                                                                              │
│   RESULT: B's edit is gone. No error appears. The row still looks correct.    │
│   Two concurrent edits to ONE record = one survives, the other is lost.       │
│   A stale client can also overwrite NEWER data (clock skew, retry, replay).   │
└──────────────────────────────────────────────────────────────────────────────┘

CRDT — merge, never overwrite
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   replica A                       replica B                                  │
│   ─────────                       ─────────                                  │
│   counter = {A: 7, B: 6}          counter = {A: 6, B: 7}                     │
│                    \             /                                           │
│                     \           /   merge = take the MAX per entry           │
│                      ▼         ▼    (no clock, no order, no coordinator)     │
│             ┌───────────────────────────────┐                                │
│             │ {A: 7, B: 7}  →  total = 14   │                                │
│             └───────────────────────────────┘                                │
│                                                                              │
│   RESULT: both edits survive. Both replicas hold the same value.             │
│   Merge the same pair 10 times  → same value (idempotent).                   │
│   Merge in any order            → same value (commutative).                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

This is a different place in the consistency spectrum than consensus. Raft and Paxos order every write through a leader, so a read is always current. A CRDT removes the ordering step, so a read is only eventual. The trade is deliberate: no leader means no failover stall and no cross-region round trip.

```
THE TWO FAMILIES — what travels on the wire
═══════════════════════════════════════════════════════════════════════════════

  STATE-BASED (CvRDT)               OPERATION-BASED (CmRDT)
  ─────────────────────             ──────────────────────────
  sends the FULL state              sends each OPERATION
  merge = join of two states        merge = apply the operation
  delivery: any time, any order     delivery: causal order, exactly once
  robust, bandwidth-heavy           efficient, transport must be solid
        ▲                                     ▲
        └──────────── DELTA-STATE CRDT ───────┘
                      sends only the delta,
                      keeps the idempotent join

  Delta-state is the 2026 default. Yjs and Automerge both ship deltas,
  not full documents, on every update.
```

The family of types is small. Each type answers one shape of question:

- **G-Counter** — grow-only counter. One slot per replica. Value = sum of all slots. Merge = max per slot.
- **PN-Counter** — two G-Counters, one for increments and one for decrements. Value = plus minus minus.
- **LWW-Register** — one value plus a timestamp. The later write wins. Simple, and it silently drops the other write.
- **OR-Set (Observed-Remove Set)** — add and remove concurrently. A remove tombstones only the tags that replica observed. A concurrent add survives.
- **Sequence CRDT (RGA, YATA, Logoot)** — text. Every character gets a stable ID and sits between two neighbours, so two inserts at one spot both land.
- **OR-Map** — a map whose values are themselves CRDTs.

Where this runs in production today:

- **Collaborative editors** — Yjs and Automerge for text and JSON documents. Reported users include Jupyter, Evernote, and Sanity Studio. Figma and Apple Notes both built CRDT-flavoured models for offline edits.
- **Geo-replicated databases** — Redis Enterprise Active-Active replicates counters and sets across regions with CRDT merge, so two regions accept writes at the same time. Riak DT and AntidoteDB belong to the same class.
- **Sync engines** — the local-first stack of 2026 pairs a CRDT document with a sync engine for transport and storage.

Published framework numbers (2026 vendor comparison, so treat them as a shape, not a promise):

```
  Yjs                              Automerge v2
  ───                              ────────────
  load a 50K-op document ~40 ms    ~80–120 ms
  memory ≈ 2x raw text             ≈ 3–5x, history kept by default
  ~10K ops/s per document          ~3–5K ops/s per document
  compaction aggressive            full history by default (a feature
                                   for version-controlled documents)
```

Four properties of CRDTs are easy to miss, and each one has a bill attached:

- **The bill arrives as metadata.** A CRDT converges only because it keeps enough history to merge with any future replica. Deleted items stay as **tombstones**. A G-Counter keeps one slot per replica that ever wrote. A 1,000-character document edited hard can hold roughly 50,000 tombstones. That figure comes from published CRDT measurements, not from your box.
- **Garbage collection needs coordination.** A tombstone may go only after every replica acknowledges the delete. The one thing a CRDT avoids — coordination — comes back for cleanup. Until then, the replica keeps paying.
- **Merge cannot enforce a global invariant.** Merge asks "both edits are valid, how do I keep both?". An invariant asks "only one of these edits is valid".
- **Presence and cursors are not the same thing.** Awareness data (who is online, where the cursor sits) belongs outside the CRDT. It is ephemeral and it must expire.

```
CRDT MERGE  vs  GLOBAL INVARIANT — the job a CRDT cannot do
═════════════════════════════════════════════════════════════

  example: a unique username
    replica A claims "kyomel"        replica B claims "kyomel"
             │                                 │
             └───────────── merge ─────────────┘
                              │
                              ▼
            both claims survive locally
            → two rows hold one name
            → the UNIQUE index fails at write time, or one user
              is silently renamed later

  rule of thumb:
    counters, sets, text, presence, drafts, offline queues → CRDT fits
    balances, unique keys, stock, quotas, payments          → server decides
```

Use a CRDT when replicas must accept writes while the network is bad, and when a lost edit costs more than extra metadata. Skip it when every write must pass one rule (money, stock, unique names), or when one central database is fast enough.

### Example:

Kyomel's **fasting-bot** takes fasting logs from WhatsApp and keeps a leaderboard on one VPS with **1 vCPU and 1 GB RAM**. The bot is small. The network around it is not reliable.

Two normal WhatsApp behaviours break a naive counter:

1. **Webhook retry.** WhatsApp re-sends a webhook event when it does not receive the 200 response in time. The same "fast done" event arrives twice.
2. **Late delivery.** A user turns airplane mode on during a flight or a bad signal, logs "sahur" at 04:30, and the message reaches the bot at 07:12 — after the "buka" message at 06:00.

Neither behaviour is a bug. Both are how the network works. The storage design must absorb them.

```
A FASTING BOT WITHOUT CRDT — one replay, one late message, two wrong numbers
════════════════════════════════════════════════════════════════════════════════

  clock      what arrives at the bot                    row in the database
  ────────────────────────────────────────────────────────────────────────────
  04:00      (user A: airplane mode, offline)            user A {
                                                            status: "fasting"
                                                            hours:  0
                                                          }
  05:10      webhook "fasting done" (attempt 1)
             → UPDATE hours = hours + 14                 hours: 14
  05:13      webhook TIMEOUT, WhatsApp retries
             same message, same event id
             → UPDATE hours = hours + 14                 hours: 28   ◄── WRONG
  06:00      user B logs normally                        user B { hours: 12 }
  07:12      user A lands, 04:30 "sahur" finally arrives
             → UPDATE status = "sahur", hours = 0        A hours: 0  ◄── LOST
                                                            the 14 credited
                                                            hours are gone

  ────────────────────────────────────────────────────────────────────────────
  two silent failures, no error line in any log:
    • replay     → a counter is not idempotent by itself
    • late write → a whole-row overwrite erases newer data
  the leaderboard still renders. it is simply wrong.
```

The same two behaviours against a CRDT-backed log:

```text
THE SAME TWO EVENTS WITH A CRDT — replay and late arrival are absorbed
══════════════════════════════════════════════════════════════════════════════

  user A holds an offline log. The bot holds its own copy.
  Every event carries a stable ID: (user, session, event kind, timestamp)

  ┌─────────────────────────────┐         ┌───────────────────────────────┐
  │ phone A  (offline replica)  │         │ bot      (server replica)     │
  │                             │         │                               │
  │ events: {e-sahur-0430,      │         │ events: {e-fast-0510,         │
  │          e-buka-0600}       │         │          e-buka-0610}         │
  │  (an OR-Set — adds do not   │         │  (an OR-Set)                  │
  │   overwrite each other)     │         │                               │
  └──────────────┬──────────────┘         └───────────────┬───────────────┘
                 │                                        │
                 │  signal returns, phone syncs           │
                 ▼                                        ▼
            ┌──────────────── MERGE (union of event IDs) ────────────────┐
            │  {e-sahur-0430, e-fast-0510, e-buka-0600, e-buka-0610}     │
            │  a replayed webhook adds an ID that is ALREADY a member    │
            │  → the set does not change           (idempotent)          │
            └────────────────────────────┬───────────────────────────────┘
                                         ▼
                     fasting hours are DERIVED from the set, not stored
                     ┌──────────────────────────────────────────────┐
                     │ derived view:                                │
                     │   day - 1   sahur 04:30 → buka 06:00  = 90 m │
                     │   streak   1 day  (both events present)      │
                     │ no counter to double, no row to overwrite    │
                     └──────────────────────────────────────────────┘
```

The derived view is the key move. The bot stores **facts** (events), and it computes **numbers** (hours, streak, rank) from those facts. A replayed fact changes nothing, because a set treats a second identical add as a no-op. A late fact needs no repair job, because it merges into the same set. Only the derived view changes, and it changes on the next read.

The three rules that carry over to any bot like this:

- **Make the event ID stable.** A hash of `(sender, message id, event kind)` works. Always use the sender's message ID, never the arrival time.
- **Store facts, derive numbers.** Counters and streaks are views. They never accept a direct write.
- **Keep the leaderboard in one place.** The leaderboard is a ranking over all users, so it is a global view. It has no business being a replicated CRDT. Compute it on the server from the merged facts.

```sql
-- The idempotency rule, in one line of schema.
-- A replayed webhook hits this constraint and changes nothing.
CREATE TABLE fasting_events (
  event_id   TEXT PRIMARY KEY,   -- (sender, wa_message_id, kind)
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,      -- 'sahur' | 'buka' | 'water' | 'dry'
  event_time INTEGER NOT NULL    -- time from the message, not from the server
);
```

The honest limits of that design on a 1 vCPU box:

- **The `fasting_events` table grows forever.** A tombstone-free event log is cheap per row, but it never shrinks. Add a monthly rollup: keep raw events for 90 days, keep the derived daily totals for years.
- **An event log cannot enforce "one fast per day".** Two machines may both log a start. The rule "one fast per day" is a global invariant, so one server must decide it. The CRDT part removes duplicate loss. It does not remove the rule.
- **Two devices owned by one user is the real test.** If Kyomel later adds a phone app beside the bot, the same user writes from two replicas. Then the merge matters, and the event ID must include the device, not only the WhatsApp sender.

A CRDT replaces coordination with algebra. The return is real: replicas accept writes during a bad network, replays and late messages are harmless, and no leader has to be elected. The price is also real, and it lands in three places — extra metadata that needs garbage collection, weak reads that may lag, and invariants that need a server decision anyway. Choose the CRDT for the part of the data that tolerates all three. Keep one server-owned path for the part that does not.
