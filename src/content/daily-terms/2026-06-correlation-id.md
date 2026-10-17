---
title: "Correlation ID"
termSlug: "correlation-id"
year: 2026
month: 6
monthName: "June"
day: 8
order: 6
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "A Correlation ID is a unique identifier attached to a request that travels with it across every service it touches in a distributed system. It's the breadcrumb trail that lets you trace a single us..."
---
### Definition:

A Correlation ID is a unique identifier attached to a request that travels with it across every service it touches in a distributed system. It's the breadcrumb trail that lets you trace a single user action through dozens of microservices, message queues, and databases.

In one sentence: Tag a request at the door with a unique ID, then use that ID to follow it everywhere it goes.

Analogy — The Package Tracking Number
Imagine you order a jacket online. The order triggers a chain of events:

🛒 Order 📦 Warehouse 🚚 Shipping 🏠 Delivery
System → System → Provider → Confirmation
Without a tracking number With a tracking number
"Where's my order??" → Shrug. Call every department. Enter tracking # → See exactly where it is
Warehouse error? Nobody knows which order is affected. "Order #TRK-8821 failed at warehouse — re-pick it"
Customer complains? 20-minute investigation across 5 systems. Search logs for TRK-8821 → instant full timeline
A Correlation ID is that tracking number — for every single request inside your system.

How It Works

Client Service A Service B Service C
│ │ │ │
│ GET /order/42 │ │ │
│ X-Correlation-ID: abc │ │ │
│─────────────────────────▶│ │ │
│ │ POST /inventory │ │
│ │ X-Correlation-ID: abc │
│ │───────────────────▶│ │
│ │ │ PUBLISH order.paid│
│ │ │ correlationId=abc │
│ │ │───────────────────▶│
│ │ │ │
│ ◀─── 200 OK ───────────│◀───────────────────│◀───────────────────│
│ │ │ │
▼ ▼ ▼ ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Every log line, every message, every DB row stamped with: "abc" │
│ Search "abc" → full timeline instantly │
└──────────────────────────────────────────────────────────────────────┘

### Example:

End-to-End in a Microservice System

```
1️⃣ Frontend / Gateway — Create or Forward the ID

# API Gateway (or first service that handles the request)
from flask import Flask, request
import uuid
import requests

app = Flask(__name__)

@app.before_request
def attach_correlation_id():
    # If the caller already sent one, use it. Otherwise, create it.
    correlation_id = request.headers.get('X-Correlation-ID')
    if not correlation_id:
        correlation_id = str(uuid.uuid4())

    # Store it so every downstream call can access it
    request.correlation_id = correlation_id
    print(f"🔖 [{correlation_id}] Request started: {request.method} {request.path}")

@app.route('/order', methods=['POST'])
def create_order():
    order_data = request.json
    cid = request.correlation_id

    print(f"📦 [{cid}] Creating order for: {order_data['item']}")

    # Call service B — PASS THE CORRELATION ID
    resp = requests.post(
        "http://inventory-service/check",
        json={"item_id": order_data["item"]},
        headers={"X-Correlation-ID": cid}        # ← THE KEY LINE
    )
    print(f"📋 [{cid}] Inventory responded: {resp.status_code}")
    return {"status": "ok", "correlation_id": cid}
2️⃣ Middle Service — Receive It, Log It, Forward It

# Inventory Service
from flask import Flask, request

app = Flask(__name__)

@app.route('/check', methods=['POST'])
def check_inventory():
    cid = request.headers.get('X-Correlation-ID', 'no-cid')

    print(f"🏭 [{cid}] Checking inventory for item_id={request.json['item_id']}")
    print(f"🏭 [{cid}] Stock found: 23 units")

    # Simulate a database insert with correlation ID
    # INSERT INTO inventory_logs (item_id, action, correlation_id) VALUES (42, 'checked', 'abc')

    return {"available": True}
3️⃣ Logging — The Real Payoff

import logging
import sys

# Structured logging that always includes the correlation ID
formatter = logging.Formatter(
    '{"time": "%(asctime)s", "level": "%(levelname)s", "cid": "%(cid)s", "msg": "%(message)s"}'
)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)

logger = logging.getLogger("service")
logger.addHandler(handler)

# Usage in any service
def log(cid, message, level="info"):
    extra = {"cid": cid}
    getattr(logger, level)(message, extra=extra)

log("abc-123", "Order created")        # {"cid": "abc-123", "msg": "Order created"}
log("abc-123", "Payment processed")    # {"cid": "abc-123", "msg": "Payment processed"}
log("abc-123", "Shipment dispatched")  # {"cid": "abc-123", "msg": "Shipment dispatched"}
4️⃣ Searching — The Magic Moment
Now in your log aggregator (ELK, Splunk, Datadog, Grafana Loki):

# Find EVERYTHING related to a single user request
$ grep "abc-123" /var/log/*.json

[12:03:01] abc-123  →  Gateway:    Request started POST /order
[12:03:01] abc-123  →  Orders:     Creating order for "jacket"
[12:03:02] abc-123  →  Inventory:  Checking stock for item #42
[12:03:02] abc-123  →  Inventory:  Stock: 23 units
[12:03:03] abc-123  →  Payment:    Charging $89.99
[12:03:03] abc-123  →  Payment:    Payment approved
[12:03:04] abc-123  →  Warehouse:  Pick ticket created #WH-551
[12:03:04] abc-123  →  Orders:     Order complete → 200 OK
One search. The full story. Every service. In order.
```
