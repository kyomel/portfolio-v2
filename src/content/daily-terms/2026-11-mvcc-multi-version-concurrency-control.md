---
title: "MVCC (Multi-Version Concurrency Control)"
termSlug: "mvcc-multi-version-concurrency-control"
year: 2026
month: 11
monthName: "November"
day: 17
order: 12
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "MVCC (Multi-Version Concurrency Control) keeps several versions of each row in the database. A write does not overwrite the old row. The write creates a new row version. A reader picks one snapshot..."
---
### Definition:

**MVCC (Multi-Version Concurrency Control)** keeps several versions of each row
in the database. A write does not overwrite the old row. The write creates a new
row version. A reader picks one snapshot of the table and reads only the
versions that were committed when the snapshot started. Readers take no read
locks. Writers take no locks from readers. The core promise: **a reader never
waits for a writer, and a writer never waits for a reader.**

```text
WITHOUT MVCC — one version, locks decide      WITH MVCC — many versions, snapshots decide
════════════════════════════════════════      ════════════════════════════════════════════

  T1  SELECT balance FROM accounts            T1  BEGIN; SELECT ...;
      holds a READ LOCK                           snapshot fixed at T1 start
          │                                       │
          ▼                                       ▼
  T2  UPDATE accounts SET ...                     row versions on disk
      wants the WRITE LOCK                    ┌─────────────────────────────────────┐
      └──► BLOCKED, waits for T1              │ v1  balance=100   xmin=100 (T50)    │
  T1  slow query, 3 seconds                   │ v2  balance=120   xmin=101 (T51)    │
      T2 waits 3 seconds                      │ v3  balance=90    xmin=105 (T58)    │
  T3  UPDATE the same row                     └─────────────────────────────────────┘
      └──► also blocked, queue grows              T1 (snapshot at T57) sees v2 only
                                                  T2 (snapshot at T60) sees v1..v3
  result: one slow read stalls every write        neither one waits for anyone
  lock table is the bottleneck
  deadlock: T1 holds A, wants B
           T2 holds B, wants A
```

**Visibility is a pure function of the snapshot.** Each row version stores two
transaction ids: `xmin` (who created it) and `xmax` (who deleted or superseded
it). The reader runs three checks per version, and the answers never change
mid-query.

```text
IS THIS ROW VERSION VISIBLE TO ME?
──────────────────────────────────────────────────────────────────────
  my snapshot = list of txids committed at the moment I started

  for each row version (xmin = writer, xmax = remover):
    1.  xmin committed before my snapshot?      no  -> version not born yet
    2.  xmax committed before my snapshot?      yes -> version already gone
    3.  xmin rolled back?                       yes -> never existed for me
  all three checks pass                             -> row IS visible to me

  same query, same snapshot, same answer, every time
  a version that is invisible now stays invisible until I commit
```

**One snapshot rule per isolation level.** The level decides when a new
snapshot is taken. Each row below names the anomaly that is still open
at that level.

```text
ISOLATION LEVEL                WHEN THE SNAPSHOT STARTS             ANOMALY STILL OPEN
─────────────────────────────  ───────────────────────────────────  ──────────────────────────
Read Committed (PG default)    a new snapshot per STATEMENT         non-repeatable read:
                               each statement sees the newest       one query, two answers
                               committed state
Repeatable Read                one snapshot for the whole TX        write skew (usually)
                               = Snapshot Isolation
Serializable (PG)              PG SSI watches read-write            none in the ANSI book,
                               conflicts and aborts one             paid with aborts and
                               risky tx                             heavier bookkeeping
```

**MVCC is one goal, several engines.** PostgreSQL stores `xmin`/`xmax` inside
each tuple and reclaims space with VACUUM. MySQL InnoDB builds a "read view"
and rewrites old versions out of the table with its purge thread and undo log.
Oracle reads from undo segments. Same promise, three garbage collectors. The
names differ in your runbook: `autovacuum` in PostgreSQL, the purge thread in
InnoDB, undo retention in Oracle.

**The bill arrives as space and as cleanup work.** Every UPDATE is an INSERT of
a new version. Every DELETE only marks the old version dead. Dead versions live
until something reclaims them.

```text
THE LEDGER — what MVCC buys and what it costs
┌──────────────────────────────────────┬────────────────────────────────────────┐
│ GETS                                 │ PAYS                                   │
├──────────────────────────────────────┼────────────────────────────────────────┤
│ reads never block writes             │ every UPDATE writes a whole new row    │
│ a 10-minute report runs on live      │ dead rows and their index entries      │
│  OLTP data with no second copy       │ stay on disk until VACUUM marks them   │
│ rollback is cheap: fall back to      │ cleanup burns IO: if it lags, the      │
│  the previous version                │ table grows without a limit            │
│ no lock table to tune, no lock       │ a long-running tx pins every version   │
│  escalation deadlocks                │ born after its snapshot                │
│ MVCC makes long reads possible       │ the cleanup job is now production      │
│  without a replica                   │ infrastructure you must watch          │
└──────────────────────────────────────┴────────────────────────────────────────┘
```

