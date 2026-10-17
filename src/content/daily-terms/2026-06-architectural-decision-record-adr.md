---
title: "Architectural Decision Record (ADR)"
termSlug: "architectural-decision-record-adr"
year: 2026
month: 6
monthName: "June"
day: 18
order: 14
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "Short, lightweight document that captures a significant architectural decision + context + rationale + trade-offs \"Document the decision, not the details\" Lifecycle: Proposed → Accepted → Deprecate..."
---
### Definition:

- Short, lightweight document that captures a significant architectural 
  decision + context + rationale + trade-offs
- "Document the decision, not the details"
- Lifecycle: Proposed → Accepted → Deprecated → Superseded
- Analogi: Ship's Captain Log — for the next captain who takes the helm 🚢

### Example:

```
Full ADR document (ADR-001) for choosing PostgreSQL over DynamoDB/MongoDB 
for a User Service migration, including:
- Context (2.5M users, strong consistency needed)
- Decision (PostgreSQL 16 on RDS)
- Alternatives Considered (DynamoDB, MongoDB — with honest pros/cons)
- Consequences (positive + negative — no perfect decision)
- Related Decisions (links to ADR-000, ADR-003)
```
