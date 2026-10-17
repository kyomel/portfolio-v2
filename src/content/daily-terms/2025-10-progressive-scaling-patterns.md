---
title: "Progressive Scaling Patterns"
termSlug: "progressive-scaling-patterns"
year: 2025
month: 10
monthName: "October"
day: 15
order: 10
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Progressive Scaling Patterns are architectural strategies that allow systems to grow incrementally from simple, single-instance setups to complex, distributed systems without requiring complete rew..."
---
### Definition:

Progressive Scaling Patterns are architectural strategies that allow systems to grow incrementally from simple, single-instance setups to complex, distributed systems without requiring complete rewrites. These patterns enable businesses to start small and scale gradually as demand increases, evolving the architecture step-by-step while maintaining functionality and minimizing risk.

**Key Properties:**

- Incremental growth: Scale in manageable steps, not giant leaps
- Backward compatibility: Each stage works with previous components
- Risk mitigation: Gradual changes reduce deployment risks
- Cost optimization: Pay for complexity only when needed
- Smooth transitions: No dramatic architectural overhauls

**Evolution Stages:**
Monolith → 2. Modular Monolith → 3. Microservices → 4. Distributed Systems

### Example

Stage 1: Simple Monolith (MVP - 100 users)

```
// Single Node.js application
const express = require('express');
const sqlite3 = require('sqlite3');

class EcommerceApp {
  constructor() {
    this.app = express();
    this.db = new sqlite3.Database('ecommerce.db');
    this.setupRoutes();
  }

  setupRoutes() {
    // All functionality in one app
    this.app.get('/products', this.getProducts.bind(this));
    this.app.post('/orders', this.createOrder.bind(this));
    this.app.get('/users/:id', this.getUser.bind(this));
    this.app.post('/payments', this.processPayment.bind(this));
  }

  async getProducts(req, res) {
    // Simple database query
    const products = await this.queryDb('SELECT * FROM products');
    res.json(products);
  }

  async createOrder(req, res) {
    const { userId, productIds, paymentInfo } = req.body;

    // Everything happens in one transaction
    await this.db.run('BEGIN TRANSACTION');
    try {
      const orderId = await this.insertOrder(userId, productIds);
      await this.updateInventory(productIds);
      await this.processPayment(paymentInfo);
      await this.sendOrderEmail(userId, orderId);
      await this.db.run('COMMIT');

      res.json({ orderId, status: 'success' });
    } catch (error) {
      await this.db.run('ROLLBACK');
      res.status(500).json({ error: error.message });
    }
  }
}

// Simple deployment
const app = new EcommerceApp();
app.listen(3000, () => console.log('E-commerce running on port 3000'));

// Pros: Simple, fast development, easy debugging
// Cons: Single point of failure, hard to scale specific parts
```

Stage 2: Load Balanced Monolith (1,000 users)

```
// Add load balancer + multiple instances
// nginx.conf
upstream backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}

// Separate database
class EcommerceApp {
  constructor() {
    this.app = express();
    // Move to external database
    this.db = new PostgreSQL({
      host: 'postgres-server',
      database: 'ecommerce',
      pool: { min: 5, max: 20 }
    });

    // Add session store for multiple instances
    this.sessionStore = new RedisStore({
      host: 'redis-server'
    });
  }

  // Same application logic, but now scalable
}

// docker-compose.yml for easy scaling
version: '3.8'
services:
  app:
    build: .
    deploy:
      replicas: 3  # Easy to increase

  postgres:
    image: postgres:13

  redis:
    image: redis:7

  nginx:
    image: nginx
    ports:
      - "80:80"

// Pros: Can handle more load, database separated
// Cons: Still monolithic code, scaling is all-or-nothing
```

Stage 3: Modular Monolith (10,000 users)

