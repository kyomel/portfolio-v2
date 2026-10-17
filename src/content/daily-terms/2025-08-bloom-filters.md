---
title: "Bloom Filters"
termSlug: "bloom-filters"
year: 2025
month: 8
monthName: "August"
day: 26
order: 23
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "Bloom Filter is a space-efficient probabilistic data structure that tells you if an element is \"definitely not in a set\" or \"possibly in a set.\" It can have false positives (says yes when it should..."
---
### Definition:

Bloom Filter is a space-efficient probabilistic data structure that tells you if an element is "definitely not in a set" or "possibly in a set." It can have false positives (says yes when it should say no) but never false negatives (if it says no, the item is definitely not there).

**Key Features**

- Space efficient: Uses much less memory than storing actual data
- Fast lookups: Constant time O(1) operations
- Probabilistic: Can give false positives, but never false negatives
- No deletions: Can't remove items once added

### Example:

- Google Chrome

```
User visits: badsite.com
↓
Check Bloom Filter locally (instant)
↓
Filter says "NO" → Safe to visit ✓
Filter says "YES" → Contact Google servers to double-check
```
