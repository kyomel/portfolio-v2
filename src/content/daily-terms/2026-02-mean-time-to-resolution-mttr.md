---
title: "Mean Time to Resolution (MTTR)"
termSlug: "mean-time-to-resolution-mttr"
year: 2026
month: 2
monthName: "February"
day: 11
order: 8
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Mean Time to Resolution (MTTR) is the average time it takes to completely resolve an incident or problem from the moment it's detected until it's fully fixed and verified. It measures the total lif..."
---
### Definition:

Mean Time to Resolution (MTTR) is the average time it takes to completely resolve an incident or problem from the moment it's detected until it's fully fixed and verified. It measures the total lifecycle of an incident, including detection, diagnosis, repair, testing, and confirmation that the issue won't recur.

Formula:
MTTR=
Number of incidents
Total time to resolve all incidents
​

MTTR vs Other "MTTR" Metrics
The acronym MTTR is confusing because it has 4 different meanings:

| Metric               | Measures               | Starts When       | Ends When          | Use Case              |
| -------------------- | ---------------------- | ----------------- | ------------------ | --------------------- |
| Mean Time to Resolve | Complete fix lifecycle | Incident detected | Confirmed resolved | Overall incident mgmt |
| Mean Time to Repair  | Actual fix time        | Work begins       | Technical fix done | Technical efficiency  |
| Mean Time to Respond | Initial response speed | Alert triggered   | First action taken | Response team speed   |
| Mean Time to Recover | Service restoration    | Service down      | Service restored   | Business continuity   |

Visual Comparison

```text
Incident Timeline:
═══════════════════════════════════════════════════════════

0min ─────► Alert Triggered
│
│ ◄──── Mean Time to Respond (5min)
│
5min ─────► First Response / Acknowledged
│
│ (Investigation phase)
│
15min ────► Work Begins on Fix
│
│ ◄──── Mean Time to Repair (30min)
│
45min ────► Technical Fix Complete
│
│ ◄──── Mean Time to Recover (35min)
│
50min ────► Service Restored to Users
│
│ (Verification & documentation)
│
60min ────► Incident Closed & Verified
│
│ ◄──── Mean Time to RESOLVE (60min) ◄── Full lifecycle
```

### Example:

E-Commerce Website Crash

```text
Company: ShopFast.com
Date: Black Friday, 2:30 PM
Impact: Checkout process down, losing $50,000/minute

Complete Timeline

┌────────────────────────────────────────────────────────┐
│ 14:30:00 - DATABASE CRASHES                           │
│ (Users start seeing errors, but team doesn't know yet)│
└────────────────────────────────────────────────────────┘
         │
         │ 3 minutes (Customers complaining)
         ▼
┌────────────────────────────────────────────────────────┐
│ 14:33:00 - ALERT TRIGGERED ◄── Detection              │
│ Monitoring system detects high error rate             │
└────────────────────────────────────────────────────────┘
         │
         │ ◄── Mean Time to Respond: 2 minutes
         ▼
┌────────────────────────────────────────────────────────┐
│ 14:35:00 - FIRST RESPONSE                             │
│ On-call engineer Sarah acknowledges alert             │
│ Status: Investigating                                  │
└────────────────────────────────────────────────────────┘
         │
         │ 5 minutes (Checking logs, running diagnostics)
         ▼
┌────────────────────────────────────────────────────────┐
│ 14:40:00 - ROOT CAUSE IDENTIFIED                      │
│ Database connection pool exhausted                     │
│ Cause: Spike in traffic (5x normal)                   │
└────────────────────────────────────────────────────────┘
         │
         │ ◄── Mean Time to Repair: 15 minutes (starts here)
         │ 3 minutes (Implementing fix)
         ▼
┌────────────────────────────────────────────────────────┐
│ 14:43:00 - FIX APPLIED                                │
│ - Increased DB connection pool size                   │
│ - Restarted application servers                       │
│ - Enabled read replicas                               │
└────────────────────────────────────────────────────────┘
         │
         │ 2 minutes (System coming back online)
         ▼
┌────────────────────────────────────────────────────────┐
│ 14:45:00 - SERVICE RESTORED ◄── Recovery              │
│ Checkout working again for customers                  │
│ ◄── Mean Time to Recover: 12 minutes (detection→restore)
└────────────────────────────────────────────────────────┘
         │
         │ 10 minutes (Testing, monitoring, documentation)
         ▼
┌────────────────────────────────────────────────────────┐
│ 14:55:00 - VERIFICATION COMPLETE                      │
│ - All systems stable                                   │
│ - Load testing passed                                  │
│ - Error rate back to normal                           │
└────────────────────────────────────────────────────────┘
         │
         │ 5 minutes (Post-incident tasks)
         ▼
┌────────────────────────────────────────────────────────┐
│ 15:00:00 - INCIDENT CLOSED ◄── Resolution             │
│ - Documentation completed                              │
│ - Post-mortem scheduled                               │
│ - Monitoring rules updated                            │
│ ◄── Mean Time to RESOLVE: 27 min (detection→closure)  │
└────────────────────────────────────────────────────────┘
Metrics Breakdown

MTTR Comparison for this incident:

Mean Time to Respond:  2 minutes  (Alert → Acknowledged)
Mean Time to Repair:   15 minutes (Diagnosis → Fix applied)
Mean Time to Recover:  12 minutes (Alert → Service restored)
Mean Time to Resolve:  27 minutes (Alert → Fully resolved) ◄── Complete picture

Financial Impact:
├─ Downtime: 12 minutes
├─ Revenue loss: $600,000 ($50K/min × 12)
└─ Resolution cost: ~$500 (engineer time)

If MTTR was 60 minutes instead:
├─ Revenue loss: $3,000,000
└─ Customer trust: Severely damaged
```
