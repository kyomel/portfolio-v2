---
title: "Conway's Law"
termSlug: "conways-law"
year: 2025
month: 11
monthName: "November"
day: 6
order: 4
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Conway's Law states that \"organizations which design systems... are constrained to produce designs which are copies of the communication structures of these organizations.\" In simple terms, the sof..."
---
### Definition:

Conway's Law states that "organizations which design systems... are constrained to produce designs which are copies of the communication structures of these organizations." In simple terms, the software architecture you build will mirror how your teams are organized and communicate. If your teams are siloed, your software will be siloed; if your teams collaborate well, your software will be well-integrated.

**Key Properties:**

- Organizational mirror: Software structure reflects team structure
- Communication patterns: How teams talk affects how code is structured
- Inevitable influence: Happens whether you plan for it or not
- Structural constraint: Team boundaries become system boundaries
- Feedback loop: System structure can reinforce organizational structure

**Core Concepts:**

- Team boundaries: Separate teams create separate system components
- Communication overhead: Cross-team coordination creates system coupling
- Ownership domains: Teams own specific parts of the system
- Interface design: Team interactions define system interfaces
- Reverse Conway maneuver: Reorganize teams to get desired architecture

### Example:

cross-functional feature teams

```
🚀 CROSS-FUNCTIONAL FEATURE TEAMS
=================================

User Management Team (5 people)
├── 1 Frontend Developer
├── 1 Backend Developer
├── 1 Mobile Developer
├── 1 Database Expert
└── 1 DevOps Engineer
└── Owns: User registration, authentication, profiles

Product Catalog Team (5 people)
├── 1 Frontend Developer
├── 1 Backend Developer
├── 1 Mobile Developer
├── 1 Database Expert
└── 1 DevOps Engineer
└── Owns: Product display, search, recommendations

Order Processing Team (5 people)
├── 1 Frontend Developer
├── 1 Backend Developer
├── 1 Mobile Developer
├── 1 Database Expert
└── 1 DevOps Engineer
└── Owns: Shopping cart, checkout, order management

Payment Team (5 people)
├── 1 Frontend Developer
├── 1 Backend Developer
├── 1 Mobile Developer
├── 1 Database Expert
└── 1 DevOps Engineer
└── Owns: Payment processing, billing, refunds
```
