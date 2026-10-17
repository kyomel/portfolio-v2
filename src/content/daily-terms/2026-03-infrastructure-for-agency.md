---
title: "Infrastructure For Agency"
termSlug: "infrastructure-for-agency"
year: 2026
month: 3
monthName: "March"
day: 31
order: 22
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Infrastructure for Agency is a concept coined by Matthew Skelton and Manuel Pais — co-authors of Team Topologies — and articulated by AI Product Advisor Stuart Winter-Tear — that describes the rule..."
---
### Definition:

Infrastructure for Agency is a concept coined by Matthew Skelton and Manuel Pais — co-authors of Team Topologies — and articulated by AI Product Advisor Stuart Winter-Tear — that describes the rules, principles, guardrails, and organizational structures that empower groups of humans AND AI agents to act autonomously, make decisions, and deliver value within clearly defined boundaries — without needing constant supervision or centralized control.

"Infrastructure for Agency: rules, principles, guardrails that empower groups of humans and AI Agents to be effective stewards of value flow."
— Matthew Skelton, QCon London 2026

"Team Topologies offers something Agentic AI desperately needs — but cannot invent on its own: Clear boundaries, Stable interfaces, Aligned domains, A culture of collaborative ownership. Team Topologies is the infrastructure for agency itself."
— Stuart Winter-Tear, AI Product Advisor

— teamtopologies.com

### Example:

E-Commerce Company Adopting AI Agents
A retail company deploys AI agents across their engineering organization. Two approaches — one without Infrastructure for Agency, one with.

```
Company applies Team Topologies as Infrastructure for Agency:

Step 1: Define bounded stream-aligned teams (human + AI):

  ┌─────────────────────────────────────────────────────┐
  │  Returns & Refunds Team                             │
  │  Humans: 4 engineers  AI agents: 2                 │
  │                                                     │
  │  Owns ONLY:                                         │
  │    → Return requests                                │
  │    → Refund calculations                            │
  │    → Return shipping labels                         │
  │                                                     │
  │  AI agent context:                                  │
  │    → Return policy rules                            │
  │    → Customer order history (scoped read)           │
  │    → Refund API (scoped write)                      │
  │    → NOTHING ELSE                                   │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  Customer Communications Team                       │
  │  Humans: 3 engineers  AI agents: 1                 │
  │                                                     │
  │  Owns ONLY:                                         │
  │    → Email/SMS templates                            │
  │    → Communication scheduling                       │
  │    → Delivery status messages                       │
  │                                                     │
  │  AI agent context:                                  │
  │    → Communication templates                        │
  │    → Order status (scoped read)                     │
  │    → Email/SMS send API (scoped write)              │
  │    → NOTHING ELSE                                   │
  └─────────────────────────────────────────────────────┘

Step 2: Platform team provides scoped capabilities
  (vending machine model):

  Platform exposes to Returns team:
    GET /orders/{id}/items    ← scoped read ✅
    POST /refunds             ← scoped write ✅
    GET /return-policies      ← read only ✅

  Platform BLOCKS from Returns team:
    GET /customers/payment-methods  ← not needed ❌
    GET /customers/hr-data          ← not their domain ❌
    GET /finance/reports            ← not their domain ❌

Step 3: What the agent actually does now:

  Agent tasked: "Process customer return for Order #5521"
                     │
                     ▼
  Calls: GET /orders/5521/items         ✅ (within scope)
  Calls: GET /return-policies           ✅ (within scope)
  Calculates refund amount              ✅ (within scope)
  Calls: POST /refunds { amount: $49 }  ✅ (within scope)
  Hands off to Communications team:
    "Trigger return confirmation email" ✅ (stable interface)
                     │
                     ▼
  Result:
    ✅ Refund processed in 8 seconds
    ✅ Full audit log of every API call
    ✅ CISO can reason about what AI accessed
    ✅ No GDPR violations — agent only touched what it should
    ✅ COO sleeps at night — bounded, observable, trustworthy
```
