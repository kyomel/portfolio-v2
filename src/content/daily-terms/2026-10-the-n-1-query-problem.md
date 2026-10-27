---
title: "The N+1 Query Problem"
termSlug: "the-n-1-query-problem"
year: 2026
month: 10
monthName: "October"
day: 26
order: 18
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "The N+1 query problem is a read pattern with one query for the list and one query per list item. A page shows N parents. The code walks that list and loads the children of each parent inside the lo..."
---
### Definition:

The **N+1 query problem** is a read pattern with one query for the list and one
query per list item. A page shows N parents. The code walks that list and loads
the children of each parent inside the loop. The request sends 1 + N queries
instead of 2.

The name is arithmetic. The cause is a loop that hides a network hop. Each step
of the loop looks cheap. The step is cheap. The wait between steps is not.

Start with the shape. An ORM returns parent objects. The child rows are not in
those objects, because the database sent only the parent columns. The moment the
view reads `order.items`, the ORM sends a new query. That is lazy loading. It is
a good default for one record and a bad default for a list of records.

Three properties make this failure common and hard to see:

- **The cost is round trips, not rows.** 51 small queries are slower than 2
  large ones. The database does less work in the 51-query version, and the user
  waits longer.
- **The cost grows with page size.** N is the number of rows on the page. A team
  raises `?size=20` to `?size=50`, and the latency triples. The code did not
  change.
- **The cost grows with distance.** Move the reader to another region and every
  round trip gets longer. The naive version pays that increase N times. The
  batched version pays it twice.

The last property surprises teams during a cloud migration. Same code, same
data, new replica 4 ms away, and the endpoint goes from 51 ms to 214 ms.

```text
NAIVE vs BATCHED — same rows, different number of waits
═══════════════════════════════════════════════════════════════════════════

  NAIVE — lazy load inside the loop
  ─────────────────────────────────────────────────────────────────────────

     │ 1   SELECT orders (50 rows)       │
     ├──────────────────────────────────►│
     │◄───────────── wait 1 ─────────────┤
     │                                   │
     │ 2   SELECT items WHERE id = 1     │
     ├──────────────────────────────────►│
     │◄───────────── wait 2 ─────────────┤
     │ 3   SELECT items WHERE id = 2     │
     ├──────────────────────────────────►│
     │◄───────────── wait 3 ─────────────┤
     │ · · ·  47 more, same shape  · · · │
     │ 51  SELECT items WHERE id = 50    │
     ├──────────────────────────────────►│
     │◄──────────── wait 51 ─────────────┤

     each arrow waits for the arrow above it. nothing overlaps.
     latency = 51 x RTT. the database is idle most of that time.

  BATCHED — one query for all children
  ─────────────────────────────────────────────────────────────────────────

     │ 1   SELECT orders (50 rows)       │
     ├──────────────────────────────────►│
     │◄───────────── wait 1 ─────────────┤
     │                                   │
     │ 2   SELECT items WHERE            │
     │     order_id IN (1 ... 50)        │
     ├──────────────────────────────────►│
     │◄───────────── wait 2 ─────────────┤

     same 250 rows on the wire. latency = 2 x RTT.
     50 primary-key lookups become 1 index range scan.
```

The two shapes return the same data. Only the number of waits changes:

  ┌────────────────────────┬─────────┬─────────┐
  │ SAME PAGE, 50 PARENTS  │ NAIVE   │ BATCHED │
  ├────────────────────────┼─────────┼─────────┤
  │ queries per request    │ 51      │ 2       │
  │ serial waits           │ 51      │ 2       │
  │ time at 0.8 ms RTT     │ ~51 ms  │ ~2.4 ms │
  │ time at 4 ms RTT       │ ~214 ms │ ~9 ms   │
  │ rows sent by database  │ 250     │ 250     │
  │ grows with page size   │ linear  │ flat    │
  │ grows with DB distance │ x N     │ x 2     │
  └────────────────────────┴─────────┴─────────┘

Now the part that matters for diagnosis. The database is not the bottleneck in
the slow version. The wire is. At 0.8 ms of round trip and 0.2 ms of execution:

```text
  51 queries x 0.2 ms of database work  =  10.2 ms   <- database busy
  51 queries x 0.8 ms of waiting        =  40.8 ms   <- app blocked
  51 queries total                      =  51.0 ms

  the database is busy for 20% of the request. the request is slow anyway.
```

A profile that shows low CPU on the database, low CPU on the app, and high
latency is not a mystery. It is 51 waits. So the useful question is not "which
query is slow". The question is "how many queries did this request send".

That question has a number, and the number is the cheapest alarm you can build.
Count statements per request. Emit the count as a metric. Set a budget, for
example 8 queries per request. A page that sends 51 fails the budget in the test
suite, before a user sees it.

**Why it survives code review.** The loop is readable. The query is indexed. The
test fixture has 3 orders, so the test sends 4 queries and finishes in 4 ms. A
reviewer sees a correct model and a correct index. The defect lives in the
interaction between page size and the loader default, and no test asserts on
that interaction.

**The fix ladder.** Four rungs. Take the lowest rung that fits the shape.

  ┌───┬─────────────────────────────────┬─────────────────────────────────┐
  │ # │ FIX                             │ SHAPE IT FITS                   │
  ├───┼─────────────────────────────────┼─────────────────────────────────┤
  │ 1 │ join in the parent query        │ 1:N, small N, narrow parent     │
  │ 2 │ second query, IN list, map      │ 1:N, wide parent, big child set │
  │ 3 │ batch loader, one call per tick │ graph, nested levels            │
  │ 4 │ page size cap                   │ last line of defence            │
  └───┴─────────────────────────────────┴─────────────────────────────────┘

