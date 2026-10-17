---
title: "Gossip Protocol"
termSlug: "gossip-protocol"
year: 2025
month: 8
monthName: "August"
day: 22
order: 21
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "Gossip Protocol is a communication method where nodes in a distributed system spread information by randomly sharing it with a few neighbors at regular intervals, similar to how rumors spread in so..."
---
### Definition:

Gossip Protocol is a communication method where nodes in a distributed system spread information by randomly sharing it with a few neighbors at regular intervals, similar to how rumors spread in social networks. Each node periodically "gossips" with others, ensuring information eventually reaches everyone without needing a central coordinator.

**Key Features**

- Decentralized: No single point of failure
- Eventually consistent: All nodes eventually get the same information
- Fault-tolerant: Works even if some nodes fail
- Scalable: Efficient even with thousands of nodes

### Example:

- Database Cluster
  Traditional Approach (Centralized):

```
Master Server → broadcasts to all nodes
Problem: If master fails, no one gets updates
```

Gossip Protocol Approach:

```
Node B detects A is down
Round 1: Node B → tells Node C, Node D
Round 2: Node C → tells Node E, Node D → tells Node E
Round 3: All nodes know Node A is down
```
