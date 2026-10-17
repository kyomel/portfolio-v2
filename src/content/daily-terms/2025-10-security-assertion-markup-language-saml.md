---
title: "Security Assertion Markup Language(SAML)"
termSlug: "security-assertion-markup-language-saml"
year: 2025
month: 10
monthName: "October"
day: 31
order: 21
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "SAML is an XML-based security standard that enables secure single sign-on (SSO) and identity federation between different organizations. It allows users to authenticate once with an Identity Provid..."
---
### Definition:

SAML is an XML-based security standard that enables secure single sign-on (SSO) and identity federation between different organizations. It allows users to authenticate once with an Identity Provider (IdP) and then access multiple Service Providers (SP) without having to log in again. SAML works by exchanging digitally signed XML documents called "assertions" that contain authentication and authorization information.

**Key Properties:**

- Single Sign-On (SSO): One login for multiple services
- Identity Federation: Share identity across organizations
- XML-based: Structured, standardized format
- Secure: Digital signatures and encryption
- Cross-platform: Works across different systems

**Core Components:**

- Identity Provider (IdP): Authenticates users (e.g., corporate login)
- Service Provider (SP): Provides services (e.g., cloud apps)
- Assertions: XML documents with user information
- SAML Request/Response: Messages exchanged between IdP and SP

### Example:

Company employees need to access multiple cloud services (Gmail, Salesforce, Slack) without logging into each one separately.

```
Employee workflow:
1. 🔐 Log into company portal (IdP) → Enter corporate credentials ONCE
2. ✅ Click Gmail → Automatically logged in
3. ✅ Click Salesforce → Automatically logged in
4. ✅ Click Slack → Automatically logged in
5. ✅ Click Office 365 → Automatically logged in

Benefits:
✅ Single login experience
✅ Centralized identity management
✅ Enhanced security
✅ Reduced IT overhead
```
