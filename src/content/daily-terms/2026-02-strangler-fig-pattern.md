---
title: "Strangler Fig Pattern"
termSlug: "strangler-fig-pattern"
year: 2026
month: 2
monthName: "February"
day: 24
order: 17
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Strangler Fig Pattern is a software migration strategy that gradually replaces a legacy system by incrementally building a new system around it, piece by piece, until the old system can be safely r..."
---
### Definition:

Strangler Fig Pattern is a software migration strategy that gradually replaces a legacy system by incrementally building a new system around it, piece by piece, until the old system can be safely retired. Named after strangler fig trees that grow around host trees and eventually replace them, this pattern allows you to modernize systems without risky "big bang" rewrites. New features are built in the new system, existing features are migrated incrementally, and both systems coexist during transition using a façade/proxy layer to route requests.

**Key Concepts:**

- Incremental Migration: Replace small pieces over time, not everything at once
- Façade Layer: Proxy/router that directs traffic to old or new system
- Coexistence: Old and new systems run side-by-side during transition
- Low Risk: If migration fails, fall back to old system
- Business Continuity: No downtime, features keep working throughout migration

### Example:

E-commerce Monolith Migration

```
The Problem

Legacy System: PHP Monolith (2014)
├─ User Management
├─ Product Catalog
├─ Shopping Cart
├─ Order Processing
├─ Payment Processing
├─ Email Notifications
└─ Admin Dashboard

Problems:
├─ Slow deployment (1 week release cycle)
├─ Hard to scale (entire monolith must scale)
├─ Technology debt (PHP 5.6, MySQL only)
├─ Can't hire developers (no one wants to work on old stack)
├─ Outages affect everything (no isolation)
└─ Business wants: real-time features, mobile app, AI recommendations

CEO says: "We need to modernize!"

❌ Option 1: Big Bang Rewrite
└─ Stop all feature development for 18 months
└─ Rebuild everything from scratch
└─ Risk: Business dies waiting for new system

✅ Option 2: Strangler Fig Pattern
└─ Incrementally migrate while business continues
└─ New features in new system
└─ Old features work until migrated
Phase 1: Set Up Façade Layer

// Step 1: Create API Gateway (Façade) in front of legacy system

// api-gateway.js (Node.js + Express)

const express = require('express');
const httpProxy = require('http-proxy-middleware');

const app = express();

// Routing configuration
const routingConfig = {
  // Initially, ALL routes go to legacy system
  '/api/users':    { target: 'http://legacy-php:8080', newSystem: false },
  '/api/products': { target: 'http://legacy-php:8080', newSystem: false },
  '/api/orders':   { target: 'http://legacy-php:8080', newSystem: false },
  '/api/payments': { target: 'http://legacy-php:8080', newSystem: false },
};

// Dynamic proxy middleware
app.use('/api/*', (req, res, next) => {
  const path = req.baseUrl;
  const route = Object.keys(routingConfig).find(key => path.startsWith(key));

  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }

  const config = routingConfig[route];

  console.log(`
    Route: ${path}
    Target: ${config.target}
    New System: ${config.newSystem ? 'Yes ✅' : 'No (Legacy)'}
  `);

  // Proxy request to appropriate system
  const proxy = httpProxy.createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Bad Gateway' });
    }
  });

  proxy(req, res, next);
});

app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
  console.log('All traffic currently routed to legacy system');
});

/*
Current state:
┌──────────┐
│  Users   │
└─────┬────┘
      ↓
┌─────────────┐
│ API Gateway │ (New!)
│   :3000     │
└─────┬───────┘
      ↓
┌─────────────┐
│   Legacy    │
│ PHP System  │
│   :8080     │
└─────────────┘

Nothing changed for users, but now we control routing!
*/
Phase 2: Migrate First Feature (User Service)

// Step 2: Build new User Service (Node.js microservice)

// services/user-service/index.js

const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to new MongoDB database
mongoose.connect('mongodb://localhost/users-new');

// User Model (modern!)
const UserSchema = new mongoose.Schema({
  id: String,
  email: { type: String, unique: true, required: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
  preferences: {
    language: String,
    notifications: Boolean
  }
});

const User = mongoose.model('User', UserSchema);

// API Endpoints
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });

    if (!user) {
      // User not migrated yet? Check legacy system!
      const legacyUser = await fetchFromLegacy(req.params.id);

      if (legacyUser) {
        // Migrate user on-the-fly (lazy migration)
        const newUser = await User.create(legacyUser);
        return res.json(newUser);
      }

      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper: Fetch from legacy if needed
async function fetchFromLegacy(userId) {
  const response = await fetch(`http://legacy-php:8080/api/users/${userId}`);
  if (response.ok) {
    return response.json();
  }
  return null;
}

app.listen(3001, () => {
  console.log('User Service running on port 3001');
});

// Step 3: Update API Gateway to route users to new service

// api-gateway.js (UPDATED)

const routingConfig = {
  // Users now go to NEW system! 🎉
  '/api/users':    { target: 'http://user-service:3001', newSystem: true },  // ← Changed!

  // Everything else still legacy
  '/api/products': { target: 'http://legacy-php:8080', newSystem: false },
  '/api/orders':   { target: 'http://legacy-php:8080', newSystem: false },
  '/api/payments': { target: 'http://legacy-php:8080', newSystem: false },
};

