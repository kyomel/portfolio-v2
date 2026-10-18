---
title: "Write Ahead Log(WAL)"
termSlug: "write-ahead-log-wal"
year: 2025
month: 9
monthName: "September"
day: 2
order: 2
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Write Ahead Log (WAL) is a technique used in distributed systems where all changes are first written to a durable log before being applied to the actual data. This ensures data consistency, enables..."
---
### Definition:

Write Ahead Log (WAL) is a technique used in distributed systems where all changes are first written to a durable log before being applied to the actual data. This ensures data consistency, enables crash recovery, and helps maintain data integrity across multiple nodes. The key principle is: "log first, then apply changes."

### Example:

- PostgreSQL Database Cluster

```
-- User executes: UPDATE users SET balance = 500 WHERE id = 123;

-- Step 1: WAL entry written to disk FIRST
WAL Record:
{
  "lsn": "0/1B000028",
  "type": "UPDATE",
  "table": "users",
  "old_data": {"id": 123, "balance": 400},
  "new_data": {"id": 123, "balance": 500},
  "transaction_id": "TXN_456"
}

-- Step 2: Only AFTER WAL is on disk, apply to database
-- Step 3: Eventually, WAL gets replicated to standby servers
```

Recovery Process:

```
Primary Server Crashes!

Standby Server:
1. Reads WAL from shared storage
2. Replays all WAL entries since last checkpoint
3. Becomes new primary
4. No data lost! ✓
```

WAL in Distributed Systems:

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Node 1    │    │   Node 2    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Write Request  │                   │
       ├──────────────────>│                   │
       │                   │ 2. Write to WAL   │
       │                   ├──────────────────>│
       │                   │ 3. WAL Synced     │
       │                   │<──────────────────┤
       │                   │ 4. Apply Changes  │
       │                   │ 5. Apply Changes  │
       │                   ├──────────────────>│
       │ 6. Success        │                   │
       │<──────────────────┤                   │
```
