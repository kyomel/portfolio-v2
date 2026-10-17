---
title: "HyperLogLog"
termSlug: "hyperloglog"
year: 2026
month: 1
monthName: "January"
day: 19
order: 12
source: "2026/jan-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/jan-term.md"
excerpt: "HyperLogLog (HLL) is a probabilistic algorithm used to estimate the cardinality (number of unique elements) in a very large dataset using minimal memory. Instead of storing all unique values, it us..."
---
### Definition:

HyperLogLog (HLL) is a probabilistic algorithm used to estimate the cardinality (number of unique elements) in a very large dataset using minimal memory. Instead of storing all unique values, it uses statistical approximations to count distinct items with ~2% error rate while using only kilobytes of memory instead of gigabytes.

**Core Characteristics:**

- Space Efficiency: Uses ~1.5 KB to count billions of unique items
- Accuracy: Typical error rate of ±2%
- Speed: Constant time operations O(1) for add and count
- Mergeable: Can combine multiple HyperLogLog structures

**How It Works (Simplified):**

1. Hash each element → Get a binary number
2. Count leading zeros in the hash
3. Keep track of the maximum zeros seen (per bucket)
4. Estimate cardinality from these maximums

**Why this works:**

Rare events (like many leading zeros) indicate a large dataset.

**Analogy:**

- If you flip coins and see 10 heads in a row, you probably flipped a lot of times
- HyperLogLog uses this probability theory with hash values

### Example:

Tracking Daily Unique Visitors

```
The Problem
You run a popular website with 100 million daily visitors. You need to answer:

- "How many unique visitors today?"
- "How many unique visitors this week?"

HyperLogLog Approach

import hyperloglog

# Create HyperLogLog counter (uses ~1.5 KB)
hll = hyperloglog.HyperLogLog(0.01)  # 1% error rate

# Add visitors
hll.add("user_12345")
hll.add("user_67890")
hll.add("user_12345")  # Duplicate, automatically handled

# Estimate count
estimated_count = len(hll)
print(f"~{estimated_count} unique visitors")

Memory Required: ~1.5 KB (regardless of actual count!)
```
