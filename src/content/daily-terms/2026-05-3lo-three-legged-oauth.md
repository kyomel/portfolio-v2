---
title: "3LO (Three-Legged OAuth)"
termSlug: "3lo-three-legged-oauth"
year: 2026
month: 5
monthName: "May"
day: 20
order: 14
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "3LO is an authorization pattern where a user grants a third-party application limited access to their data hosted by a service provider—without ever sharing their password. The “three legs” are the..."
---
### Definition:

3LO is an authorization pattern where a user grants a third-party application limited access to their data hosted by a service provider—without ever sharing their password. The “three legs” are the three distinct parties involved: the User, the Client App, and the Authorization/Resource Server.

It is the standard flow you see when an app asks you to “Log in with Google” or “Connect to GitHub.”

2LO vs. 3LO
Parties Involved	When It’s Used
2LO (Two-Legged)	App ↔ Server only	Machine-to-machine, background jobs, microservices talking to each other.
3LO (Three-Legged)	User ↔ App ↔ Server	An app needs to do something on behalf of a specific person.
Simple Analogy: The Dog Walker
You hire a dog walker to pick up your pet from your apartment.

You (User) own the home.
Dog Walker (Client App) needs to get inside.
Smart Lock Company (Authorization Server) manages access.
You do not give the walker your personal front-door key (your password). Instead, you open your smart-lock app and issue them a temporary, limited code that only unlocks the door and expires at 3 PM. The walker gets in, but they never had your real key, they cannot access your bedroom, and the code stops working after the job.

### Example:

“CalendarSync” App
A new productivity app called CalendarSync wants to read your Google Calendar to suggest meeting times.

```
Leg 1 — The Ask
CalendarSync redirects you to Google’s authorization page:

“CalendarSync wants to view your calendars. Approve?”

Leg 2 — The Consent
You log in directly on Google (never typing your password into CalendarSync) and click Allow. Google issues a short-lived authorization code and sends it back to CalendarSync.

Leg 3 — The Access
CalendarSync trades that code with Google for an access token. It then uses this token to call Google’s Calendar API and fetch your events.

Result: CalendarSync works on your behalf, Google retains control, and your actual password never left Google’s servers.
```
