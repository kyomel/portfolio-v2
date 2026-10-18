---
title: "Data Skew"
termSlug: "data-skew"
year: 2025
month: 12
monthName: "December"
day: 30
order: 22
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Data Skew occurs when data is distributed unevenly across partitions or nodes in a distributed system, causing some partitions to have significantly more data than others."
---
### Definition:

Data Skew occurs when data is distributed unevenly across partitions or nodes in a distributed system, causing some partitions to have significantly more data than others.

**Why It Matters:**

- Creates performance bottlenecks (slow partitions hold up the entire job)
- Leads to resource waste (some nodes sit idle while one struggles)
- Can cause out-of-memory errors on overloaded nodes

### Example

Imagine processing customer orders across 4 servers:

```text
❌ With Data Skew

Server 1: ████████████████████████ (80,000 orders) ← Overloaded!
Server 2: ███ (10,000 orders)
Server 3: ███ (5,000 orders)
Server 4: ███ (5,000 orders)
Problem: Server 1 takes hours while others finish in minutes.

✅ Without Data Skew (Balanced)

Server 1: ████████ (25,000 orders)
Server 2: ████████ (25,000 orders)
Server 3: ████████ (25,000 orders)
Server 4: ████████ (25,000 orders)
Result: All servers finish around the same time.
```
