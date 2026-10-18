---
title: "Replica Technique in System Design"
termSlug: "replica-technique-in-system-design"
year: 2025
month: 7
monthName: "July"
day: 14
order: 11
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Replica Technique is a design pattern used in distributed systems to enhance reliability, availability, and performance by creating multiple copies (replicas) of data or services across different n..."
---
### Definition:

Replica Technique is a design pattern used in distributed systems to enhance reliability, availability, and performance by creating multiple copies (replicas) of data or services across different nodes.

Key Benefits
⚡ High Availability - System remains operational even if some replicas fail
🚀 Performance - Reduced latency through geographical distribution
🛡️ Fault Tolerance - Data redundancy prevents single point of failure
📈 Scalability - Load distribution across multiple replicas

Types of Replication:

- **Master-Slave Replication**: One master node handles writes, while multiple slave nodes handle reads. Use case: Read-heavy applications like web servers.
- **Master-Master Replication**: Multiple nodes can handle both reads and writes. Use case: High write availability systems where any node can accept writes.
- **Peer-to-Peer**: All nodes are equal, and each can read/write data. Use case: disributed systems like blockchain.

### Example:

E-commerce Database Replication(scenario: Amazon-like online store)

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Master    │    │   Slave 1   │    │   Slave 2   │
│  Database   │───▶│  (US East)  │    │  (Europe)   │
│   (Main)    │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   All Writes         Read Queries        Read Queries
   (Orders, Users)    (Product Info)     (Product Info)
```

Implementation Strategy

- Master Database 🎯

Handles all write operations (new orders, user registration)
Located in primary data center

- Read Replicas 📖

Handle read queries (product searches, user profiles)
Distributed globally for reduced latency

- Replication Process 🔄

```
-- Master receives write
INSERT INTO orders (user_id, product_id, amount)
VALUES (123, 456, 99.99);

-- Changes replicated to slaves asynchronously
-- Users in different regions read from nearest replica
```
