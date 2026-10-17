---
title: "PostgreSQL Vacuum"
termSlug: "postgresql-vacuum"
year: 2025
month: 11
monthName: "November"
day: 13
order: 9
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "PostgreSQL Vacuum is a maintenance process that reclaims storage space and updates statistics by removing dead tuples (deleted or outdated rows) from tables. Unlike other databases that immediately..."
---
### Definition:

PostgreSQL Vacuum is a maintenance process that reclaims storage space and updates statistics by removing dead tuples (deleted or outdated rows) from tables. Unlike other databases that immediately remove deleted data, PostgreSQL uses Multi-Version Concurrency Control (MVCC) which marks rows as deleted but leaves them in place. Vacuum cleans up these "dead" rows, prevents transaction ID wraparound, and keeps the database performing efficiently.

**Key Properties:**

- Space reclamation: Removes dead tuples to free up storage
- Statistics updates: Refreshes query planner statistics for optimal performance
- Transaction ID management: Prevents transaction ID wraparound issues
- Concurrent operation: Can run alongside normal database operations
- Automatic scheduling: AUTOVACUUM runs automatically based on thresholds
- Bloat reduction: Keeps tables and indexes from growing unnecessarily large

**Core Concepts:**

- Dead tuples: Rows marked as deleted but still physically present
- MVCC (Multi-Version Concurrency Control): PostgreSQL's concurrency mechanism
- Transaction ID wraparound: Critical issue prevented by regular vacuuming
- Table bloat: Wasted space from accumulated dead tuples
- AUTOVACUUM: Background process that automatically runs vacuum
- Vacuum thresholds: Conditions that trigger automatic vacuuming

### Example:

E-commerce database experiencing performance degradation due to frequent updates and deletes

```
-- 🧹 MANUAL VACUUM OPERATIONS

-- Basic vacuum - removes dead tuples, updates statistics
VACUUM users;

-- Verbose vacuum - shows detailed information
VACUUM VERBOSE users;

-- Vacuum with analyze - also updates query planner statistics
VACUUM ANALYZE users;

-- Full vacuum - rebuilds table completely (locks table)
VACUUM FULL users;

-- Check table bloat before vacuum
SELECT
  schemaname,
  tablename,
  n_dead_tup as dead_tuples,
  n_live_tup as live_tuples,
  ROUND((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_percentage
FROM pg_stat_user_tables
WHERE tablename = 'users';
```
