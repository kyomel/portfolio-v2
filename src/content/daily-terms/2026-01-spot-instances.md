---
title: "Spot Instances"
termSlug: "spot-instances"
year: 2026
month: 1
monthName: "January"
day: 6
order: 4
source: "2026/jan-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/jan-term.md"
excerpt: "Spot Instances are heavily discounted cloud computing resources (virtual machines) that use spare capacity from cloud providers. They can save you up to 90% compared to regular On-Demand pricing, b..."
---
### Definition:

Spot Instances are heavily discounted cloud computing resources (virtual machines) that use spare capacity from cloud providers. They can save you up to 90% compared to regular On-Demand pricing, but come with a trade-off: the cloud provider can reclaim them at any time with short notice (30 seconds to 2 minutes).

Key idea: Cheap cloud servers that can be interrupted when the provider needs the capacity back.

**Why It Matters**
💰 Huge savings: 60-90% cheaper than regular pricing
⚡ Same performance: Identical to standard instances
⚠️ Interruptible: Can be terminated with minimal warning
🎯 Perfect for flexible workloads: Not for critical applications

**How It Works**

Cloud Provider's Perspective:

1. Has 1000 servers in data center
2. Only 600 are being used by regular customers
3. Offers remaining 400 at steep discount as "Spot Instances"
4. If regular customers need them → reclaim from Spot users

Your Perspective:

1. Rent cheap server (90% off!)
2. Run your workload
3. Might get interrupted (2-minute warning)
4. Save tons of money! 💵

### Example:

Scenario: Video Rendering Farm

```
Option 1: On-Demand Instances

Cost: $1.00/hour per server
Workload: Render 100 videos (10 hours)
Servers needed: 10
Total cost: $1.00 × 10 servers × 10 hours = $100
Reliability: ✅ Guaranteed

Option 2: Spot Instances

Cost: $0.10/hour per server (90% discount!)
Workload: Render 100 videos (10 hours)
Servers needed: 10
Total cost: $0.10 × 10 servers × 10 hours = $10
Reliability: ⚠️ Might be interrupted
Savings: $90 (90% saved!) 🎉

Result: If 2 out of 10 servers get interrupted and you restart them, you still save ~$80!
```
