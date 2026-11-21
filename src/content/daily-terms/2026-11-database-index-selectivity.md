---
title: "Database Index Selectivity"
termSlug: "database-index-selectivity"
year: 2026
month: 11
monthName: "November"
day: 19
order: 14
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Index selectivity is the fraction of table rows that one index lookup must read. A selective index returns a small fraction. A weak index returns a large fraction. The optimizer uses this number to..."
---
### Definition:

**Index selectivity** is the fraction of table rows that one index lookup
must read. A selective index returns a small fraction. A weak index returns a
large fraction. The optimizer uses this number to choose between an index scan
and a full table scan. Selectivity is a ratio, not a count: rows matched
divided by rows in the table.

The index on a column stores one entry per row, sorted by the column value.
A lookup on a value that appears many times gives back many entries. Each
entry costs one pointer chase to the table. At some point the chase costs more
than a straight sequential read of the whole table.

Older table formats store many rows on one page. A full read of the table is
one sequential read of all its pages. At worst it reads the whole table once.

```text
WITHOUT INDEX — full scan                     WITH INDEX — choose by selectivity
══════════════════════════════════════════    ═════════════════════════════════════════════
SELECT id FROM orders WHERE customer_id=8842  selectivity = rows matched / rows total
               │                              ─────────────────────────────────────────────
               ▼                              1 row  / 5,000,000  = 0.00002  -> INDEX
┌──────────────────────────────────────────┐  500k   / 5,000,000  = 0.10     -> SCAN
│ page 1     : many rows                   │   0.00002  index-only, few pages
│ page 2     : many rows                   │   0.10     random reads on 500k rows,
│ ...        : N pages in order            │            the table is read anyway
│ page N     : many rows                   │
└──────────────────────────────────────────┘  ─────────────────────────────────────────────
every page in order, no random hop            the optimizer compares the two costs
                                              BEFORE it runs either plan
```

The break-even point depends on two numbers. One is the cluster factor: how
well the table order matches the index order. The other is the cost of a
random read against a sequential read. On an SSD a random read costs about
3 to 10 times a sequential read. On a spinning disk it costs about 100 times.
So a very selective index on an SSD wins at a much larger fraction than on a
HDD. PostgreSQL estimates the cost with `pg_stats` and the index tuple counts.
It does not know the true value. Statistics are a sample of the table.

```text
WHAT MAKES AN INDEX SELECTIVE        WHAT MAKES IT WEAK
──────────────────────────────────   ──────────────────────────────────
high cardinality: unique keys,       low cardinality: status flags,
uuid, email, order_id                booleans, country codes
narrow predicate: equality, IN       wide predicate: LIKE '%x%',
range on a sorted column             NOT IN, !=, OR across columns
leading column in a composite        non-leading column in a composite
index, prefix match                  index (B-tree cannot use it)
fresh statistics after bulk load     stale stats after a big write
```

**Two more traps.** First, the composite index rule: the first column decides
almost everything. `(tenant_id, created_at)` serves `WHERE tenant_id = ?`. It
does not serve `WHERE created_at > ?` alone. Second, a query on a column with
two values (like `active = true`) almost never wants a plain index. The
optimizer reads the index, then reads most of the table at random, and the
plan is slower than a scan. The fix is a partial index:
`CREATE INDEX ... ON orders (id) WHERE status = 'pending'`. The index holds
only the small, hot slice, so the index itself becomes selective.

### Example:

A SaaS API serves `GET /orders?customer=8842`. The `orders` table has 5,000,000
rows. A developer adds an index on `status` and the endpoint gets slower. The
cause is selectivity: 78% of rows carry `status = 'paid'`.

```text
query: SELECT id, total FROM orders WHERE customer_id = $1 AND status = 'paid';

NAIVE — one index on the low-cardinality column
──────────────────────────────────────────────────────────────────────────────
  plan    Bitmap Index Scan on idx_status (status = 'paid')
          -> 3,900,000 rows = 78% of the table
          Bitmap Heap Scan
          -> 3,900,000 random page fetches
  cost    ~1,180,000 cost units, planner prefers it to a full scan
  result  slow, and it reads most of the table anyway

PATTERN — composite index, equality column first
──────────────────────────────────────────────────────────────────────────────
  CREATE INDEX idx_cust_status ON orders (customer_id, status);
      -- customer_id first: equality filter, removes almost every row
      -- status second:      narrows the small set that is left

  plan    Index Only Scan on idx_cust_status
          Index Cond: ((customer_id = 8842) AND (status = 'paid'))
          -> 38 rows -> 9 pages
  cost    ~21 cost units
  result  fast, heap fetches = 0 (visibility map says all-visible)
```

The fix was not "add an index". Both plans use an index. The fix was column
order, so the equality predicate ran first and the index returned 38 rows
instead of 3,900,000. Measure the difference before and after with
`EXPLAIN (ANALYZE, BUFFERS)`.

Check the numbers yourself. This query shows the estimate before you ship:

```sql
-- how selective is each column, really?
SELECT attname,
       n_distinct,
       round(n_distinct::numeric / 5000000, 6) AS selectivity
  FROM pg_stats
 WHERE tablename = 'orders';
```

An `attname` with `n_distinct` near the row count is highly selective. A value
like `3` for `status` means three distinct values, and the ratio is 0.0000006.
That ratio is the number of distinct values per row. Do not confuse
cardinality with selectivity. Cardinality counts the distinct values in the
column. Selectivity is the fraction of rows one predicate returns.

```text
COLUMN       n_distinct   rows/group   one-value predicate reads
──────────── ──────────   ──────────   ───────────────────────────
email        5,000,000    1            0.00002 %  -> index wins
customer_id  900,000      5.5          0.0001 %   -> index wins
status       3            1,666,667    33 %       -> scan wins
```

High cardinality helps, but the column order and the operator still decide.
`WHERE status != 'x'` on a 3-value column has the same cardinality as
`WHERE status = 'x'`, and it reads 66% of the table.

Keep the story honest: an index is a size bet. It wins when the predicate is
narrow, the columns are ordered for the predicate, and the statistics are
fresh. It loses when the predicate is wide, the column order is wrong, or a
bulk load ran after the last `ANALYZE`. Run `EXPLAIN (ANALYZE, BUFFERS)`
before you ship, not after the pager goes off.
