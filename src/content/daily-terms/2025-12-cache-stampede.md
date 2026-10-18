---
title: "Cache Stampede"
termSlug: "cache-stampede"
year: 2025
month: 12
monthName: "December"
day: 10
order: 8
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Cache Stampede (also called Thundering Herd or Dog-pile Effect) is a phenomenon where multiple requests simultaneously attempt to regenerate the same cached data when it expires or becomes unavaila..."
---
### Definition:

Cache Stampede (also called Thundering Herd or Dog-pile Effect) is a phenomenon where multiple requests simultaneously attempt to regenerate the same cached data when it expires or becomes unavailable. Instead of one request rebuilding the cache while others wait, all requests hit the backend simultaneously, potentially overwhelming the database or origin server and causing system failure.

**Key characteristics:**

- Occurs when popular cache entries expire
- Multiple simultaneous backend requests
- Can cascade into system-wide failures
- More severe with high-traffic systems
- Preventable with proper caching strategies

### Example:

Popular Product Page
Scenario: E-commerce site with cached product data

```text
Proper Cache Handling (The Solution):

Cache Status: Product #123 data EXPIRED at 10:00:00

10:00:01 - 1000 users request Product #123 simultaneously
┌─────────────────────────────────────────────────────┐
│                                                     │
│  User 1: "Cache miss! I'll rebuild. Set LOCK."     │
│  User 2: "Cache locked. Wait or use stale data."   │
│  User 3: "Cache locked. Wait or use stale data."   │
│  ...                                               │
│  User 1000: "Cache locked. Wait or use stale data."│
│                                                     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              DATABASE SERVER                        │
│                                                     │
│  ✅ ONLY 1 QUERY                                   │
│                                                     │
│  CPU: 5% █░░░░░░░░░░░░░░░░░░░                      │
│  Connections: Normal                                │
│  Response time: 50ms                                │
│  Status: HEALTHY                                    │
│                                                     │
└─────────────────────────────────────────────────────┘

Result: Website stays UP! 😊
Visual Timeline:
┌─────────────────────────────────────────────────────┐
│              CACHE STAMPEDE TIMELINE                │
└─────────────────────────────────────────────────────┘

WITHOUT PROTECTION:
─────────────────────────────────────────────────────────
Time:     10:00:00    10:00:01              10:00:05
          │           │                      │
Cache:    EXPIRES     │                      │
          │           │                      │
Requests: │     ──────┼──────                │
          │     1000 simultaneous            │
          │     cache misses                 │
          │           │                      │
Database: │     💥 OVERLOADED 💥            CRASHED
─────────────────────────────────────────────────────────

WITH PROTECTION (Lock/Mutex):
─────────────────────────────────────────────────────────
Time:     10:00:00    10:00:01    10:00:02    10:00:03
          │           │           │           │
Cache:    EXPIRES     │           REBUILT     │
          │           │           │           │
Request 1:│     ──────┼───────────┼           │
          │     Gets lock        Updates     │
          │     Queries DB       cache       │
          │           │           │           │
Requests: │     999 requests     Get fresh   │
2-1000:   │     wait/stale       data        │
          │           │           │           │
Database: │     1 query only ✅              HEALTHY
─────────────────────────────────────────────────────────
```
