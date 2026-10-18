---
title: "Noisy Neighbor"
termSlug: "noisy-neighbor"
year: 2026
month: 8
monthName: "August"
day: 17
order: 13
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "The Noisy Neighbor problem is a performance issue in shared, multi-tenant systems where one tenant's heavy or excessive resource consumption degrades the performance of other tenants sharing the sa..."
---
### Definition:

The Noisy Neighbor problem is a performance issue in shared, multi-tenant systems where one tenant's heavy or excessive resource consumption degrades the performance of other tenants sharing the same infrastructure. Just like a noisy neighbor in an apartment building keeps you up with loud music, a "noisy" tenant in a cloud/VM/database can hog CPU, memory, disk I/O, or bandwidth — slowing down everyone else sharing those resources.

It's the classic fairness failure of multi-tenancy: when multiple customers share pooled infrastructure, one misbehaving (or just extremely active) tenant can create a contention problem that makes the experience worse for everyone. The noisy neighbor doesn't necessarily intend harm — they might just have a legitimate spike (a big batch job, a sudden traffic surge, a heavy query) — but the effect is that other tenants suffer.

```text
THE PROBLEM IN ACTION:
═══════════════════════════════════════════════════════════════

  A SHARED SERVER WITH 3 TENANTS:

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  [Tenant A]    [Tenant B]      [Tenant C]               │
  │  normal load   normal load     EXPLODES!                │
  │  (20% CPU)     (30% CPU)       (300% CPU — spikes)      │
  │                                ▲                        │
  │                                │                        │
  │                       THE NOISY NEIGHBOR                │
  │                       (a runaway batch job / traffic    │
  │                        spike / heavy query)             │
  │                                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  SHARED RESOURCES (CPU, RAM, disk I/O, network)  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                         │
  │  When Tenant C consumes 300% CPU:                       │
  │  • Tenant A's requests now wait longer (latency ↑)     │
  │  • Tenant B's database queries slow down (contention)  │
  │  • Tenant A might even time out or get errors           │
  │                                                         │
  │  Tenants A & B did nothing wrong — but they suffer     │
  │  because of Tenant C. That's the noisy neighbor.        │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

### Example:

A visual walkthrough of the noisy neighbor problem in three common scenarios — and the solutions.

```text
═══════════════════════════════════════════════════════════════
  THE PROBLEM: One tenant runs a huge batch job
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Server: 8 CPU cores, shared by 4 tenants               │
  │                                                         │
  │  Tenant D launches a machine-learning training job      │
  │  that uses ALL 8 cores at 100%                          │
  │                                                         │
  │  Now the other 3 tenants' requests:                     │
  │  • Wait for CPU (scheduling delay)                      │
  │  • Latency goes from 50ms → 500ms                       │
  │  • Some may time out entirely                           │
  │                                                         │
  │  The OTHER tenants didn't change — but their            │
  │  performance collapsed because of Tenant D.            │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```
