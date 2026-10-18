---
title: "Lift-and-Shift"
termSlug: "lift-and-shift"
year: 2026
month: 7
monthName: "July"
day: 28
order: 19
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "Lift-and-Shift (also called rehosting) is a cloud migration strategy where you move an application from on-premises infrastructure to the cloud with minimal or no code changes. You take the existin..."
---
### Definition:

Lift-and-Shift (also called rehosting) is a cloud migration strategy where you move an application from on-premises infrastructure to the cloud with minimal or no code changes. You take the existing VM, application server, or database as-is — same configuration, same architecture, same dependencies — and run it on cloud infrastructure instead. The "lift" is moving it off your hardware. The "shift" is placing it onto cloud VMs, storage, and networking.

It is the fastest path to the cloud, but it leaves the application's internal architecture untouched. You get the operational benefits of the cloud (elastic infrastructure, pay-as-you-go, managed data centers) without any of the architectural benefits (auto-scaling, managed services, serverless, microservices).

```text
═══════════════════════════════════════════════════════════════
  THE THREE CLOUD MIGRATION STRATEGIES
═══════════════════════════════════════════════════════════════

                    Effort ▼     Benefit ▲

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  REBUILD (Re-architect)                                 │
  │  ───────────────────────                                │
  │  "Build from scratch as cloud-native"                   │
  │                                                         │
  │  • Monolith → Microservices                            │
  │  • VMs → Serverless / Containers                        │
  │  • Self-managed DB → Managed DB (RDS, Aurora)           │
  │  • Hours of effort: 10,000+                             │
  │  • Cloud benefits: FULL                                 │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
                              ▲
                              │
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  REPLATFORM (Lift, Tinker, and Shift)                   │
  │  ──────────────────────────────────────                 │
  │  "Move to cloud, make a few changes"                    │
  │                                                         │
  │  • VM → Managed VM (e.g., Amazon RDS for self-managed   │
  │    MySQL)                                               │
  │  • Change the database connection string                │
  │  • Containerize without changing the app code           │
  │  • Hours of effort: 100-500                             │
  │  • Cloud benefits: PARTIAL                              │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
                              ▲
                              │
                                ┌─────────────────────────────────────────────────────────┐
                                │                                                         │
                                │  LIFT-AND-SHIFT (Rehost)                                │
                                │  ───────────────────────────                             │
                                │  "Move it as-is"                                        │
                                │                                                         │
                                │  • Physical server → EC2 instance                       │
                                │  • On-prem VM → Cloud VM (same OS, same config)        │
                                │  • On-prem DB → Cloud VM running the same DB            │
                                │  • Hours of effort: 10-50 per workload                  │
                                │  • Cloud benefits: MINIMAL (infrastructure only)        │
                                │                                                         │
                                └─────────────────────────────────────────────────────────┘                            
```

### Example:

A visual walkthrough of the 5-question decision framework from the DZone article — helping you decide for each workload whether to lift-and-shift or modernize.

