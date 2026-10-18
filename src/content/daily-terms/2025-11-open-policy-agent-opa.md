---
title: "Open Policy Agent(OPA)"
termSlug: "open-policy-agent-opa"
year: 2025
month: 11
monthName: "November"
day: 26
order: 18
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Open Policy Agent (OPA) is a general-purpose policy engine that enables unified policy enforcement across different systems and services. It allows you to write policies as code using a declarative..."
---
### Definition:

Open Policy Agent (OPA) is a general-purpose policy engine that enables unified policy enforcement across different systems and services. It allows you to write policies as code using a declarative language called Rego, and provides a single point of truth for authorization decisions across your entire infrastructure.

**Key characteristics:**

- Policy as Code approach
- Uses Rego query language
- Decouples policy from application logic
- Works across microservices, Kubernetes, APIs, etc.
- Returns simple allow/deny decisions.

### Example:

Company File Access Control
Scenario: Employees need different access levels to company documents.

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Web App   │    │   Mobile    │    │   API       │
│             │    │   App       │    │   Service   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
       "Can John access budget2024.xlsx?"
                          │
              ┌───────────▼───────────┐
              │                       │
              │    Open Policy        │
              │    Agent (OPA)        │
              │                       │
              │  📋 Policy Rules      │
              │  (Written in Rego)    │
              │                       │
              └───────────┬───────────┘
                          │
                    "YES - Finance users
                     can access budget docs"
```
