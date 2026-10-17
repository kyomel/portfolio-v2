---
title: "Optimistic Concurrency Control (OCC)"
termSlug: "optimistic-concurrency-control-occ"
year: 2025
month: 7
monthName: "July"
day: 23
order: 19
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "OCC allows multiple transactions to proceed without locks, assuming conflicts are rare; it detects collisions only at commit-time using version tags. Use Case E-commerce carts: many users can edit..."
---
### Definition:

OCC allows multiple transactions to proceed without locks, assuming conflicts are rare; it detects collisions only at commit-time using version tags.

**Use Case**
E-commerce carts: many users can edit simultaneously; only the first commit wins, others retry.

### Example:

JSON + HTTP

```
PUT /inventory/42
If-Match: "v5"
{
  "stock": 12
}
```
