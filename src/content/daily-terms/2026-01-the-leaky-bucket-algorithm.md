---
title: "The Leaky Bucket Algorithm"
termSlug: "the-leaky-bucket-algorithm"
year: 2026
month: 1
monthName: "January"
day: 9
order: 7
source: "2026/jan-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/jan-term.md"
excerpt: "The Leaky Bucket Algorithm is a rate-limiting technique that controls the flow of data or requests by maintaining a constant output rate, regardless of how bursty the input is. Incoming requests fi..."
---
### Definition:

The Leaky Bucket Algorithm is a rate-limiting technique that controls the flow of data or requests by maintaining a constant output rate, regardless of how bursty the input is. Incoming requests fill a "bucket" with finite capacity, and requests "leak out" at a fixed rate.

Key idea: Smooth out irregular bursts of traffic into a steady, predictable flow.

**Why It Matters**

**Without Rate Limiting:**

❌ Server overload from traffic spikes
❌ System crashes under heavy load
❌ Poor experience for all users
❌ DDoS vulnerabilities

**With Leaky Bucket:**

✅ Steady, predictable traffic flow
✅ Protection from bursts
✅ Fair resource allocation
✅ System stability maintained

### Example:

Imagine a literal bucket with a small hole at the bottom:

```
1. Bucket has capacity: 10 requests
2. Leak rate: 2 requests/second (constant)

Timeline:

t=0s  → 5 requests arrive
        Bucket: [■■■■■□□□□□] (5/10)
        Leak 2 → Process 2 requests

t=1s  → 8 requests arrive
        Bucket: [■■■■■■■■■■] (10/10) FULL!
        3 requests REJECTED (overflow)
        Leak 2 → Process 2 requests

t=2s  → 1 request arrives
        Bucket: [■■■■■■■□□□] (7/10)
        Leak 2 → Process 2 requests

t=3s  → 0 requests arrive
        Bucket: [■■■■■□□□□□] (5/10)
        Leak 2 → Process 2 requests

t=4s  → 0 requests arrive
        Bucket: [■■■□□□□□□□] (3/10)
        Leak 2 → Process 2 requests

t=5s  → 0 requests arrive
        Bucket: [■□□□□□□□□□] (1/10)
        Leak 1 → Process 1 request (only 1 left)

t=6s  → Bucket empty!
        Bucket: [□□□□□□□□□□] (0/10)
```
