---
title: "Reactive Scaling"
termSlug: "reactive-scaling"
year: 2025
month: 9
monthName: "September"
day: 10
order: 8
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Reactive Scaling is an automatic system behavior where computing resources (servers, containers, etc.) are added or removed in response to current demand or performance metrics. The system \"reacts\"..."
---
### Definition:

Reactive Scaling is an automatic system behavior where computing resources (servers, containers, etc.) are added or removed in response to current demand or performance metrics. The system "reacts" to changes in workload by scaling up when busy and scaling down when idle.

**How It Works**

- Monitor metrics: CPU usage, memory, request queue length
- Trigger scaling: When thresholds are crossed
- Add/remove resources: Automatically spin up or shut down instances
- Return to baseline: Scale back down when demand decreases

### Example:

**Netflix on Friday Night:**

**Normal Day (Tuesday 2 PM):**

- Low viewership = 100 servers running
- CPU usage: 30%

**Friday Night (8 PM):**

- Everyone starts watching = demand spikes
- CPU usage hits 80% threshold
- Reactive scaling triggers: Automatically adds 300 more servers
- Total: 400 servers handling the load

**Late Night (2 AM):**

- Viewership drops = CPU usage falls to 20%
- Reactive scaling triggers: Automatically removes 250 servers
- Back to 150 servers (slightly higher baseline for weekend)
