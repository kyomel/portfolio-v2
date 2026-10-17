---
title: "Adaptive Replacement Cache (ARC)"
termSlug: "adaptive-replacement-cache-arc"
year: 2025
month: 8
monthName: "August"
day: 21
order: 20
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "Adaptive Replacement Cache (ARC) is a smart caching algorithm that automatically balances between keeping recently used items and frequently used items. It \"learns\" from access patterns and adjusts..."
---
### Definition:

Adaptive Replacement Cache (ARC) is a smart caching algorithm that automatically balances between keeping recently used items and frequently used items. It "learns" from access patterns and adjusts itself to minimize cache misses without any manual tuning.

**Key Features**

- Self-tuning: Automatically adjusts between recency and frequency
- Ghost lists: Remembers recently evicted items to make better decisions
- Adaptive: Changes behavior based on workload patterns

### Example:

- Music Streaming App
  Imagine your music app cache that holds 6 songs:

```
Initial State - Playing your usual favorites:

Recent (T1): [Song A, Song B]
Frequent (T2): [Song C, Song D, Song E, Song F]
```

Scenario 1: You discover new music and play many new songs

```
Access pattern: New songs G, H, I, J...

ARC learns: "User is exploring new music, prioritize recent songs"
Adapts to:
Recent (T1): [Song G, Song H, Song I, Song J]  ← Grows
Frequent (T2): [Song E, Song F]                ← Shrinks
```

Scenario 2: You go back to your old favorites

```
Access pattern: Songs C, D, E, F repeatedly...

ARC learns: "User prefers familiar songs, prioritize frequent ones"
Adapts to:
Recent (T1): [Song G]                          ← Shrinks
Frequent (T2): [Song C, Song D, Song E, Song F, Song H]  ← Grows
```

Why ARC is Special

- Traditional LRU: Only considers recent usage → Would miss your favorite songs
- Traditional LFU: Only considers frequency → Would miss new discoveries
- ARC: Automatically finds the perfect balance for YOUR listening habits
