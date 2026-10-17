---
title: "Read-Replica Pattern"
termSlug: "read-replica-pattern"
year: 2025
month: 9
monthName: "September"
day: 24
order: 18
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "he Read-Replica Pattern is a database architecture where you have one primary (master) database that handles all writes, and multiple read-only copies (replicas) that handle read queries. This sepa..."
---
### Definition:
he Read-Replica Pattern is a database architecture where you have one primary (master) database that handles all writes, and multiple read-only copies (replicas) that handle read queries. This separates read and write operations to improve performance and scalability.

**How It Works**
Primary database: Handles all INSERT, UPDATE, DELETE operations
Read replicas: Handle all SELECT queries
Data synchronization: Changes flow from primary to replicas
Load distribution: Spread read traffic across multiple replicas

### Example:
E-commerce Website
```
👥 Users writing reviews/orders ──► 📊 Primary DB (Writes only)
                                      │
                                      ├── Sync ──► 📖 Read Replica 1
                                      ├── Sync ──► 📖 Read Replica 2  
                                      └── Sync ──► 📖 Read Replica 3
                                                    ▲
👥 Users browsing products ──────────────────────┘
   (Product listings, search, reviews)
```
