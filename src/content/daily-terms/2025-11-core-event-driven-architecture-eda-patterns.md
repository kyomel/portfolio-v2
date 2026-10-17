---
title: "Core Event-Driven Architecture (EDA) Patterns"
termSlug: "core-event-driven-architecture-eda-patterns"
year: 2025
month: 11
monthName: "November"
day: 7
order: 5
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Event-Driven Architecture (EDA) is a design pattern where components communicate through the production and consumption of events. Instead of direct service-to-service calls, systems emit events wh..."
---
### Definition:

Event-Driven Architecture (EDA) is a design pattern where components communicate through the production and consumption of events. Instead of direct service-to-service calls, systems emit events when something significant happens, and interested parties subscribe to and react to these events. This creates loosely coupled, scalable systems where components don't need to know about each other directly.

**Key Properties:**

- Asynchronous communication: Events are processed without blocking the producer
- Loose coupling: Producers and consumers don't directly depend on each other
- Event-first design: Business logic is expressed as events and reactions
- Temporal decoupling: Producers and consumers don't need to be online simultaneously
- Scalable: Easy to add new event consumers without changing producers

**Core Concepts:**

- Events: Immutable facts about what happened in the system
- Event producers: Components that emit events
- Event consumers: Components that react to events
- Event bus/broker: Infrastructure that routes events
- Event store: Persistent storage for events

### Example:

Netflix

```
Event: "User clicked play on Movie X"
Reactions:
• Billing Service: Check subscription status
• Recommendation Service: Update viewing patterns
• Analytics Service: Track engagement metrics
• CDN Service: Pre-cache related content
• UI Service: Update "Continue Watching" list
```
