---
title: "AMQP (Advanced Message Queuing Protocol)"
termSlug: "amqp-advanced-message-queuing-protocol"
year: 2025
month: 9
monthName: "September"
day: 9
order: 7
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "AMQP (Advanced Message Queuing Protocol) is an open standard messaging protocol that enables reliable, secure, and interoperable message communication between applications and systems. It provides..."
---
### Definition:

AMQP (Advanced Message Queuing Protocol) is an open standard messaging protocol that enables reliable, secure, and interoperable message communication between applications and systems. It provides features like message routing, queuing, reliability guarantees, and security, making it ideal for building distributed systems that need asynchronous communication between components.

**Key Features**

- Message routing: Flexible routing using exchanges and binding keys
- Reliability: Message persistence, acknowledgments, and delivery guarantees
- Interoperability: Works across different platforms and languages
- Security: Built-in authentication, authorization, and encryption
- Flow control: Prevents message overflow and system overload

### Example:

Microservices Communication

```
[Order Service] ──→ [AMQP Exchange] ──→ [Payment Queue] ──→ [Payment Service]
                         │
                         ├──→ [Inventory Queue] ──→ [Inventory Service]
                         │
                         └──→ [Shipping Queue] ──→ [Shipping Service]
```