```
// Separate modules within same codebase
class EcommerceApp {
  constructor() {
    this.app = express();

    // Modular architecture
    this.productService = new ProductService(this.db);
    this.orderService = new OrderService(this.db);
    this.userService = new UserService(this.db);
    this.paymentService = new PaymentService(this.db);
    this.inventoryService = new InventoryService(this.db);

    this.setupRoutes();
  }

  setupRoutes() {
    // Route to appropriate service
    this.app.use('/products', this.createProductRoutes());
    this.app.use('/orders', this.createOrderRoutes());
    this.app.use('/users', this.createUserRoutes());
    this.app.use('/payments', this.createPaymentRoutes());
  }

  createOrderRoutes() {
    const router = express.Router();

    router.post('/', async (req, res) => {
      const { userId, productIds, paymentInfo } = req.body;

      try {
        // Services communicate through method calls
        const user = await this.userService.getUser(userId);
        const products = await this.productService.getProducts(productIds);
        const inventory = await this.inventoryService.checkAvailability(productIds);

        if (!inventory.available) {
          return res.status(400).json({ error: 'Insufficient inventory' });
        }

        const order = await this.orderService.createOrder(user, products);
        await this.inventoryService.reserveItems(productIds);
        await this.paymentService.processPayment(paymentInfo);

        res.json({ orderId: order.id, status: 'success' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }
}

// Each service is a separate class with clear boundaries
class OrderService {
  constructor(database) {
    this.db = database;
  }

  async createOrder(user, products) {
    return await this.db.orders.create({
      userId: user.id,
      items: products,
      total: products.reduce((sum, p) => sum + p.price, 0),
      status: 'pending'
    });
  }

  async getOrder(orderId) {
    return await this.db.orders.findById(orderId);
  }
}

// Pros: Clear separation of concerns, easier to test modules
// Cons: Still deployed as one unit, shared database
```

Stage 4: Microservices (100,000+ users)

```
// Separate applications for each service

// Product Service (products-service/)
class ProductService {
  constructor() {
    this.app = express();
    this.db = new MongoDB({ collection: 'products' });
    this.cache = new Redis();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.get('/products', async (req, res) => {
      // Check cache first
      const cached = await this.cache.get('products:all');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const products = await this.db.find({});
      await this.cache.setex('products:all', 300, JSON.stringify(products));
      res.json(products);
    });

    this.app.get('/products/:id', async (req, res) => {
      const product = await this.db.findById(req.params.id);
      res.json(product);
    });
  }
}

// Order Service (orders-service/)
class OrderService {
  constructor() {
    this.app = express();
    this.db = new PostgreSQL({ table: 'orders' });
    this.eventBus = new EventBus(); // For communication
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post('/orders', async (req, res) => {
      const { userId, productIds, paymentInfo } = req.body;

      try {
        // Make HTTP calls to other services
        const user = await this.callUserService(userId);
        const products = await this.callProductService(productIds);
        const inventory = await this.callInventoryService(productIds);

        if (!inventory.available) {
          return res.status(400).json({ error: 'Insufficient inventory' });
        }

        // Create order
        const order = await this.createOrder(user, products);

        // Publish events for other services
        await this.eventBus.publish('order.created', {
          orderId: order.id,
          userId,
          productIds,
          total: order.total
        });

        res.json({ orderId: order.id, status: 'pending' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async callUserService(userId) {
    const response = await fetch(`http://user-service:3001/users/${userId}`);
    return await response.json();
  }

  async callProductService(productIds) {
    const response = await fetch(`http://product-service:3002/products`, {
      method: 'POST',
      body: JSON.stringify({ ids: productIds }),
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }
}

// Event-driven communication
class EventBus {
  constructor() {
    this.kafka = new KafkaClient();
  }

  async publish(topic, data) {
    await this.kafka.send({
      topic,
      messages: [{ value: JSON.stringify(data) }]
    });
  }

  async subscribe(topic, handler) {
    await this.kafka.subscribe({ topic });
    await this.kafka.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        await handler(data);
      }
    });
  }
}

// Inventory Service listens for order events
class InventoryService {
  constructor() {
    this.eventBus = new EventBus();
    this.setupEventHandlers();
  }

  async setupEventHandlers() {
    await this.eventBus.subscribe('order.created', async (orderData) => {
      await this.reserveItems(orderData.productIds);

      await this.eventBus.publish('inventory.reserved', {
        orderId: orderData.orderId,
        productIds: orderData.productIds
      });
    });
  }
}
```

Stage 5: Distributed System with Auto-scaling (1M+ users)

```
# Kubernetes deployment with auto-scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    spec:
      containers:
      - name: product-service
        image: ecommerce/product-service:v1.2.0
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

# API Gateway for routing
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ecommerce-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - api.ecommerce.com

apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ecommerce-routes
spec:
  http:
  - match:
    - uri:
        prefix: /products
    route:
    - destination:
        host: product-service
        subset: v1
      weight: 90
    - destination:
        host: product-service
        subset: v2
      weight: 10  # Canary deployment
  - match:
    - uri:
        prefix: /orders
    route:
    - destination:
        host: order-service
```
