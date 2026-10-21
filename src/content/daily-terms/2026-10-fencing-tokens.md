---
title: "Fencing Tokens"
termSlug: "fencing-tokens"
year: 2026
month: 10
monthName: "October"
day: 20
order: 14
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "A fencing token is a number that a coordination service gives to a lock holder. The number increases with every new grant. The holder sends the number with every write. The storage rejects a write..."
---
### Definition:

A **fencing token** is a number that a coordination service gives to a lock holder. The number increases with every new grant. The holder sends the number with every write. The storage rejects a write when the number is lower than the highest number it has seen.

The token answers one question. Which writer is newer? A lease answers a different question. Who owns the resource now? The two questions look the same. They are not.

A lease is a promise about time. The service says "W1 owns this resource until 09:00:30". At 09:00:31 the service may grant the resource to W2. The service cannot stop W1. A garbage collection stop, a VM live migration, a slow disk, or a network partition can freeze W1 for seconds. W1 does not know that its lease died. W1 wakes up and writes.

Martin Kleppmann named this failure in 2016, in "How to do distributed locking". His argument is short. A lock service can order clients. It cannot see a paused client. The resource must reject stale writes itself. The tool for that job is a monotonic number.

```text
WITHOUT A FENCE — the lock expires, the storage trusts the lock
═══════════════════════════════════════════════════════════════════════════

  t0  W1 acquires lease L-81 on "report/2026-10".   no token issued
  t1  W1 reads 4.1 GB, aggregates, formats the rows.
  t2  W1 pauses. the VM is live-migrated. 29 s of silence.
  t3  the lease expires at the coordination service
  t4  W2 acquires lease L-82 on the same key
  t5  W2 writes the report.             rows = 12,040   <- new data
  t6  W1 resumes. it still believes it owns the key.
  t7  W1 writes the report.             rows = 11,998   <- old data

  ┌───────────────────────────────┬──────────────────────────────────────┐
  │ WHAT THE LOCK PROMISED        │ WHAT THE STORAGE ENFORCED            │
  ├───────────────────────────────┼──────────────────────────────────────┤
  │ one writer at a time          │ nothing. last write wins             │
  │ mutual exclusion              │ no exclusion, no ordering            │
  └───────────────────────────────┴──────────────────────────────────────┘

  final state: the older, staler result. no error in any log.
  the incident report says "report numbers look wrong on the 3rd".
  nobody can reproduce it, because the pause was 29 s long, once.

WITH A FENCE — every write carries an order, the storage is the judge
═══════════════════════════════════════════════════════════════════════════

  t0  W1 acquires the key.   service returns fence = 41
  t1  W1 writes.             store: max_fence 40 -> 41.   accepted
  t2  W1 pauses for 29 s.    lease expires. W2 takes over.
  t3  W2 acquires the key.   service returns fence = 42
  t4  W2 writes.             store: max_fence 41 -> 42.   accepted
  t5  W1 resumes.            it still believes it owns the key.
  t6  W1 writes, fence = 41. store: 41 < 42.              409 stale_owner
  t7  W1 reads the error.    it stops, drops the result, logs one line.

  ┌───────────────────────────────┬──────────────────────────────────────┐
  │ WHAT THE FENCE GIVES          │ WHAT IT COSTS                        │
  ├───────────────────────────────┼──────────────────────────────────────┤
  │ ordering without clocks       │ one compare on every write           │
  │ safety against paused holders │ the resource must cooperate          │
  │ no client cooperation needed  │ a counter that must never go back    │
  └───────────────────────────────┴──────────────────────────────────────┘

  the pause still happened. the lease still expired. two owners still
  existed for 16 s. only one of them could change the data.
```

The token moves the decision. Without it, the client decides whether it may write. With it, the resource decides. That move is the whole pattern. The client is the party that can be wrong about time.

```text
TWO PLACES TO CHECK — one of them is a trap
═══════════════════════════════════════════════════════════════════════════

  CHECK AT THE CLIENT (broken)            CHECK AT THE RESOURCE (fence)
  ────────────────────────────            ────────────────────────────
  if lease.is_valid():                    PUT report/2026-10
      storage.put(body)                     fence: 41
                                          ──────────────────────────
  the lease can expire                    store.max_fence = 42
  between the check and                   if fence < max_fence:
  the put. the window is                      reject 409
  small, and the pause                    ──────────────────────────
  lands inside it.                        the compare and the write
                                          are one atomic step

  this is a time-of-check /               this is a compare-and-swap
  time-of-use gap                         on ownership order
```

A valid token has four properties. It increases strictly on every grant. Its scope is the protected resource, not the whole cluster. The resource stores it durably, next to the data it protects. Nothing resets it while an old holder may still be alive.

Where the number comes from matters less than the ordering contract.

```text
TOKEN SOURCES — pick one whose order is real
═══════════════════════════════════════════════════════════════════════════

  ┌──────────────────────┬────────────────────────────┬───────────────────┐
  │ SOURCE               │ WHAT THE NUMBER IS         │ WATCH OUT         │
  ├──────────────────────┼────────────────────────────┼───────────────────┤
  │ Google Chubby        │ sequencer on the lock      │ servers must      │
  │                      │ grant                      │ check it          │
  │ ZooKeeper            │ zxid of the ephemeral      │ zxid is cluster   │
  │                      │ sequential node            │ wide, not per key │
  │ etcd                 │ revision of the committed  │ lease ID is an    │
  │                      │ lock key                   │ identity, not a   │
  │                      │                            │ fence             │
  │ Raft                 │ term of the leader         │ one term covers   │
  │                      │                            │ many writes       │
  │ Kafka                │ producer epoch             │ broker fences the │
  │                      │                            │ zombie producer   │
  │ HDFS (QJM)           │ NameNode epoch on journal  │ old standby gets  │
  │                      │ writes                     │ rejected          │
  │ your database        │ BIGINT bumped in the same  │ use database time │
  │                      │ transaction as the lease   │ for expiry        │
  └──────────────────────┴────────────────────────────┴───────────────────┘
```

