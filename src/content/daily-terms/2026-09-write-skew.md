---
title: "Write Skew"
termSlug: "write-skew"
year: 2026
month: 9
monthName: "September"
day: 30
order: 22
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Write skew is a serialization anomaly. Two concurrent transactions read the same set of rows. Each transaction makes a decision from that read. Then each transaction writes a different row. The wri..."
---
### Definition:

Write skew is a serialization anomaly. Two concurrent transactions read the same set of rows. Each transaction makes a decision from that read. Then each transaction writes a **different** row. The writers never touch the same row. Both transactions commit. The rule that both transactions checked is broken.

The name describes the picture. One transaction skews the state that the other transaction depends on. The shared item is not a row. The shared item is the **decision**.

Snapshot Isolation (SI) cannot block this case. SI enforces one rule only: **first committer wins on the same row**. When two transactions write the same row, the second one is rolled back with `could not serialize access due to concurrent update` (SQLSTATE `40001`). Write skew writes two different rows, so the write-write check finds no conflict. Nothing blocks. Both transactions commit.

The broken link is a **read-write anti-dependency**. Transaction 1 writes a row that transaction 2 had read for its decision. SI compares writes against writes. SI does not compare a write against someone else's read.

Berenson and co-authors named the anomaly in 1995, in *A Critique of ANSI SQL Isolation Levels*. That paper also defined snapshot isolation and showed that its "repeatable read" does not prevent this case. Adya's formal model calls the same case **G2** and **G2-item**.

```text
LOST UPDATE vs WRITE SKEW — the isolation check only compares rows:
═══════════════════════════════════════════════════════════════════════════

  LOST UPDATE — both transactions write the SAME row
  ───────────────────────────────────────────────────

    T1 ──read──► decide ──write──►┌───────────┐
                                  │   ROW X   │
    T2 ──read──► decide ──write──►└───────────┘
                                        ▲
               SI rule: FIRST COMMITTER WINS
               the second writer is ROLLED BACK (error 40001)
               => the anomaly is BLOCKED

  WRITE SKEW — each transaction writes its OWN row
  ─────────────────────────────────────────────────

    T1 ──read {X, Y}──► decide ──write──►┌───────────┐
                                         │   ROW X   │
                                         └───────────┘
    T2 ──read {X, Y}──► decide ──write──►┌───────────┐
                                         │   ROW Y   │
                                         └───────────┘
                                        ▲
               SI check: "did someone write the row I am writing?"
               -> rows do not overlap -> BOTH COMMIT
               => the invariant is BROKEN, and no error is raised

  ┌────────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: the damage travels on a READ, not on a shared row.      │
  │  T1 writes the data that T2 read for its decision. SI compares     │
  │  writes only, so this link stays invisible.                        │
  └────────────────────────────────────────────────────────────────────┘
```

The canonical example is the hospital on-call rule. The rule says: at least one doctor stays on call. Alice and Bob are both on call. Each one checks "are there two doctors on call?" Each one sees two. Each one then goes off call, and each one writes only its own row. Under snapshot isolation both updates commit, and the hospital is left with zero doctors on call.

Only one isolation level prevents write skew: **SERIALIZABLE**. PostgreSQL implements it with Serializable Snapshot Isolation (SSI, version 9.1 and later). SSI does not track the full graph. It uses a theorem: every non-serializable SI history contains two adjacent read-write anti-dependencies, a "dangerous structure".

```text
THE SHAPE SSI HUNTS FOR — two adjacent rw anti-dependencies:
═══════════════════════════════════════════════════════════════════════════

    T1 ──rw──► T2 ──rw──► T3
                ▲
                └─ pivot. T3 is the first transaction to commit.
                   T1 and T3 can be the SAME transaction,
                   which is the two-transaction write skew case.

    plain SI     : no write-write edge exists -> both commit
    SERIALIZABLE : the pair of rw edges is a "dangerous structure"
                   -> one participant is aborted -> the client retries

  WHO PREVENTS IT
  ┌──────────────────────┬──────────────────────────────────────────────┐
  │ PostgreSQL           │ SSI since 9.1 (2011). Records reads as       │
  │ SERIALIZABLE         │ predicate locks (SIReadLock). The locks do   │
  │                      │ not block writers. It aborts at COMMIT with  │
  │                      │ 40001 and asks the client to retry.          │
  │ MySQL InnoDB         │ Reads become shared locks. The two           │
  │ SERIALIZABLE         │ transactions deadlock, and one gets 1213.    │
  │ CockroachDB, Spanner │ SERIALIZABLE is the only level. The          │
  │ YugabyteDB           │ application must retry the transaction.      │
  └──────────────────────┴──────────────────────────────────────────────┘
```

The honest limits of the fix:

- **SSI is conservative.** It rejects some histories that are in fact serializable. A retry rate above zero is normal, not a bug. Measure the `40001` rate under a realistic load.
- **Retry the whole transaction.** Not the failed statement. Move the failed statement to the start of a fresh transaction, with fresh reads.
- **Not every failure is `40001`.** A serializable transaction can also fail on a constraint, for example a unique violation (`23505`). Route the retry on SQLSTATE and on the operation, not on one error code.
- **All participants must use SERIALIZABLE.** One weak-isolation writer can break the invariant alone. The guarantee covers only the transactions that ask for it.
- **Read-only transactions can also be aborted.** A read-only transaction can observe a state that no serial order can produce. PostgreSQL aborts it on "conflict out to pivot".
- **Below SERIALIZABLE the only fix is a visible conflict.** You either raise the isolation level, or you force a conflict that the current level can see. There is no third option.

