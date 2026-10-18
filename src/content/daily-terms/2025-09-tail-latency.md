---
title: "Tail Latency"
termSlug: "tail-latency"
year: 2025
month: 9
monthName: "September"
day: 26
order: 20
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Tail Latency refers to the slowest response times in a system - the \"long tail\" of the latency distribution. While most requests are fast, a small percentage (like the slowest 1% or 5%) can be dram..."
---
### Definition:
Tail Latency refers to the slowest response times in a system - the "long tail" of the latency distribution. While most requests are fast, a small percentage (like the slowest 1% or 5%) can be dramatically slower, creating a poor user experience even when average performance looks good.

**Why It's Called "Tail" Latency**
In a graph of response times, most requests cluster on the left (fast), but some stretch out to the right forming a "tail" of slow requests.
```text
Number of Requests
     ▲
     │    📊
     │   ████
     │  ██████
     │ ████████
     │██████████ 🐍 ──── Tail (slow requests)
     └─────────────────────────► Response Time
     Fast ←            → Slow
```

### Example:
- Amazon's Discovery
```text
Tail latency increase of +100ms = -1% in sales
Why? That 1% of slow users represents:
├─ 1 million daily visitors
├─ 10,000 affected customers
└─ $50,000+ daily revenue loss
```
