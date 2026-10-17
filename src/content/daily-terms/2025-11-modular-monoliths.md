---
title: "Modular Monoliths"
termSlug: "modular-monoliths"
year: 2025
month: 11
monthName: "November"
day: 12
order: 8
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Modular Monoliths are single deployable applications that are internally organized into well-defined, loosely coupled modules with clear boundaries and interfaces. Unlike traditional monoliths wher..."
---
### Definition:

Modular Monoliths are single deployable applications that are internally organized into well-defined, loosely coupled modules with clear boundaries and interfaces. Unlike traditional monoliths where code is tightly coupled, modular monoliths enforce module separation through architectural patterns while maintaining the operational simplicity of a single deployment unit. They provide the development benefits of microservices (clear boundaries, team ownership) without the operational complexity (distributed systems, network calls, deployment coordination).

**Key Properties:**

- Single deployment unit: One application with multiple internal modules
- Clear module boundaries: Well-defined interfaces between modules
- Loose internal coupling: Modules communicate through defined contracts
- High module cohesion: Related functionality grouped together
- Enforceable separation: Architecture prevents unwanted dependencies
- Team ownership: Different teams can own different modules

**Core Concepts:**

- Modules: Self-contained business domains with clear responsibilities
- Module interfaces: Public APIs that define how modules communicate
- Dependency inversion: Modules depend on abstractions, not implementations
- Shared kernel: Common infrastructure and utilities
- Module boundaries: Logical separation enforced by architecture
- Domain-driven design: Modules aligned with business domains

### Example:

E-commerce platform needs clear separation of concerns but wants to avoid microservices complexity

