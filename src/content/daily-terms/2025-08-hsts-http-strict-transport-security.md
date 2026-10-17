---
title: "HSTS (HTTP Strict Transport Security)"
termSlug: "hsts-http-strict-transport-security"
year: 2025
month: 8
monthName: "August"
day: 27
order: 24
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "HSTS (HTTP Strict Transport Security) is a web security mechanism that forces browsers to only communicate with a website over secure HTTPS connections. Once enabled, it prevents users from acciden..."
---
### Definition:

HSTS (HTTP Strict Transport Security) is a web security mechanism that forces browsers to only communicate with a website over secure HTTPS connections. Once enabled, it prevents users from accidentally visiting the insecure HTTP version of a site, even if they type "http://" in the address bar.

**Key Features**

- Forces HTTPS: Automatically redirects HTTP to HTTPS
- Prevents downgrade attacks: Stops attackers from forcing HTTP connections
- Browser enforcement: Works at the browser level
- Time-based: Policy expires after a specified period

### Example:

- Online Banking Website

```
User types: http://mybank.com
↓
Browser automatically converts to: https://mybank.com
↓
Secure HTTPS connection established ✓
```