**One public load test shows the shape of the bill.** A PostgreSQL load lab ran
3,049,253 updates against two identical 200,000-row tables. One table kept
autovacuum on. One table had autovacuum disabled.

```text
SAME LOAD, TWO SETTINGS — 3,049,253 updates, 200,000 live rows
══════════════════════════════════════════════════════════════════════════════

                              autovacuum ON          autovacuum OFF
  ──────────────────────────  ─────────────────      ─────────────────
  vacuum runs during load     102                    0
  peak dead tuples            30,347                 3,049,252
  heap size                   40 MiB                 93 MiB
  index size                  33 MiB                 78 MiB
  total allocated             73 MiB                 171 MiB      2.34x
  ─────────────────────────────────────────────────────────────────────
  sawtooth: dead tuples climb, vacuum reclaims, climb again
  flat line: dead tuples only climb, the file only grows

  VACUUM FULL after the damage: 171 MiB -> 28 MiB.
  It rewrites the whole table and holds an ACCESS EXCLUSIVE lock.
  Use it as a repair, not as routine maintenance.
```

Space is the visible symptom. The invisible one is scan cost: a sequential scan
still reads dead rows off disk before skipping them, and index entries still
point at them. A table that is 37% dead pays that tax on every full scan. A
simple health query, worth memorising:

```sql
SELECT schemaname || '.' || relname AS table_name,
       n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 1) AS dead_pct,
       last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC
LIMIT 15;
```

**One more constraint: transaction ids are a finite resource.** PostgreSQL
xids are 32-bit. Vacuum must "freeze" versions that no snapshot can need any
more, or the id space wraps and old data would look alive again. When vacuum
falls too far behind, PostgreSQL refuses writes to protect the data. An
unattended vacuum job is therefore not a performance setting. It is data
protection.

**The hole that no snapshot level closes by default: write skew.** Two
transactions read overlapping rows, each writes a different row that the other
only read, and both commit. There is no write-write conflict, so snapshot
isolation sees nothing to stop.

```text
WRITE SKEW — the anomaly snapshot isolation misses
══════════════════════════════════════════════════════════════════════════════

  invariant: at least 1 of 2 staff stays on duty.  both are on duty now.

  T1                                        T2
  read staff -> {ann, bob} = 2 on           read staff -> {ann, bob} = 2 on
  ann goes on break                         bob goes on break
  (UPDATE row ann)                          (UPDATE row bob)
  COMMIT                                    COMMIT

  write-write conflict?   none. T1 wrote ann, T2 wrote bob.
  snapshot isolation:     both commit, no error, no wait.
  final state:            0 staff on duty.
  the invariant is gone and no lock was ever contested.
```

Three fixes, in the order teams usually adopt them:

1. Serialize the read: lock the row you read yourself with
   `SELECT ... FROM staff WHERE day = ... FOR UPDATE;` in both transactions.
2. Run that short transaction at `SERIALIZABLE` and retry the abort.
3. Move the invariant into one row or one constraint, so the engine's
   write-write detection does the work for you.

**What MVCC does not replace.**

```text
MVCC HANDLES                            MVCC DOES NOT HANDLE
──────────────────────────────────────  ──────────────────────────────────────────
reader vs writer contention             writer vs writer on the SAME row
                                        (first committer wins, second gets a
                                        serialization error or waits)
long reads on live data                 cross-row invariants (write skew)
disk hygiene for dead versions          query plans and indexes
rollback of one transaction             business rules that live in app code
                                        your backup, your replica lag, your
                                        vacuum alerts
```

### Example:

A shop runs PostgreSQL. The `orders` table holds 890,000 rows. Three payment
workers update the same hot rows all day: `UPDATE orders SET status='settled'
WHERE id = ...`, about 50 updates per second. Autovacuum runs, and the dead
tuples rise and fall in a sawtooth. Nobody thinks about MVCC that week.

```text
MONDAY — steady state, MVCC doing its job
══════════════════════════════════════════════════════════════════════════════

  workers ──► 50 UPDATE/s ──► each UPDATE = one new version of the row
                               old version marked dead, not deleted

  dead tuples
  (thousands)
       40 ┤      ╱╲        ╱╲        ╱╲
       30 ┤     ╱  ╲      ╱  ╲      ╱  ╲      autovacuum: 6 runs/hour
       20 ┤    ╱    ╲    ╱    ╲    ╱    ╲     heap file: stable at 410 MiB
       10 ┤   ╱      ╲  ╱      ╲  ╱      ╲    seq scan on orders: 180 ms
        0 ┤──╱────────╲╱────────╲╱────────╲──
          └──────────────────────────────────► time
             space gets reused, the file stops growing
```