/*
New state:
┌──────────┐
│  Users   │
└─────┬────┘
      ↓
┌─────────────┐
│ API Gateway │
│   :3000     │
└─────┬───────┘
      │
  ┌───┴───┐
  ↓       ↓
┌──────┐ ┌──────────┐
│ NEW  │ │ Legacy   │
│Users │ │ Products │
│:3001 │ │ Orders   │
└──────┘ │ Payments │
         │  :8080   │
         └──────────┘

First feature migrated! ✅
Users don't notice any difference!
*/
Phase 3: Gradual Feature Migration

// Months 3-4: Migrate Product Catalog

// services/product-service/index.js
// (Similar structure to user-service)

app.listen(3002);

// Update Gateway:
const routingConfig = {
  '/api/users':    { target: 'http://user-service:3001', newSystem: true },
  '/api/products': { target: 'http://product-service:3002', newSystem: true }, // ← Migrated!
  '/api/orders':   { target: 'http://legacy-php:8080', newSystem: false },
  '/api/payments': { target: 'http://legacy-php:8080', newSystem: false },
};

// Months 5-6: Migrate Order Processing

// services/order-service/index.js
app.listen(3003);

// Update Gateway:
const routingConfig = {
  '/api/users':    { target: 'http://user-service:3001', newSystem: true },
  '/api/products': { target: 'http://product-service:3002', newSystem: true },
  '/api/orders':   { target: 'http://order-service:3003', newSystem: true }, // ← Migrated!
  '/api/payments': { target: 'http://legacy-php:8080', newSystem: false },
};

// Months 7-8: Migrate Payment Processing

// services/payment-service/index.js
app.listen(3004);

// Update Gateway:
const routingConfig = {
  '/api/users':    { target: 'http://user-service:3001', newSystem: true },
  '/api/products': { target: 'http://product-service:3002', newSystem: true },
  '/api/orders':   { target: 'http://order-service:3003', newSystem: true },
  '/api/payments': { target: 'http://payment-service:3004', newSystem: true }, // ← All migrated!
};

/*
Final state:
┌──────────┐
│  Users   │
└─────┬────┘
      ↓
┌─────────────┐
│ API Gateway │
│   :3000     │
└─────┬───────┘
      ↓
┌──────────────────────────┐
│    NEW MICROSERVICES     │
├──────────────────────────┤
│ Users Service    :3001   │
│ Products Service :3002   │
│ Orders Service   :3003   │
│ Payments Service :3004   │
└──────────────────────────┘

Legacy PHP system: No longer receiving traffic! 🎉
*/
Phase 4: Decommission Legacy System

// Month 9: Verification

// Step 1: Monitor traffic to legacy system
console.log('Legacy system traffic: 0 requests/day for 30 days');

// Step 2: Disable legacy routes (but keep system running)
const routingConfig = {
  '/api/users':    { target: 'http://user-service:3001', newSystem: true },
  '/api/products': { target: 'http://product-service:3002', newSystem: true },
  '/api/orders':   { target: 'http://order-service:3003', newSystem: true },
  '/api/payments': { target: 'http://payment-service:3004', newSystem: true },

  // Legacy system route removed!
  // Keep legacy system running as backup for 1 more month
};

// Month 10: Complete shutdown
/*
1. Archive legacy database
2. Shut down legacy PHP servers
3. Celebrate! 🎉

Migration complete:
├─ Duration: 10 months (while business continued)
├─ Downtime: 0 minutes
├─ Features lost: 0
├─ Revenue during migration: Growing! ✅
└─ Developer happiness: Much better! 😊
*/
Results

┌────────────────────────────────────────────────────────┐
│              BEFORE (Legacy Monolith)                  │
├────────────────────────────────────────────────────────┤
│ Technology: PHP 5.6 + MySQL                            │
│ Deployment: 1 week release cycle                       │
│ Scaling: Scale entire monolith                         │
│ Outages: Affect all features                           │
│ Developer velocity: Slow                                │
│ Hiring: Difficult                                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│           AFTER (New Microservices)                    │
├────────────────────────────────────────────────────────┤
│ Technology: Node.js, Python, Go + MongoDB, PostgreSQL  │
│ Deployment: Multiple times per day                     │
│ Scaling: Scale only what needs scaling                 │
│ Outages: Isolated to one service                       │
│ Developer velocity: 10× faster                         │
│ Hiring: Easy (modern stack)                            │
│                                                         │
│ NEW CAPABILITIES:                                       │
│ ├─ Real-time features (WebSockets)                     │
│ ├─ Mobile app (REST APIs)                              │
│ ├─ AI recommendations (Python service)                 │
│ └─ GraphQL support                                     │
└────────────────────────────────────────────────────────┘

BUSINESS IMPACT:
├─ Revenue: Continued growing during migration ✅
├─ Downtime: 0 minutes ✅
├─ Features: All working throughout ✅
├─ Risk: Managed incrementally ✅
└─ ROI: Positive from month 3 (new features!) ✅
```