Rung 2 keeps rows flat. Chunk the id list at about 1000 and send one query per
chunk. Rung 3 needs a loader that collects the keys of one request tick and then
sends a single call. Both rungs cost one extra round trip.

The join is not free, and the second query is not always worse. Compare them on
the property that decides the cost: how many rows cross the wire.

```text
  JOIN — one round trip, rows multiply
    50 orders x 4 items  =  200 rows
    every order column travels 4 times (title, address, total, ...)
    good for 1:1, and for 1:N with narrow parent rows
    risky for 1:N with wide parents and long child lists

  TWO QUERIES — two round trips, rows stay flat
    50 order rows + 200 item rows  =  250 rows, each one sent once
    good for wide parents and for large child sets
    costs exactly one extra RTT
```

Both fixes need one more thing: an index on the child foreign key. Without it,
the batched query reads the whole child table, and the fix trades 50 small waits
for one long scan.

**The same shape outside the ORM.** The pattern is a loop with a network call
inside it. The name mentions queries because that is where people meet it first.

```text
  ORM lazy load      1 + N SELECT statements
  HTTP fan-out       1 + N GET calls to a service you do not own
  cache reads        1 + N GET to Redis, batch with MGET
  object storage     1 + N HEAD calls to check existence
  writes             1 + N INSERT, batch into one multi-row statement
```

The fix does not depend on the transport. Take the key list out of the loop.
Send it once. Put the results back together in memory.

### Example:

A marketplace order history endpoint. Each page shows 50 orders. Each order has
about 4 items. Peak traffic is 200 requests per second. The database sits in the
same zone, so one round trip costs 0.8 ms. The connection pool holds 8
connections.

The code loads the orders, then reads `order.items` inside the template:

```text
TRACE OF ONE REQUEST — 51 round trips, no overlap
═══════════════════════════════════════════════════════════════════════════

     │  0.0   SELECT orders              │
     ├──────────────────────────────────►│
     │◄─────────── 0.8 + 0.2 ────────────┤
     │  1.0   items WHERE order_id = 1   │
     ├──────────────────────────────────►│
     │◄─────────── 0.8 + 0.2 ────────────┤
     │  2.0   items WHERE order_id = 2   │
     ├──────────────────────────────────►│
     │◄─────────── 0.8 + 0.2 ────────────┤
     │  3.0   items WHERE order_id = 3   │
     ├──────────────────────────────────►│
     │◄─────────── 0.8 + 0.2 ────────────┤
     │  · · ·  46 more, one each  · · ·  │
     │ 50.0   items WHERE order_id = 50  │
     ├──────────────────────────────────►│
     │◄─────────── 0.8 + 0.2 ────────────┤

  wall clock   51.0 ms
  database     10.2 ms of that   (20% busy)
  wire         40.8 ms of that   (80% waiting)
```

At 200 rps and 51 ms per request, 10.2 requests are in flight on average. The
pool has 8 connections. The queue grows, the tail latency explodes, and the
database stays at 20% CPU. The trace shows p50 51 ms and p99 380 ms on the same
code path.

The fix is two queries and one map:

```python
sql = "SELECT * FROM orders WHERE user_id = %s ORDER BY id DESC LIMIT 50"

# BEFORE — 51 round trips per request
for order in db.query(sql, uid):
    order.items = db.query("SELECT * FROM items WHERE order_id = %s", order.id)

# AFTER — 2 round trips per request
orders = db.query(sql, uid)
ids = [o.id for o in orders]
rows = db.query("SELECT * FROM items WHERE order_id = ANY(%s)", (ids,))
by_order = defaultdict(list)
for row in rows:
    by_order[row.order_id].append(row)
for order in orders:
    order.items = by_order[order.id]
```

Result after deploy:

  ┌──────────────────────────┬────────────────┬──────────┐
  │ METRIC                   │ BEFORE         │ AFTER    │
  ├──────────────────────────┼────────────────┼──────────┤
  │ queries per request      │ 51             │ 2        │
  │ p50 latency              │ 51 ms          │ 2.4 ms   │
  │ p99 latency at 200 rps   │ 380 ms         │ 9 ms     │
  │ queries per second at DB │ 10,200         │ 400      │
  │ connections busy         │ 8 of 8 + queue │ 0.5 of 8 │
  │ database CPU             │ 20%            │ 9%       │
  └──────────────────────────┴────────────────┴──────────┘

The honest part. This team could also have set `size=10` and gone from 51 ms to
11 ms without touching the loader. That is a smaller page, not a fix. The next
product request adds a column, the page grows, and the endpoint falls over again
on a Friday.

**When to leave the loop alone.** If N is small and bounded, the fix adds code
for no gain. A page that always shows 3 rows costs 4 round trips, which is 4 ms.
Measure first. The budget tells you which case you have: 4 queries pass a budget
of 8, and 51 queries fail it.

The punchline: N+1 is not a slow query. It is a loop with a network hop inside
it, and no query analyzer reports it, because every single query runs fast. The
unit of cost is the round trip. Count round trips per request, put a budget on
the count, and keep the loop for the cases where that count stays small.
