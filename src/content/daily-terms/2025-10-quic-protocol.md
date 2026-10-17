---
title: "QUIC Protocol"
termSlug: "quic-protocol"
year: 2025
month: 10
monthName: "October"
day: 23
order: 16
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "QUIC (Quick UDP Internet Connections) is a modern transport protocol developed by Google that combines the speed of UDP with the reliability of TCP, while providing built-in encryption and improved..."
---
### Definition:

QUIC (Quick UDP Internet Connections) is a modern transport protocol developed by Google that combines the speed of UDP with the reliability of TCP, while providing built-in encryption and improved performance for web applications. It's designed to reduce connection establishment time, eliminate head-of-line blocking, and provide better performance over unreliable networks.

**Key Properties:**

- UDP-based: Built on top of UDP for speed
- Built-in encryption: TLS 1.3 integrated into the protocol
- Multiplexing: Multiple streams without head-of-line blocking
- Fast connection: 0-RTT and 1-RTT connection establishment
- Connection migration: Survives network changes (WiFi to cellular)

**QUIC vs TCP+TLS:**
| Feature | TCP + TLS | QUIC |
|------------------------|-----------------|-----------------|
| Connection setup | 3-4 round trips | 0-1 round trips |
| Head-of-line blocking | Yes | No |
| Built-in encryption | Separate layer | Integrated |
| Stream multiplexing | No | Yes |
| Connection migration | No | Yes |

### Example:

Problem: Website loading is slow due to multiple round trips and connection setup overhead

Traditional HTTP/2 over TCP+TLS (slow):

```
Client ────────────────────────── Server
   │                                │
   │ TCP SYN                        │
   ├───────────────────────────────▶│ Round Trip 1
   │                      TCP SYN+ACK│
   │◀───────────────────────────────┤
   │ TCP ACK                        │
   ├───────────────────────────────▶│ Round Trip 2
   │                                │
   │ TLS ClientHello                │
   ├───────────────────────────────▶│ Round Trip 3
   │              TLS ServerHello   │
   │◀───────────────────────────────┤
   │ TLS Finished                   │
   ├───────────────────────────────▶│ Round Trip 4
   │                                │
   │ HTTP Request                   │
   ├───────────────────────────────▶│ Round Trip 5
   │               HTTP Response    │
   │◀───────────────────────────────┤

Total: 5 round trips before data transfer
```

HTTP/3 over QUIC (fast):

```
Client ────────────────────────── Server
   │                                │
   │ QUIC Initial (ClientHello +    │
   │ Connection setup + HTTP Request)│
   ├───────────────────────────────▶│ Round Trip 1
   │         QUIC Response +        │
   │         HTTP Response          │
   │◀───────────────────────────────┤

Total: 1 round trip (or 0 with connection resumption)
```