### Example:

"BankKu" is a digital cooperative. Each customer gets one overdraft facility, split into two sub-accounts: `utama` (ATM card) and `cadangan` (online). The risk policy is one line: **the combined balance of the two sub-accounts must never go below 0**. Spending is allowed per sub-account, because only the combined number is guarded.

Rina keeps Rp 300.000 in each sub-account. Her combined balance is Rp 600.000. At 20:14 two requests arrive at almost the same time: Rp 400.000 from the ATM, and Rp 400.000 from the online app. The service runs the check inside the transaction, and the isolation level is PostgreSQL's default `READ COMMITTED` with an application-level snapshot read.

```text
THE INVARIANT DIES SILENTLY
═══════════════════════════════════════════════════════════════════════════

  DATA   utama = Rp 300.000   cadangan = Rp 300.000   combined = Rp 600.000
  POLICY combined balance >= 0        each request takes Rp 400.000

  ┌─ TRANSACTION 1 — ATM ─────────────────────────────────────────────┐
  │  SELECT SUM(balance) FROM sub_accounts                            │
  │    WHERE customer_id = 42;                                        │
  │       -> Rp 600.000   >= Rp 400.000   risk check PASSES           │
  │  UPDATE sub_accounts SET balance = balance - 400000               │
  │    WHERE sub_account_id = 'utama';      <- ROW A                  │
  └──────────────────────────────┬────────────────────────────────────┘
  ┌─ TRANSACTION 2 — online app, same instant ───────────────────────┐
  │  SELECT SUM(balance) ... same rows ...                            │
  │       -> Rp 600.000   >= Rp 400.000   risk check PASSES           │
  │  UPDATE sub_accounts SET balance = balance - 400000               │
  │    WHERE sub_account_id = 'cadangan';   <- ROW B, NOT row A       │
  └──────────────────────────────┬────────────────────────────────────┘
                                 ▼
        the two writers never touch the same row
        -> the write-write check has nothing to compare
        -> BOTH TRANSACTIONS COMMIT

  AFTER:  utama = -Rp 100.000   cadangan = -Rp 100.000
          combined = -Rp 200.000

  In a serial order this result is impossible. Request 1 leaves
  Rp 200.000 combined. Request 2 then needs Rp 400.000 and must fail.
  Under concurrency the policy is broken by Rp 200.000, and no
  error is raised anywhere in the logs.
```

Note what the two transactions did *not* share. They shared the read of the combined balance. They did not share a written row. Only the read is common, and snapshot isolation gives each transaction its own private read.

Two fixes work. Both make the conflict visible to the database.

```
FIX A — SERIALIZABLE, and let SSI detect the shape
──────────────────────────────────────────────────

  BEGIN ISOLATION LEVEL SERIALIZABLE;
    SELECT SUM(balance) ... ;   <- recorded as an rw anti-dependency
    UPDATE sub_accounts ... ;
  COMMIT;                       <- one transaction commits

  the loser: ERROR 40001  could not serialize access
             due to read/write dependencies among transactions
             HINT: The transaction might succeed if retried.

  client: roll back, retry the whole transaction, fresh reads.
  the second attempt reads combined = Rp 200.000 -> rejects the request
  -> the customer keeps a correct balance, one request is refused

FIX B — keep the isolation level, force a conflict the level can see
──────────────────────────────────────────────────────────────────

  BEGIN;
    SELECT balance FROM sub_accounts
      WHERE customer_id = 42
      FOR UPDATE;               <- locks BOTH sub-account rows
    ... check the sum ...
    UPDATE sub_accounts SET balance = balance - 400000
      WHERE sub_account_id = 'utama';
  COMMIT;

  T2 blocks on the row lock
     -> READ COMMITTED: T2 re-reads the fresh values after the lock
        -> combined = Rp 200.000 -> rejects the request cleanly
     -> REPEATABLE READ: T2 fails with 40001 and retries

  the decision and the write now depend on the SAME locked rows,
  so one of the two transactions must wait. The gap is closed.
```

For this shape of invariant, one more rule saves real money: do not let the guarded rows float. Lock a row the decision truly depends on, or move the guarded number into a single row that every writer updates. When both requests decrement the same facility row, the write-write conflict appears, and even plain snapshot isolation catches it.

Finding write skew in a running codebase is a search for one shape: a read of **more than one row** (or an aggregate) whose result gates a write, inside one transaction.

```
THE GREP LIST — patterns that carry write skew
═══════════════════════════════════════════════════════════════════════════
  SELECT COUNT(*) ...  THEN  INSERT or UPDATE    "only N of these allowed"
  SELECT SUM(x)    ...  THEN  UPDATE             "the total must stay under"
  SELECT COUNT(*)  ...  THEN  DELETE or UPDATE   "at least one must remain"
  CHECK a role, a quota, a seat count, a limit   then write a DIFFERENT row
  a foreign-key-like rule checked in the app     then insert the child row
```

The punchline: snapshot isolation promises that no two writers fight over the same row. It does not promise that your invariant survives. Every multi-row rule that you check and then enforce — a quota, an overdraft, an on-call rota, an overbooking limit — is a write skew candidate the moment two transactions run at the same time. The database cannot protect a rule it cannot see, so you either ask for SERIALIZABLE and pay with retries, or you turn the invisible read-write link into a row lock the engine can honor. The one thing you cannot do is leave the rule guarded only by an application-level check and a snapshot that is already out of date.
