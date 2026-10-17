---
title: "RAFT algorithm"
termSlug: "raft-algorithm"
year: 2025
month: 7
monthName: "July"
day: 10
order: 9
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "RAFT (Replicated And Fault Tolerant) is a consensus algorithm designed to manage distributed systems by ensuring all nodes agree on a shared state, even when some nodes fail. It's simpler and more..."
---
### Definition:

RAFT (Replicated And Fault Tolerant) is a consensus algorithm designed to manage distributed systems by ensuring all nodes agree on a shared state, even when some nodes fail. It's simpler and more understandable than Paxos.

Key Concepts

- Leader Election: One node becomes the leader to coordinate operations
- Log Replication: Leader replicates entries to follower nodes
- Safety: Ensures consistency across all nodes

### Example:

Banking System

Scenario: 5-node banking cluster processing account transfers

```
Initial State:
Node A (Leader) | Node B | Node C | Node D | Node E
Balance: $1000  | $1000  | $1000  | $1000  | $1000
```

Step 1: Client Request

```
Client → Transfer $200 from Account X to Account Y
```

Step 2: Leader Processing

```
Node A (Leader):
1. Receives transfer request
2. Creates log entry: "Transfer $200 X→Y"
3. Sends to followers for replication
```

Step 3: Consensus

```
Node A → Node B: "Append log entry #5"
Node A → Node C: "Append log entry #5"
Node A → Node D: "Append log entry #5"
Node A → Node E: "Append log entry #5"

Responses:
✅ Node B: "Committed"
✅ Node C: "Committed"
❌ Node D: "Failed" (network issue)
✅ Node E: "Committed"

Result: 3/5 nodes = Majority achieved ✅
```

Step 4: Commit

```
Final State (majority nodes):
Node A | Node B | Node C | Node E
Balance: $800   | $800   | $800   | $800
(Node D will sync when reconnected)
```
