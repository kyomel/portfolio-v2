---
title: "Paxos Algorithm"
termSlug: "paxos-algorithm"
year: 2025
month: 7
monthName: "July"
day: 24
order: 20
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Paxos is a consensus algorithm used in distributed systems to achieve agreement among multiple nodes on a single value, even when some nodes fail or network partitions occur. It guarantees safety (..."
---
### Definition:

Paxos is a consensus algorithm used in distributed systems to achieve agreement among multiple nodes on a single value, even when some nodes fail or network partitions occur. It guarantees safety (correctness) but not liveness (progress) under all conditions.

Key Characteristics
✅ Fault-tolerant: Works with up to

```
(n-1)/2
```

node failures
✅ Safety guaranteed: Never produces incorrect results
⚠️ Liveness not guaranteed: May not always make progress
🎯 Single-value consensus: Agrees on one value per instance

Roles
The Paxos algorithm defines three different roles:

- Proposers
- Acceptors
- Learners
  Every node in the system can potentially play multiple roles.

### Example:

Distributed Database Leader Election

Scenario: 5 database replicas need to elect a leader

```
Nodes: A, B, C, D, E
Goal: Elect one leader from candidates A, B, C
```

Phase 1 (Proposers):

```
Node A (Proposer): "Prepare request #1, I want to propose myself as leader"
→ Sends to nodes B, C, D, E
```

Phase 2 (Acceptors):

```
Node B: "Promise #1, I haven't seen higher proposals"
Node C: "Promise #1, I haven't seen higher proposals"
Node D: "Promise #1, I haven't seen higher proposals"
Node E: "Promise #1, but I previously accepted Node B as leader"
```

Phase 3 (Learners):

```
Node A: "Accept Node B as leader" (uses highest previous value from promises)
→ Majority (B, C, D) accept
→ Node B becomes the leader
```
