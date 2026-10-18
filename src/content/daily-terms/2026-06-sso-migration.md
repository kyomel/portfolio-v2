---
title: "SSO Migration"
termSlug: "sso-migration"
year: 2026
month: 6
monthName: "June"
day: 4
order: 4
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "SSO migration is the process of moving a company's single sign-on system from one identity provider to another — for example, switching from Okta to Microsoft Entra ID — without locking users out,..."
---
### Definition:

SSO migration is the process of moving a company's single sign-on system from one identity provider to another — for example, switching from Okta to Microsoft Entra ID — without locking users out, breaking app integrations, or forcing everyone to reset their passwords on the same day.

Think of it like changing the locks on every door in a massive office building while employees are still walking through those doors. You can't just swap all the locks at once at 9 AM. Instead, you phase it room by room, test each new key, and keep both the old and new locks working during the transition.

The Core Challenge

```text
                    ┌─────────────────────┐
    Current state:  │       ONE IDP       │   ← e.g., Okta
                    │  (all apps trust it) │
                    └──────┬──────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     ┌────────┐      ┌────────┐      ┌────────┐
     │ GitHub │      │ Jira   │      │  Zoom  │   ...and 80+ more apps
     └────────┘      └────────┘      └────────┘
```

You need to point every single arrow to a new Identity Provider (IdP) — without those apps ever trusting a broken or missing identity.

### Example:

Okta → Microsoft Entra ID

```
A mid-size company with 1,500 employees and 85 SaaS apps decides to migrate from Okta to Microsoft Entra ID (formerly Azure AD). Here's a staged plan:

Phase	What Happens	User Experience
1. Prep	Inventory all 85 apps. Map SAML/OIDC configs from Okta to Entra. Identify which apps support multi-IdP.	Nothing changes.
2. Parallel Run	Entra ID is set up as a second IdP. A pilot group (IT team, 10 people) uses Entra for a week.	Pilot users see a slightly different login page. Everyone else: no change.
3. Phased Cutover	Roll out in waves — Finance dept on Monday, Engineering on Wednesday, etc.	User clicks "Sign in with Google" on Jira → now sees "Sign in with Microsoft" instead. Same username. No password reset.
4. Coexistence	Okta stays live for 2 weeks while Entra handles 100% of traffic. Rollback is one config change away.	Transparent.
5. Decommission	Okta tenant emptied, contracts canceled, old certs revoked.	Done.
```