Tuesday, an analyst opens one transaction and runs a report that takes 40
minutes inside it: `BEGIN; SELECT ...; /* 40 minutes of ad-hoc queries */`.
That snapshot pins every version born after it started. Vacuum may not remove
them. The sawtooth stops falling.

```text
TUESDAY — one long transaction changes the whole curve
══════════════════════════════════════════════════════════════════════════════

  09:00   analyst: BEGIN                    snapshot S pinned
  09:04   workers keep updating             versions keep being born after S
  09:40   analyst finally commits           (40 min of pinned versions)

  dead tuples
  (thousands)
  1500 ┤                                    ╱
  1200 ┤                                  ╱     n_dead_tup: 1.47M
   900 ┤                                ╱      heap: 410 MiB -> 1.6 GiB
   600 ┤                             ╱         index: 90 MiB -> 380 MiB
   300 ┤           ╱╲            ╱             seq scan: 180 ms -> 900 ms
     0 ┤──╱───────╱──╲────────╱──────────
        └──────────────────────────────────► time
             ▲                ▲
             │                └── vacuum runs but cannot reclaim: version
             │                    may still be visible to snapshot S
             └── Wednesday 02:00, disk alert at 82%
```

The team reads three signals, in this order: `n_dead_tup` in
`pg_stat_user_tables`, the age of the oldest transaction, and heap file size.
They fix the causes, not the symptom.

```text
FIX LADDER — order matters
────────────────────────────────────────────────────────────────────────────
  1.  end the long pattern of work:
      BI reads move to a read replica, or the report runs as separate
      short statements instead of one transaction
      effect: versions become reclaimable again
  2.  tune vacuum for the hot table only:
      ALTER TABLE orders SET (
        autovacuum_vacuum_scale_factor = 0.01,
        autovacuum_vacuum_cost_limit   = 2000
      );
      effect: vacuum keeps up with 50 updates/s
  3.  alert on cause, not on status:
      dead_pct > 20% sustained for 15 min    -> page
      oldest_tx > 5 min on the write path    -> page
      disk > 75%                             -> warn
      effect: the next 40-minute transaction is caught at minute 5
  4.  repair only if already bloated:
      VACUUM FULL in a window, or pg_repack online
      effect: 1.6 GiB back to ~420 MiB, planned, not emergent
────────────────────────────────────────────────────────────────────────────
  step 4 without steps 1-2 buys a week. The table blooms again.
```

Then the second incident, one week later, and it has nothing to do with
space. The shop rule: at least one supervisor stays on duty. Two supervisors
are on duty. Both clock out in the same second, from two application servers.

```text
WEDNESDAY, WEEK 2 — write skew on the supervisors table
══════════════════════════════════════════════════════════════════════════════

  app server A                              app server B
  BEGIN                                     BEGIN
  SELECT count(*) FROM supervisors          SELECT count(*) FROM supervisors
    WHERE on_duty = true   -> 2                 WHERE on_duty = true   -> 2
  check: 2 - 1 >= 1  -> allowed             check: 2 - 1 >= 1  -> allowed
  UPDATE supervisors                        UPDATE supervisors
    SET on_duty = false                         SET on_duty = false
    WHERE name = 'andi'                         WHERE name = 'budi'
  COMMIT                                    COMMIT
       │                                           │
       └───────────► no conflict: different rows, snapshot sees no overlap
                     final: on_duty = 0, rule broken, no error anywhere

  the app logged two successful clock-outs. the store had zero supervisors.
```

The fix puts the read and the write on the same lock, so the second
transaction must wait and re-read.

```text
BEFORE                                AFTER
──────────────────────────────        ──────────────────────────────────────
BEGIN                                 BEGIN
SELECT count(*) ...                   SELECT * FROM supervisors
  -- count as plain read                WHERE day = CURRENT_DATE
UPDATE ... name='andi'                  FOR UPDATE;         -- takes row lock
COMMIT                                -- count the locked rows
                                      UPDATE ... name='andi'
                                      COMMIT               -- lock released
```

With `FOR UPDATE`, server B blocks at the read, and after server A commits, B
re-reads `count = 1`, fails its own check, and refuses the checkout. The
invariant lives in a lock the database already understands.

What this scenario does not claim. The load-test figures come from one public
PostgreSQL lab run, not from a benchmark of your tables. Your update rate,
row width, index count, and transaction length move the numbers. Postgres 17+
improved vacuum parallelism and `VACUUM` cost settings, so current versions
hold the sawtooth better than older ones. MySQL and Oracle teams pay the same
bill in different currency: purge lag and undo tablespace growth instead of
dead tuples. Measure your own dead-row curve before you tune anything.

The punchline: MVCC buys unlimited readers and writers at once by refusing to
have only one version of a row. That is the whole trick, and the whole bill.
Every old version is a promise to a snapshot somewhere. Keep the promises short
(one statement, or one short transaction), give cleanup the resources to run,
and watch the age of your oldest transaction. When write-write conflicts are
not enough to protect an invariant, add a lock the engine already owns
instead of trusting the snapshot to notice.
