---
title: "Backend For Frontend (BFF)"
termSlug: "backend-for-frontend-bff"
year: 2026
month: 2
monthName: "February"
day: 27
order: 20
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "BFF (Backend For Frontend) is an architectural pattern that introduces a dedicated backend layer for each specific frontend client (web, mobile, etc.), acting as a middleman between the frontend an..."
---
### Definition:

BFF (Backend For Frontend) is an architectural pattern that introduces a dedicated backend layer for each specific frontend client (web, mobile, etc.), acting as a middleman between the frontend and backend services.

Instead of one general-purpose backend serving all clients, each frontend gets its own tailored backend.

**Why It Exists**
A single backend serving multiple clients often faces:

| Problem                                | Impact                  |
| -------------------------------------- | ----------------------- |
| Mobile & web have different data needs | Backend becomes bloated |
| Multiple microservices to call         | Frontend gets complex   |
| One team manages all frontends         | Development bottlenecks |

**Visual Architecture**

[ Web App ] → [ BFF for Web ] ↘
[ Core APIs / Microservices ]
[ Mobile App ] → [ BFF for Mobile ] ↗

### Example:

Imagine a banking app with both a web dashboard and a mobile app.

```
Web App    →  [ BFF-Web ]    → fetches full account details + charts data
Mobile App →  [ BFF-Mobile ] → fetches only balance + recent 5 transactions
                               ↓
                     [ Core Banking APIs ]
BFF-Web returns rich data with graphs, tables, and detailed history
BFF-Mobile returns a lightweight response optimized for small screens
```
