---
title: "CoAP (Constrained Application Protocol)"
termSlug: "coap-constrained-application-protocol"
year: 2026
month: 4
monthName: "April"
day: 15
order: 9
source: "2026/apr-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/apr-term.md"
excerpt: "CoAP (Constrained Application Protocol) is a lightweight web protocol designed for resource-constrained devices like IoT sensors, embedded systems, and low-power networks. Think of it as \"HTTP for..."
---
### Definition:

CoAP (Constrained Application Protocol) is a lightweight web protocol designed for resource-constrained devices like IoT sensors, embedded systems, and low-power networks. Think of it as "HTTP for the Internet of Things"—it provides REST-style communication (GET, POST, PUT, DELETE) but uses much less power and bandwidth than HTTP, making it perfect for battery-powered devices communicating over unreliable networks.

Simple analogy:

HTTP = Sending a full letter with envelope, stamp, return address (works great, but wasteful for simple messages)
CoAP = Sending a postcard (just the essential message, minimal overhead, perfect for quick updates)

### Example:

Smart Home Temperature Sensors
Scenario: 50 Temperature Sensors in a Building

```
┌────────────────────────────────────────────────────┐
│  Building IoT Network                              │
└────────────────────────────────────────────────────┘

Floor 1: 10 sensors
Floor 2: 15 sensors           CoAP Server
Floor 3: 12 sensors          (Building Management)
Floor 4: 13 sensors          ┌─────────────────┐
                             │ Raspberry Pi 4  │
        📡                   │ CoAP Endpoint   │
   (6LoWPAN/              ◄─┤ Port: 5683      │
    Zigbee Network)          │ Database        │
        │                    └─────────────────┘
        │                             │
        │                             │
    ┌───▼────────────────────┐        │
    │ Sensor Network         │        │
    │                        │        │
    │ 🌡️ Sensor 001         │◄───────┤ CoAP GET /sensors/001/temp
    │    IP: [fd00::1]       │────────► Response: 23.5°C
    │    Battery: 95%        │        │
    │                        │        │
    │ 🌡️ Sensor 002         │◄───────┤ CoAP Observe /sensors/002/temp
    │    IP: [fd00::2]       │────────► Updates every 5 minutes
    │    Battery: 87%        │        │
    │                        │        │
    │ 🌡️ Sensor 003         │◄───────┤ Multicast to all: /sensors/*/status
    │    IP: [fd00::3]       │────────► All respond with status
    │    Battery: 91%        │        │
    └────────────────────────┘        │
```