The limits are real, and they are easy to miss.

- **A fence is not a lock.** It does not stop two workers from running at the same time. It stops the older one from landing a write. You still need the lease for liveness, so work does not wait forever.
- **The resource must enforce it.** A third-party API with plain `PUT` and no conditional write cannot be fenced. In that case, use one writer per partition, or make the operation idempotent and order-insensitive.
- **The counter must survive restores.** If you restore the data from backup and the counter moves back to 39, a frozen holder with 41 wins again. Keep the counter inside the same snapshot as the data. Never keep it in a separate service.
- **The scope is the resource.** A cluster-wide counter is correct but wasteful, because unrelated keys wait on each other. A per-key counter is cheaper and needs its own durable row.
- **A token cannot protect side effects outside the resource.** Email, a payment call, a message on a topic without fencing. Guard those with an idempotency key, or move them behind the same check.
- **A deliberate epoch reset is a fencing failure.** A forced unlock that restarts numbering silently reopens the window, and no metric shows it.

### Example:

**A nightly report publisher meets its own zombie. The object store refuses the stale write, and the incident lasts one log line.**

The service aggregates daily numbers. Two workers compete for the key `report/2026-10`. The lease lives in etcd with a 30 s TTL. The object store keeps one metadata field, `max_fence`, next to the object body.

```text
ONE NIGHT, THREE CLOCKS
═══════════════════════════════════════════════════════════════════════════

  wall clock   W1 (zombie)              etcd lease           W2 (new owner)
  ──────────   ──────────────────────   ──────────────────   ──────────────
  02:00:00     acquire, fence 41        grant, ttl 30 s      idle
  02:00:12     read 4.1 GB from S3      keepalive ack        idle
  02:00:18     GC stop begins           key still alive      idle
  02:00:30     frozen                   ttl reaches zero     idle
  02:00:31     frozen                   key deleted          acquire
  02:00:32     frozen                   grant, fence 42      read 4.1 GB
  02:00:40     frozen                   key fresh            write rows 12,040
                                                              store: 41 -> 42
  02:00:47     wakes, writes 11,998     key fresh            done
               store: max_fence = 42
               ◄── 409 stale_owner      no bytes written
  02:00:47     drops result, logs, exits

  ┌───────────────────────────────────────────────────────────────────────┐
  │ 16 s of overlap. two live processes. one accepted write.             │
  │ the overlap is not a bug. the second accepted write would be.        │
  └───────────────────────────────────────────────────────────────────────┘
```

The check is ten lines, and it belongs on the storage side, inside one transaction.

```python
class StaleOwner(Exception):
    pass

def put_report(key: str, body: bytes, fence: int) -> None:
    with store.transaction(key) as tx:          # atomic read + write
        seen = tx.meta.get("max_fence", 0)
        if fence < seen:
            raise StaleOwner(f"fence {fence} < {seen}")
        tx.meta["max_fence"] = fence
        tx.body = body
```

The worker does not retry a `409 stale_owner`. A retry with the same number fails again. A retry with a new number would need a new lease, and the worker no longer holds one.

```python
def publish(fence: int, body: bytes) -> None:
    try:
        put_report("report/2026-10", body, fence)
    except StaleOwner:
        metrics.inc("stale_owner_rejected")
        log.warning("lease lost during publish", extra={"fence": fence})
        return                                   # drop the work, do not retry
```

Read the same night without the fence, to see what the check buys.

```text
SAME NIGHT, TOKEN REMOVED — one line of code, one silent corruption
═══════════════════════════════════════════════════════════════════════════

  BEFORE  put_report(key, body, fence)    AFTER  put_report(key, body)
  ────────────────────────────────────    ────────────────────────────
  02:00:40  W2 writes 12,040              02:00:40  W2 writes 12,040
  02:00:47  W1 rejected                   02:00:47  W1 writes 11,998
  promise kept                            promise broken

  the dashboard shows a 0.35 % drop for one day.
  the drop is not in the source data. it is in the report.
  the next run overwrites it, so the bug erases its own evidence.

  ┌────────────────────────────┬──────────────────────────────────────────┐
  │ WITH FENCE                 │ WITHOUT FENCE                            │
  ├────────────────────────────┼──────────────────────────────────────────┤
  │ stale write rejected       │ stale write accepted                     │
  │ error is visible           │ data is quietly wrong                    │
  │ failure is loud, once      │ failure is silent, recurring             │
  └────────────────────────────┴──────────────────────────────────────────┘
```

The same shape protects other resources. A Kafka producer with an old epoch is fenced by the broker, so a zombie cannot append to a partition. An HDFS standby with an old epoch is fenced by the journal, so two NameNodes cannot write edits. A database row lease bumps `fence` in the same transaction that grants ownership, so a stale worker cannot update the row.

The pattern also shows the boundary of the fix. The token protects the object store. It does not protect the Slack message that W1 sent at 02:00:19, and it does not protect the webhook that fired before the pause. Those side effects need their own key, or they need to happen after the accepted write.

The punchline: a lease tells you who should write, and a fencing token tells the storage who may still write. Only the second one survives a pause, because only the storage sees both attempts. Add the token when the resource can compare numbers. If the resource cannot compare, do not call the lock safe.