```text
═══════════════════════════════════════════════════════════════
  THE 5-QUESTION DECISION FRAMEWORK
═══════════════════════════════════════════════════════════════

  For EACH workload, ask these 5 questions:

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Q1: Is there a BUSINESS DRIVER for speed?              │
  │      ──────────────────────────────────                 │
  │      • Data center lease expiring? → Lift-and-Shift     │
  │      • M&A deadline to consolidate? → Lift-and-Shift    │
  │      • No urgent timeline? → Consider modernizing       │
  │                                                         │
  │  Q2: Is this workload STRATEGIC or LEGACY?              │
  │      ──────────────────────────────────────             │
  │      • Core business platform (5+ year horizon)?        │
  │        → Modernize — it's worth the investment          │
  │      • End-of-life next year? → Lift-and-Shift          │
  │        (don't invest in what you'll retire)             │
  │                                                         │
  │  Q3: Is the architecture MODERNIZABLE?                  │
  │      ────────────────────────────────────               │
  │      • Well-structured code with tests? → Modernize     │
  │      • 20-year-old spaghetti with no tests?             │
  │        • Option A: Lift-and-Shift (don't touch it)      │
  │        • Option B: Rebuild from scratch                 │
  │        • NEVER: try to refactor untestable spaghetti    │
  │                                                         │
  │  Q4: Does the team have CLOUD SKILLS?                   │
  │      ────────────────────────────────                   │
  │      • Team knows Kubernetes, serverless, RDS?          │
  │        → Modernize confidently                          │
  │      • Team has never touched cloud?                    │
  │        → Lift-and-Shift first, learn cloud basics,      │
    │          then modernize later (strangler fig pattern)   │
    │                                                         │
    │  Q5: What is the COST-BENEFIT over 3 years?             │
    │      ────────────────────────────────────               │
    │      • Lift-and-shift: $50K migration, $10K/mo ops      │
    │        = $410K over 3 years                             │
    │      • Modernize: $300K migration, $5K/mo ops           │
    │        = $480K over 3 years                             │
    │      • Lift-and-shift wins at 3 years.                  │
    │        BUT if the workload runs for 10 years:            │
    │        • Lift-and-shift: $50K + $1.2M = $1.25M          │
    │        • Modernize: $300K + $600K = $900K               │
    │        • Modernize wins at 10 years.                    │
    │      → Decide based on HOW LONG the workload will live. │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
    ═══════════════════════════════════════════════════════════════
      APPLYING THE FRAMEWORK TO 3 REAL WORKLOADS
    ═══════════════════════════════════════════════════════════════
    
    
      WORKLOAD A: Internal CRM (end-of-life next year)
      ─────────────────────────────────────────────────
    
      Q1 (Speed):   No deadline — but not relevant
      Q2 (Strategic?): NO — being replaced by Salesforce in 2025
      Q3 (Modernizable?): Yes — but why would you?
      Q4 (Cloud skills?): Team has skills
      Q5 (Cost over time): Not relevant — workload is temporary
    
      DECISION: ✅ LIFT-AND-SHIFT
    
      Rationale: Moving a system that will be replaced in 12 months
      is the PERFECT use case for lift-and-shift. Moving it as-is
      costs $20K and 3 days. Modernizing it costs $200K and 6
      months — for a system that will be decommissioned anyway.
      Don't invest in what you'll retire.
    
      ┌─────────────────────────────────────────────────────────┐
      │                                                         │
        │  "Lift-and-shift is the right answer when the workload  │
        │   has a known retirement date. You're not building for  │
        │   the future — you're ending a lease."                  │
        │                                                         │
        └─────────────────────────────────────────────────────────┘
      
      
        WORKLOAD B: Customer-facing payments (strategic platform)
        ──────────────────────────────────────────────────────────
      
        Q1 (Speed):   No urgent deadline (9 months to migrate)
        Q2 (Strategic?): YES — 10-year core platform
        Q3 (Modernizable?): Yes — well-structured, good test coverage
        Q4 (Cloud skills?): Team has Kubernetes + RDS experience
        Q5 (Cost over time): Modernize wins at year 4+
      
        DECISION: ✅ MODERNIZE (Replatform → Refactor)
      
        Rationale: This is the team's core platform for the next
        decade. Investing 6 months to modernize (Postgres on RDS,
        containerize the app, add auto-scaling) will save millions
        over 10 years compared to running VMs that replicate the
        same on-prem architecture in the cloud.
      
        ┌─────────────────────────────────────────────────────────┐
        │                                                         │
        │  "Modernize when the workload is strategic AND well-    │
        │   structured. The cost of NOT modernizing compounds     │
        │   every year you run the old architecture in the        │
        │   cloud."                                               │
        │                                                         │
        └─────────────────────────────────────────────────────────┘
      
      
        WORKLOAD C: Legacy mainframe reporting (critical but fragile)
        ───────────────────────────────────────────────────────────
      
        Q1 (Speed):   Must migrate in 4 months (license renewal)
        Q2 (Strategic?): YES — generates regulatory reports
        Q3 (Modernizable?): NO — COBOL on mainframe, no tests,
                             no one understands the full logic
                             Q4 (Cloud skills?): Team knows cloud, doesn't know COBOL
                               Q5 (Cost over time): Lift-and-shift is the ONLY option
                             
                               DECISION: ✅ LIFT-AND-SHIFT (to cloud VM running the same
                                           mainframe emulator)
                             
                               Rationale: This workload is too fragile to touch. The
                               code has no tests, no documentation, and the only person
                               who understood it retired in 2019. Modernizing this would
                               mean either (a) attempting to refactor untestable code
                               (guaranteed failure) or (b) rebuilding from scratch with
                               unknown business rules (guaranteed to miss something).
                               Lift-and-shift to a cloud VM keeps it running exactly as
                               before — and buys time for a proper rebuild.
                             
                               ┌─────────────────────────────────────────────────────────┐
                               │                                                         │
                               │  "When a workload is mission-critical but architect-    │
                               │   urally fragile, lift-and-shift is the SAFE choice.    │
                               │   The cloud isn't the place to take risks you don't     │
                               │   have to."                                             │
                               │                                                         │
                               └─────────────────────────────────────────────────────────┘
```
