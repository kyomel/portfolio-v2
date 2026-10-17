---
title: "BASE Transaction Models"
termSlug: "base-transaction-models"
year: 2026
month: 7
monthName: "July"
day: 3
order: 3
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "BASE stands for Basically Available, Soft state, Eventually consistent. It is the consistency model used by distributed systems and NoSQL databases — the practical alternative to ACID (Atomicity, C..."
---
### Definition:

BASE stands for Basically Available, Soft state, Eventually consistent. It is the consistency model used by distributed systems and NoSQL databases — the practical alternative to ACID (Atomicity, Consistency, Isolation, Durability) when your system is too large for a single database and must be spread across many servers, regions, or data centers.

The core trade-off is simple:

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   ACID                         vs.          BASE             │
│   (SQL, traditional DBs)                  (NoSQL, distributed)│
│                                                              │
│   "Correct right now"                      "Correct... eventually"│
│   Strong consistency                      Weak/eventual consistency│
│   Low availability risk                   High availability     │
│   Hard to scale horizontally              Easy to scale         │
│   Single-node friendly                    Distributed by design  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

### Example:

A visual flow comparison of how ACID vs. BASE handle the same scenario — an e-commerce inventory update when a customer buys an item.

Scenario: A popular sneaker drops at 9:00 AM. 10,000 people try to buy the last 100 pairs. The inventory system is spread across 3 data centers (US-East, EU-West, Asia-Pacific).

```
✅ BASE Approach (Available first, consistent later):

Time │  US-East          │  EU-West           │  Asia-Pacific
─────┼───────────────────┼───────────────────┼───────────────────
9:00 │ Customer A buys   │ Customer X buys    │ Customer Y buys
     │ pair #42          │ pair #42           │ pair #42
     │                   │                    │
     │ Accept immediately│ Accept immediately │ Accept immediately
     │ (no lock, no sync)│ (no lock, no sync) │ (no lock, no sync)
     │                   │                    │
     │ "✅ Order         │ "✅ Order          │ "✅ Order
     │  confirmed!"      │  confirmed!"       │  confirmed!"
     │                   │                    │
9:00 │ Local stock: 99   │ Local stock: 99    │ Local stock: 99
:01  │                   │                    │
     │ (orders keep      │ (orders keep       │ (orders keep
     │  flowing)         │  flowing)          │  flowing)
     │                   │                    │
9:02 │                   │ SYNC BEGINS        │
     │                   │ ───────────────    │
     │                   │ US-East says: 85   │
     │                   │ EU-West says: 82   │
     │                   │ Asia says: 88      │
     │                   │                    │
     │ ⚠️ CONFLICT DETECTED!                  │
     │   All 3 regions sold pairs #42-100     │
     │   Total orders: 53 pair sold           │
     │   Actual inventory: 100 pairs          │
          │   Oversold: 53 orders for 100 pairs?   │
          │   → NO: only 100 units exist           │
          │   → 53 orders accepted                 │
          │   → 47 customers get "Sorry, sold out" │
          │   → 6 customers get the same pair #42  │
          │                                        │
     9:03 │ RESOLUTION:                            │
          │ ┌──────────────────────────────────┐   │
          │ │ The system accepts ALL orders    │   │
          │ │ during the rush (availability).  │   │
          │ │ Then reconciles:                 │   │
          │ │ • First 100 orders → ship (real) │   │
          │ │ • Orders 101+ → "out of stock"   │   │
          │ │ • Refund + apology to 53         │   │
          │ │   customers (eventual            │   │
          │ │   consistency)                   │   │
          │ └──────────────────────────────────┘   │
          │                   │                    │
     9:04 │ FINAL STATE:                           │
          │ US-East: 100 orders, 100 shipped       │
          │ EU-West: 53 refunded (eventually       │
          │         consistent resolution)          │
          │ Asia: 47 canceled                      │
          │                                        │
          │ Across all 3 regions:                  │
          │ Total orders accepted: 253             │
          │ Total shipped: 100                     │
          │ Total refunded: 153                    │
          │ ✅ System stayed UP through flash sale │
          │ ✅ 253 customers got instant response  │
          │ ✅ Eventually consistent after 4 min   │

Result: 253 orders accepted in 4 minutes (vs. ~12 with ACID). 100 customers get their sneakers. 153 get refunded — frustrating, but the system survived the flash sale without crashing. And with better design (reservation system, stock buffers), the overselling can be minimized.
```
