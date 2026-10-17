---
title: "Observability Lasagna"
termSlug: "observability-lasagna"
year: 2025
month: 11
monthName: "November"
day: 24
order: 16
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Observability Lasagna is a layered approach to system monitoring and troubleshooting where different types of observability data are stacked like layers in lasagna. Each layer provides a different..."
---
### Definition:

Observability Lasagna is a layered approach to system monitoring and troubleshooting where different types of observability data are stacked like layers in lasagna. Each layer provides a different level of detail and perspective, and together they give complete visibility into system health, performance, and behavior.

**Key characteristics:**

- Multiple layers of monitoring data
- Each layer serves a specific purpose
- Layers work together for complete system understanding
- Bottom-up approach: infrastructure → application → business

### Example:

E-Commerce Website Monitoring

```
Layer 4 (Top): Business Metrics 🛒

- Revenue per hour: $50K
- Order completion rate: 94%
- Customer satisfaction: 4.2/5
Layer 3: Application Performance 📱

- Page load time: 2.1 seconds
- API response time: 150ms
- Error rate: 0.5%
- User sessions: 15K active
Layer 2: System Metrics 🖥️

- CPU usage: 65%
- Memory usage: 4.2GB/8GB
- Disk I/O: 45MB/s
- Network latency: 20ms
Layer 1 (Bottom): Infrastructure Logs 📋

- Server logs: "Database connection pool exhausted"
- Network logs: "Packet loss on router R2"
- Security logs: "Failed login attempts from IP X.X.X.X"
```
