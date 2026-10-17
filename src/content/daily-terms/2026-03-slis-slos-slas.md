---
title: "SLIs/SLOs/SLAs"
termSlug: "slis-slos-slas"
year: 2026
month: 3
monthName: "March"
day: 11
order: 8
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "SLI, SLO, and SLA are three related concepts used in Site Reliability Engineering (SRE) to define, measure, and commit to the reliability and performance of a service. Think of it as: SLI is what y..."
---
### Definition:

SLI, SLO, and SLA are three related concepts used in Site Reliability Engineering (SRE) to define, measure, and commit to the reliability and performance of a service.

| Term | Full Name               | One-Line Definition                     |
| ---- | ----------------------- | --------------------------------------- |
| SLI  | Service Level Indicator | The metric you measure                  |
| SLO  | Service Level Objective | The target you set for that metric      |
| SLA  | Service Level Agreement | The contract you sign with consequences |

Think of it as: SLI is what you measure, SLO is what you aim for, SLA is what you promise (with penalties if broken).

Simple Analogy
🚗 Imagine a taxi service:

SLI = the actual time it takes for a cab to arrive (measured in minutes)
SLO = internal goal: "cabs should arrive within 10 minutes 95% of the time"
SLA = the contract with customers: "if your cab takes more than 15 minutes, you get a refund"

Visual Relationship

     What you          What you           What you
      MEASURE            TARGET             PROMISE
        │                  │                  │
        ▼                  ▼                  ▼

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ SLI │───▶│ SLO │───▶│ SLA │
│ (metric) │ │ (goal) │ │ (contract) │
└─────────────┘ └─────────────┘ └─────────────┘
"Our uptime "We aim for "We guarantee
is 99.97%" 99.9% up" 99.5% or
refund"
SLO is always stricter than SLA — you aim higher internally so you have a buffer before breaching the customer contract.

### Example:

Imagine you run a payment processing API like Stripe.

```
SLI 1 — Availability:
  "% of API requests that return HTTP 200"
  → Currently: 99.95%

SLI 2 — Latency:
  "p99 response time of /charge endpoint"
  → Currently: 210ms

SLI 3 — Error Rate:
  "% of payment requests returning 5xx errors"
  → Currently: 0.04%

SLO 1 — Availability:
  "99.9% of requests must succeed per 30-day window"
  Error budget = 43.2 minutes downtime allowed/month

SLO 2 — Latency:
  "p99 latency must stay under 300ms"

SLO 3 — Error Rate:
  "Error rate must stay below 0.1%"

SLA (published to customers):

"We guarantee 99.5% monthly uptime.

 If we fall below:
 → 99.5%: 10% account credit
 → 99.0%: 25% account credit
 → 98.0%: 50% account credit

 Measured monthly. Credits applied automatically."

The buffer in practice:

Internal SLO target → 99.9%  (what the team aims for)
SLA guarantee       → 99.5%  (what customers are promised)
Buffer              →  0.4%  (room to fix issues before SLA breaches)
The gap between SLO and SLA is intentional — it gives the team breathing room before a real contractual breach occurs. 🛡️
```
