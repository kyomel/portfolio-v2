---
title: "Split-Brain Resolution"
termSlug: "split-brain-resolution"
year: 2025
month: 11
monthName: "November"
day: 17
order: 11
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Split-Brain Resolution is a mechanism in distributed systems that prevents data corruption and inconsistency when network partitions occur. A \"split-brain\" happens when cluster nodes lose communica..."
---
### Definition:

Split-Brain Resolution is a mechanism in distributed systems that prevents data corruption and inconsistency when network partitions occur. A "split-brain" happens when cluster nodes lose communication with each other but continue operating independently, potentially creating conflicting data states.

**Key characteristics:**

- Prevents multiple nodes from acting as "master" simultaneously
- Maintains data consistency during network failures
- Uses techniques like quorum, fencing, or witness nodes

### Example:

Banking System

```
Imagine a bank with two data centers (Data Center A and Data Center B) that synchronize customer accounts:

Data Center A ←--X--→ Data Center B
(Customer Balance: $$1000)   (Customer Balance: $$1000)
A network partition occurs - they can't communicate, but both stay active.

Without Split-Brain Resolution:

A customer withdraws 500 from Data Center A's ATM, and the same customer withdraws 600 from Data Center B's ATM.

Problem: The customer has withdrawn a total of 1100 from the account, resulting in a balance of 1100 when it should be 0! 💸
```
