---
title: "Principle of Least Privilege(PoLP)"
termSlug: "principle-of-least-privilege-polp"
year: 2025
month: 12
monthName: "December"
day: 11
order: 9
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Principle of Least Privilege (PoLP) is a security concept where users, applications, and systems are granted only the minimum permissions necessary to perform their specific tasks - nothing more. B..."
---
### Definition:

Principle of Least Privilege (PoLP) is a security concept where users, applications, and systems are granted only the minimum permissions necessary to perform their specific tasks - nothing more. By limiting access rights, organizations reduce the attack surface, minimize potential damage from breaches, and prevent accidental or intentional misuse of resources.

**Key characteristics:**

- Grant minimum required access only
- Permissions based on job function
- Temporary elevated access when needed
- Regular access reviews and revocation
- Applies to users, applications, and services

### Example:

Company Employee Access
Scenario: Different employees need different system access

```
With PoLP (Minimum Required Access):

┌─────────────────────────────────────────────────────┐
│              GOOD: LEAST PRIVILEGE                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  New Intern "Alex" receives:                        │
│  ┌─────────────────────────────────────────────┐   │
│  │  ✓ Blog content editor access               │   │
│  │  ✗ No database access                       │   │
│  │  ✗ No admin panel access                    │   │
│  │  ✗ No production server access              │   │
│  │  ✗ No financial records access              │   │
│  │  ✗ No customer data access                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Alex's actual job: Update blog posts ✅           │
│                                                     │
│  BENEFITS:                                          │
│  ✅ Can't accidentally break critical systems      │
│  ✅ No access to sensitive data                    │
│  ✅ If account hacked → minimal damage             │
│                                                     │
└─────────────────────────────────────────────────────┘
```
