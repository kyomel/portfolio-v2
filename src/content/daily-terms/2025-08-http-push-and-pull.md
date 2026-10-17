---
title: "HTTP Push and Pull"
termSlug: "http-push-and-pull"
year: 2025
month: 8
monthName: "August"
day: 1
order: 1
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "HTTP Pull: Traditional HTTP model where the client initiates requests to the server to retrieve data. The server responds only when requested. HTTP Push: Server-initiated communication where the se..."
---
### Definition:

- HTTP Pull: Traditional HTTP model where the client initiates requests to the server to retrieve data. The server responds only when requested.
- HTTP Push: Server-initiated communication where the server sends data to the client without the client explicitly requesting it at that moment.

### Example:

- HTTP Pull:

```
REST API calls
GET /api/users/123
```

- HTTP Push:
  Server-Sent Events (SSE)
  WebSocket
  Push Notifications
  HTTP/2 Server Push
