---
title: "Semaphore"
termSlug: "semaphore"
year: 2026
month: 11
monthName: "November"
day: 20
order: 15
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "A Semaphore is a synchronization tool. It controls access to a shared resource in concurrent programs. A semaphore stores an integer counter. Threads change this counter with two atomic operations."
---
### Definition:
A Semaphore is a synchronization tool. It controls access to a shared resource in concurrent programs. A semaphore stores an integer counter. Threads change this counter with two atomic operations.

- `wait` (also called `P` or `acquire`): decrease the counter by 1. If the counter becomes negative, the thread blocks and waits.
- `signal` (also called `V` or `release`): increase the counter by 1. If blocked threads exist, the system wakes one thread.

A binary semaphore uses values 0 and 1. It works like a lock for one resource. A counting semaphore uses a larger value. It allows up to N threads to use N resource units at the same time.

```text
WITHOUT SEMAPHORE (UNCONTROLLED ACCESS)
  Shared resource: DB connection pool (max 2)

  Thread A --------+
                   +--> uses connection 1
  Thread B --------+--> uses connection 2
                   +--> opens connection 3  (limit exceeded)
  Thread C --------+--> opens connection 4  (limit exceeded)

  Result: pool overload, timeouts, unstable behavior

WITH COUNTING SEMAPHORE (CAPACITY = 2)
  counter = 2

  Thread A: wait()  -> counter = 1  -> enters (gets connection)
  Thread B: wait()  -> counter = 0  -> enters (gets connection)
  Thread C: wait()  -> counter = -1 -> BLOCKED (waits in queue)
  Thread A: signal()-> counter = 0  -> wakes Thread C
  Thread C:         -> enters (gets released connection)
  Thread B: signal()-> counter = 1
  Thread C: signal()-> counter = 2
```

Key points:
- The operations are atomic. Two threads cannot change the counter at the same time in a broken way.
- A semaphore tracks permits, not ownership. A different thread can call `signal`.
- A mutex tracks ownership. The same thread must lock and unlock it.
- A wrong order of `wait` and `signal` can cause deadlock or starvation.

### Example:
A service handles image uploads. The service can process at most 3 images at the same time. The server uses a counting semaphore with value 3.

```text
IMAGE PROCESSOR WITH SEMAPHORE (permits = 3)

  Incoming upload tasks:  T1  T2  T3  T4  T5  T6
  Semaphore counter start: 3

  TIME   EVENT                         COUNTER   RUNNING        WAITING
  ----   ----------------------------  -------   ------------   --------
  t1     T1 calls wait()               2         T1             -
  t2     T2 calls wait()               1         T1, T2         -
  t3     T3 calls wait()               0         T1, T2, T3     -
  t4     T4 calls wait()              -1         T1, T2, T3     T4
  t5     T5 calls wait()              -2         T1, T2, T3     T4, T5
  t6     T1 finishes, calls signal()  -1         T2, T3, T4     T5
  t7     T6 calls wait()              -2         T2, T3, T4     T5, T6
  t8     T2 finishes, calls signal()  -1         T3, T4, T5     T6
  t9     T3 finishes, calls signal()   0         T4, T5, T6     -
```

Flow for one task:

```text
  [Upload task arrives]
           |
           v
     semaphore.wait()
           |
     +-----+-----+
     |           |
  permit     no permit
  available  (counter < 0)
     |           |
     v           v
  [Process    [Block in
   image]      queue]
     |           |
     |<----------+  (woken by signal)
     v
  [Write result]
           |
           v
   semaphore.signal()
           |
           v
        [Done]
```

The semaphore limits concurrency to 3 tasks. The system protects CPU and memory. Extra tasks wait instead of crashing the service.