```
// ✅ MODULAR MONOLITH - WELL-DEFINED MODULE BOUNDARIES
class ModularEcommerceMonolith {
  constructor() {
    console.log('✅ MODULAR MONOLITH ARCHITECTURE');
    console.log('================================');

    this.setupModules();
    this.demonstrateModularStructure();
  }

  setupModules() {
    // Each module has clear boundaries and interfaces
    this.modules = {
      userManagement: new UserManagementModule(),
      productCatalog: new ProductCatalogModule(),
      orderProcessing: new OrderProcessingModule(),
      paymentProcessing: new PaymentProcessingModule(),
      notification: new NotificationModule(),
      shared: new SharedModule()
    };

    // Wire up module dependencies through interfaces
    this.wireModules();
  }

  wireModules() {
    console.log('\n🔌 Wiring Module Dependencies:');

    // Order module depends on interfaces, not implementations
    this.modules.orderProcessing.setUserService(this.modules.userManagement);
    this.modules.orderProcessing.setProductService(this.modules.productCatalog);
    this.modules.orderProcessing.setPaymentService(this.modules.paymentProcessing);
    this.modules.orderProcessing.setNotificationService(this.modules.notification);

    console.log('✅ All modules wired through defined interfaces');
  }

  demonstrateModularStructure() {
    console.log('\n📁 Modular Structure:');
    console.log('/src');
    console.log('  /modules');
    console.log('    /user-management');
    console.log('      /api          ← Public interface');
    console.log('        - UserService.js');
    console.log('        - IUserRepository.js');
    console.log('      /domain       ← Business logic');
    console.log('        - User.js');
    console.log('        - UserValidator.js');
    console.log('      /infrastructure ← Implementation details');
    console.log('        - UserRepository.js');
    console.log('        - UserController.js');
    console.log('');
    console.log('    /product-catalog');
    console.log('      /api');
    console.log('        - ProductService.js');
    console.log('        - IProductRepository.js');
    console.log('      /domain');
    console.log('        - Product.js');
    console.log('        - Inventory.js');
    console.log('      /infrastructure');
    console.log('        - ProductRepository.js');
    console.log('        - ProductController.js');
    console.log('');
    console.log('    /order-processing');
    console.log('      /api');
    console.log('        - OrderService.js');
    console.log('      /domain');
    console.log('        - Order.js');
    console.log('        - OrderWorkflow.js');
    console.log('      /infrastructure');
    console.log('        - OrderRepository.js');
    console.log('        - OrderController.js');
    console.log('');
    console.log('  /shared');
    console.log('    /common');
    console.log('      - Database.js');
    console.log('      - Logger.js');
    console.log('      - Events.js');

    console.log('\n🎯 Module Principles:');
    console.log('✅ Each module has single responsibility');
    console.log('✅ Modules communicate through defined interfaces');
    console.log('✅ Internal implementation is hidden');
    console.log('✅ Clear team ownership per module');
    console.log('✅ Dependencies point inward (dependency inversion)');
  }

  async processOrder(orderData) {
    console.log('\n🛒 MODULAR ORDER PROCESSING EXAMPLE');
    console.log('===================================');

    try {
      // Order module orchestrates through interfaces only
      const result = await this.modules.orderProcessing.processOrder(orderData);

      console.log('✅ Order processed successfully!');
      console.log(`Order ID: ${result.orderId}`);

      return result;

    } catch (error) {
      console.log(`❌ Order processing failed: ${error.message}`);
      throw error;
    }
  }

  demonstrateModuleBenefits() {
    console.log('\n🎉 MODULAR MONOLITH BENEFITS');
    console.log('============================');

    console.log('🏗️ Architecture Benefits:');
    console.log('• Clear module boundaries prevent architectural drift');
    console.log('• Enforced separation through interfaces');
    console.log('• Easy to understand and navigate');
    console.log('• Testable modules in isolation');

    console.log('\n👥 Team Benefits:');
    console.log('• Each team owns specific modules');
    console.log('• Teams can work independently');
    console.log('• Clear contracts between teams');
    console.log('• Reduced coordination overhead');

    console.log('\n🚀 Operational Benefits:');
    console.log('• Single deployment unit');
    console.log('• No network latency between modules');
    console.log('• Shared infrastructure and monitoring');
    console.log('• ACID transactions across modules');
    console.log('• Simpler debugging and testing');

    console.log('\n🔄 Evolution Benefits:');
    console.log('• Can extract modules to microservices later');
    console.log('• Modules evolve independently');
    console.log('• Easy to refactor within module boundaries');
    console.log('• Clear migration path if needed');
  }
}

// Module Implementations
class UserManagementModule {
  constructor() {
    this.repository = new UserRepository();
    console.log('📋 User Management Module initialized');
  }

  // Public interface - what other modules can use
  async getUser(userId) {
    console.log(`🔍 UserModule: Getting user ${userId}`);
    return await this.repository.findById(userId);
  }

  async validateUser(userId) {
    console.log(`✅ UserModule: Validating user ${userId}`);
    const user = await this.getUser(userId);
    return user && user.status === 'active';
  }

  async getUserPreferences(userId) {
    console.log(`⚙️ UserModule: Getting preferences for user ${userId}`);
    const user = await this.getUser(userId);
    return user ? user.preferences : null;
  }

  // Internal methods - not exposed to other modules
  async updateLastLogin(userId) {
    console.log(`📅 UserModule: Updating last login for ${userId}`);
    return await this.repository.updateLastLogin(userId);
  }
}

class ProductCatalogModule {
  constructor() {
    this.repository = new ProductRepository();
    console.log('🛍️ Product Catalog Module initialized');
  }

  // Public interface
  async getProduct(productId) {
    console.log(`📦 ProductModule: Getting product ${productId}`);
    return await this.repository.findById(productId);
  }

  async checkAvailability(productId, quantity) {
    console.log(`📊 ProductModule: Checking availability for ${productId} (qty: ${quantity})`);
    const product = await this.getProduct(productId);
    return product && product.stock >= quantity;
  }

  async reserveProducts(items) {
    console.log(`🔒 ProductModule: Reserving ${items.length} items`);

    for (const item of items) {
      const available = await this.checkAvailability(item.productId, item.quantity);
      if (!available) {
        throw new Error(`Product ${item.productId} not available`);
      }
    }

    // Reserve inventory
    const reservation = {
      reservationId: `res_${Date.now()}`,
      items,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };

    console.log(`✅ ProductModule: Reserved items with ID ${reservation.reservationId}`);
    return reservation;
  }
}

class OrderProcessingModule {
  constructor() {
    this.repository = new OrderRepository();
    this.userService = null;
    this.productService = null;
    this.paymentService = null;
    this.notificationService = null;
    console.log('📋 Order Processing Module initialized');
  }

  // Dependency injection - modules depend on interfaces
  setUserService(userService) {
    this.userService = userService;
  }

  setProductService(productService) {
    this.productService = productService;
  }

  setPaymentService(paymentService) {
    this.paymentService = paymentService;
  }

  setNotificationService(notificationService) {
    this.notificationService = notificationService;
  }

  async processOrder(orderData) {
    console.log('\n📋 OrderModule: Starting order processing workflow...');

    // Step 1: Validate user
    console.log('1️⃣ Validating user...');
    const userValid = await this.userService.validateUser(orderData.userId);
    if (!userValid) {
      throw new Error('Invalid user');
    }
    console.log('   ✅ User validated');

    // Step 2: Reserve products
    console.log('2️⃣ Reserving products...');
    const reservation = await this.productService.reserveProducts(orderData.items);
    console.log(`   ✅ Products reserved: ${reservation.reservationId}`);

    // Step 3: Create order
    console.log('3️⃣ Creating order record...');
    const order = {
      orderId: `order_${Date.now()}`,
      userId: orderData.userId,
      items: orderData.items,
      total: orderData.total,
      status: 'created',
      reservationId: reservation.reservationId,
      createdAt: new Date()
    };

    await this.repository.save(order);
    console.log(`   ✅ Order created: ${order.orderId}`);

    // Step 4: Process payment
    console.log('4️⃣ Processing payment...');
    const paymentResult = await this.paymentService.processPayment({
      orderId: order.orderId,
      amount: order.total,
      paymentMethod: orderData.paymentMethod
    });

    if (!paymentResult.success) {
      console.log('   ❌ Payment failed, cancelling order...');
      await this.cancelOrder(order.orderId);
      throw new Error('Payment processing failed');
    }

    console.log(`   ✅ Payment processed: ${paymentResult.transactionId}`);

    // Step 5: Update order status
    console.log('5️⃣ Finalizing order...');
    order.status = 'confirmed';
    order.paymentId = paymentResult.transactionId;
    await this.repository.save(order);

    // Step 6: Send notifications
    console.log('6️⃣ Sending notifications...');
    await this.notificationService.sendOrderConfirmation(order.userId, order);

    console.log('   ✅ Order processing completed!');
    return order;
  }

  async cancelOrder(orderId) {
    console.log(`❌ OrderModule: Cancelling order ${orderId}`);
    // Implementation for order cancellation
  }
}

class PaymentProcessingModule {
  constructor() {
    console.log('💳 Payment Processing Module initialized');
  }

  async processPayment(paymentData) {
    console.log(`💳 PaymentModule: Processing payment for order ${paymentData.orderId}`);
    console.log(`   Amount: $${paymentData.amount}`);
    console.log(`   Method: ${paymentData.paymentMethod}`);

    // Simulate payment processing
    await this.delay(100);

    // 90% success rate for demo
    const success = Math.random() > 0.1;

    if (success) {
      const result = {
        success: true,
        transactionId: `txn_${Date.now()}`,
        amount: paymentData.amount,
        processedAt: new Date()
      };

      console.log(`   ✅ Payment successful: ${result.transactionId}`);
      return result;
    } else {
      console.log('   ❌ Payment failed: Card declined');
      return { success: false, error: 'Card declined' };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class NotificationModule {
  constructor() {
    console.log('📧 Notification Module initialized');
  }

  async sendOrderConfirmation(userId, order) {
    console.log(`📧 NotificationModule: Sending confirmation for order ${order.orderId}`);
    console.log(`   To: User ${userId}`);
    console.log(`   Subject: Order Confirmation - ${order.orderId}`);
    console.log(`   ✅ Email sent successfully`);
  }

  async sendShippingNotification(userId, trackingInfo) {
    console.log(`📦 NotificationModule: Sending shipping notification`);
    console.log(`   Tracking: ${trackingInfo.trackingNumber}`);
  }
}

class SharedModule {
  constructor() {
    this.database = new Database();
    this.logger = new Logger();
    this.eventBus = new EventBus();
    console.log('🔧 Shared Module initialized');
  }

  getDatabase() {
    return this.database;
  }

  getLogger() {
    return this.logger;
  }

  getEventBus() {
    return this.eventBus;
  }
}

// Infrastructure implementations
class UserRepository {
  async findById(userId) {
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      preferences: { notifications: true, language: 'en' }
    };
  }

  async updateLastLogin(userId) {
    console.log(`📝 Database: Updated last login for user ${userId}`);
  }
}

class ProductRepository {
  async findById(productId) {
    return {
      id: productId,
      name: `Product ${productId}`,
      price: 99.99,
      stock: 50
    };
  }
}

class OrderRepository {
  constructor() {
    this.orders = new Map();
  }

  async save(order) {
    this.orders.set(order.orderId, order);
    console.log(`📝 Database: Saved order ${order.orderId}`);
  }

  async findById(orderId) {
    return this.orders.get(orderId);
  }
}

class Database {
  constructor() {
    console.log('🗄️ Database connection established');
  }
}

class Logger {
  constructor() {
    console.log('📝 Logger initialized');
  }
}

class EventBus {
  constructor() {
    console.log('📡 Event bus initialized');
  }
}

// Advanced Modular Monolith Patterns
class AdvancedModularPatterns {
  demonstrateModuleEvolution() {
    console.log('\n🔄 MODULE EVOLUTION STRATEGIES');
    console.log('==============================');

    console.log('📈 Evolution Path:');
    console.log('1. Start: Traditional Monolith');
    console.log('   ↓ (Refactor to modules)');
    console.log('2. Modular Monolith');
    console.log('   ↓ (Extract high-value modules)');
    console.log('3. Hybrid: Some microservices + modular monolith');
    console.log('   ↓ (Continue selective extraction)');
    console.log('4. Full Microservices (if needed)');

    console.log('\n🎯 When to Extract a Module:');
    console.log('✅ Different scaling requirements');
    console.log('✅ Different team/technology preferences');
    console.log('✅ Regulatory/security boundaries');
    console.log('✅ Performance bottlenecks');
    console.log('✅ High-value business domain');

    console.log('\n❌ Don\'t Extract If:');
    console.log('• Tight coupling with other modules');
    console.log('• Low change frequency');
    console.log('• Complex cross-module transactions');
    console.log('• Small team that owns multiple modules');
  }

  showModularPatterns() {
    console.log('\n🏗️ ADVANCED MODULAR PATTERNS');
    console.log('============================');

    console.log('🔌 Dependency Inversion:');
    console.log('• Modules depend on interfaces, not implementations');
    console.log('• High-level modules don\'t depend on low-level modules');
    console.log('• Both depend on abstractions');

    console.log('\n📡 Event-Driven Communication:');
    console.log('• Modules publish domain events');
    console.log('• Other modules subscribe to relevant events');
    console.log('• Reduces coupling between modules');

    console.log('\n🛡️ Module Boundaries Enforcement:');
    console.log('• Architecture tests validate boundaries');
    console.log('• Package visibility rules');
    console.log('• Build-time dependency checking');

    console.log('\n🔄 Shared Kernel:');
    console.log('• Common utilities and infrastructure');
    console.log('• Carefully managed shared code');
    console.log('• Versioned and backward compatible');
  }
}
```
