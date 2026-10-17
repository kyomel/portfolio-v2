---
title: "Logical Clocks(Distributed Systems)"
termSlug: "logical-clocks-distributed-systems"
year: 2025
month: 7
monthName: "July"
day: 28
order: 22
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Logical Clocks are mechanisms used in distributed systems to establish a partial ordering of events across different nodes without relying on synchronized physical clocks. They assign timestamps to..."
---
### Definition:

Logical Clocks are mechanisms used in distributed systems to establish a partial ordering of events across different nodes without relying on synchronized physical clocks. They assign timestamps to events to determine causality relationships between operations happening on different machines.

### Example:

- Scenario: Three nodes (A, B, C) exchanging messages

```
Node A: [1] Send msg to B → [2] Receive from C → [4] Internal event
Node B: [3] Receive from A → [4] Send msg to C → [5] Internal event
Node C: [2] Send msg to A → [5] Receive from B → [6] Internal event
```

Lamport Clock Rules:

- Internal Events:

```
LC = LC + 1
```

- Send Message:

```
LC = LC + 1
```

- Receive Message:

```
LC = max(LC, received_timestamp) + 1
```
