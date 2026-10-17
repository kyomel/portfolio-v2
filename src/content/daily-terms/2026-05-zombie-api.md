---
title: "Zombie API"
termSlug: "zombie-api"
year: 2026
month: 5
monthName: "May"
day: 15
order: 11
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "A Zombie API is an endpoint or service that remains exposed and operational long after its intended lifespan—often forgotten, undocumented, and unowned—yet continues to respond to traffic. It is ne..."
---
### Definition:

A Zombie API is an endpoint or service that remains exposed and operational long after its intended lifespan—often forgotten, undocumented, and unowned—yet continues to respond to traffic. It is neither properly alive (actively maintained, monitored, or documented) nor properly dead (fully decommissioned). Like actual zombies, these APIs wander the infrastructure unnoticed until they create serious problems.

Analogy: Imagine an employee who left the company five years ago, but their keycard was never deactivated. The badge still opens a back door that no security guard patrols. One day, someone finds it and walks right in.

The Anatomy of a Zombie
Healthy API	Zombie API
Actively maintained and versioned.	Running on an old host or path everyone forgot.
Documented in the developer portal.	Exists only in a legacy config file or load-balancer rule.
Monitored by security tools and dashboards.	Generates no alerts; traffic is invisible to current teams.
Follows current security policies.	Uses outdated auth, weak encryption, or over-permissive scopes.

### Example:

FlashCart" E-Commerce

```
In 2022, the engineering team at FlashCart rushes out a Black Friday promotion. A contractor spins up a temporary tax-calculation endpoint:

POST /legacy/v1/checkout/calculate-tax
It runs in an isolated container, has no rate limiting, and returns raw customer addresses alongside tax amounts. It gets the company through the holiday.

2023: The company rebuilds checkout on a new platform. The official docs point everyone to /api/v2/tax, and the team assumes the old path was shut down. But the original container was never deleted; it was just disconnected from the main load balancer and left running in a staging subnet that still has a public route.

2025: No current engineer knows calculate-tax exists. It is not in the API catalog, not covered by the quarterly penetration tests, and not routed through the modern Web Application Firewall.

Then an attacker scans the domain, discovers the forgotten path, and finds that:

It still accepts the company’s old API key format (no longer rotated).
It returns full customer addresses without the new masking rules.
It has zero logging, so requests go completely unseen.
The attacker exfiltrates data through a doorway the company didn’t know was still open. The Zombie API has bitten the organization.

Why They Matter
Invisible Attack Surface: Security teams cannot protect what they do not know exists.
Compliance Drift: A forgotten endpoint may bypass GDPR deletion rules or PCI logging requirements.
Cost Bloat: Unused containers, IP addresses, and load-balancer rules still incur cloud spend.
```
