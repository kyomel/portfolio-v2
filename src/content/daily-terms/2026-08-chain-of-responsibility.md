---
title: "Chain of Responsibility"
termSlug: "chain-of-responsibility"
year: 2026
month: 8
monthName: "August"
day: 24
order: 16
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "Chain of Responsibility is a behavioral design pattern where a request is passed along a chain of handlers, and each handler decides either to process the request or pass it to the next handler in..."
---
### Definition:

Chain of Responsibility is a behavioral design pattern where a request is passed along a chain of handlers, and each handler decides either to process the request or pass it to the next handler in the chain — until one of them handles it. Instead of the sender knowing exactly which object should handle a request, the request flows through a sequence of potential handlers, and the first one that can handle it does.

The core idea: decouple the sender of a request from its receiver. The sender doesn't need to know who will process it or how — it just sends the request into the chain, and the chain figures out which handler is responsible.

THE CHAIN OF RESPONSIBILITY:
═══════════════════════════════════════════════════════════════

  A request enters the chain and flows through handlers:

  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
  │            │   │            │   │            │   │            │
  │  REQUEST   │──►│ Handler A  │──►│ Handler B  │──►│ Handler C  │
  │            │   │            │   │            │   │            │
  └────────────┘   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
                         │                │                │
                    ┌────┴─────┐    ┌────┴─────┐     ┌─────┴─────┐
                    │ Can I    │    │ Can I    │     │ Can I     │
                    │ handle   │    │ handle   │     │ handle    │
                    │ this?    │    │ this?    │     │ this?     │
                    └────┬─────┘    └────┬─────┘     └─────┬─────┘
                         │              │                  │
                   YES ──┴── process    │                  │
                        (chain stops)   │                  │
                                        │                  │
                                   NO ───┘                  │
                            pass to next handler            │
                                                            │
                                                       NO ───┘
                                                  (unhandled —
                                                   or a default
                                                   handler)

### Example:

A visual walkthrough of the Chain of Responsibility pattern in three common real-world uses.

```
═══════════════════════════════════════════════════════════════
  THE PATTERN: HTTP requests flow through middleware handlers
═══════════════════════════════════════════════════════════════

  An incoming HTTP request passes through a chain:

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Request ──► [AUTHENTICATION] ──► [LOGGING] ──►         │
  │                    │                │                   │
  │                    ▼                ▼                   │
  │              can it handle?    can it handle?           │
  │              (check token)     (log the request)        │
  │                    │                │                   │
  │              ┌─────┴────┐     ┌─────┴────┐              │
  │              │ NO token │     │  always  │              │
  │              │ → reject │     │  logs &  │              │
  │              │  401     │     │  passes  │              │
  │              └──────────┘     └──────────┘              │
  │                                                    │
  │         ──► [CACHING] ──► [ROUTING] ──► [final handler] │
  │               │              │                          │
  │         can it handle?  can it handle?                  │
  │         (cache hit?     (which controller?)            │
  │          → return       → call controller)             │
  │         (miss → pass)                                  │
  │                                                         │
  │  Each middleware handler either handles the request     │
  │  or passes it to the next. This chain is how express    │
  │  /Koa/ASP.NET middleware pipelines work.                │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```
