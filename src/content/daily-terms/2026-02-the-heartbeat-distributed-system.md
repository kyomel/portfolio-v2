---
title: "The Heartbeat (Distributed System)"
termSlug: "the-heartbeat-distributed-system"
year: 2026
month: 2
monthName: "February"
day: 3
order: 2
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "The Heartbeat is a pattern in distributed systems where nodes (servers, services, or processes) send periodic signals (heartbeats) to indicate they are alive and functioning properly. If a heartbea..."
---
### Definition:

The Heartbeat is a pattern in distributed systems where nodes (servers, services, or processes) send periodic signals (heartbeats) to indicate they are alive and functioning properly. If a heartbeat stops, other nodes in the system assume the silent node has failed and take appropriate action (like routing traffic elsewhere or triggering failover).

**Key Concept:**

- Periodic Signal: "I'm alive!" message sent at regular intervals
- Health Check: Proves the node is responsive and working
- Failure Detection: Absence of heartbeat indicates failure
- Automated Response: System reacts without human intervention

### Example:

Web Server Cluster

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (HAProxy)      │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │ Server 1  │      │ Server 2  │     │ Server 3  │
    │ (Node)    │      │ (Node)    │     │ (Node)    │
    └───────────┘      └───────────┘     └───────────┘

Each server sends heartbeat to load balancer every 3 seconds.
Load balancer expects heartbeat within 10 seconds (3 missed = dead).

Heartbeat Implementation

// server.js - Web Server with Heartbeat

const express = require('express');
const axios = require('axios');

const app = express();
const SERVER_ID = process.env.SERVER_ID || 'server-1';
const SERVER_PORT = process.env.PORT || 3000;
const LOAD_BALANCER_URL = 'http://load-balancer:8080';
const HEARTBEAT_INTERVAL = 3000; // 3 seconds

// Main application logic
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from ' + SERVER_ID,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (alternative to active heartbeat)
app.get('/health', (req, res) => {
  // Check if server is actually healthy
  const isHealthy = checkSystemHealth();

  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      server: SERVER_ID,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: Date.now()
    });
  } else {
    // Report unhealthy state
    res.status(503).json({
      status: 'unhealthy',
      server: SERVER_ID,
      error: 'System degraded'
    });
  }
});

function checkSystemHealth() {
  // Check critical components
  const memoryOK = process.memoryUsage().heapUsed < 500 * 1024 * 1024; // < 500MB
  const dbConnected = checkDatabaseConnection();
  const cpuOK = getCurrentCPU() < 90; // < 90% CPU

  return memoryOK && dbConnected && cpuOK;
}

// HEARTBEAT: Active push to load balancer
function sendHeartbeat() {
  const heartbeatData = {
    server_id: SERVER_ID,
    timestamp: Date.now(),
    status: 'alive',
    metrics: {
      cpu: getCurrentCPU(),
      memory: process.memoryUsage().heapUsed,
      requests_per_sec: getRequestRate(),
      response_time_ms: getAvgResponseTime()
    }
  };

  axios.post(`${LOAD_BALANCER_URL}/heartbeat`, heartbeatData)
    .then(response => {
      console.log(`✅ [${SERVER_ID}] Heartbeat sent at ${new Date().toISOString()}`);
    })
    .catch(error => {
      console.error(`❌ [${SERVER_ID}] Failed to send heartbeat:`, error.message);
    });
}

// Start heartbeat loop
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
console.log(`🔄 [${SERVER_ID}] Heartbeat started (every ${HEARTBEAT_INTERVAL}ms)`);

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`🚀 [${SERVER_ID}] Server running on port ${SERVER_PORT}`);

  // Send initial heartbeat
  sendHeartbeat();
});

// Graceful shutdown - send final heartbeat
process.on('SIGTERM', () => {
  console.log(`🛑 [${SERVER_ID}] Shutting down gracefully...`);

  // Notify load balancer we're going down
  axios.post(`${LOAD_BALANCER_URL}/shutdown`, {
    server_id: SERVER_ID,
    reason: 'graceful_shutdown'
  }).then(() => {
    process.exit(0);
  });
});
```
