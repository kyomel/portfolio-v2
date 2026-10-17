---
title: "Two-Phase Commit(2PC)"
termSlug: "two-phase-commit-2pc"
year: 2025
month: 10
monthName: "October"
day: 22
order: 15
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Two-Phase Commit (2PC) is a distributed transaction protocol that ensures all participants in a distributed system either commit or abort a transaction together, maintaining consistency across mult..."
---
### Definition:

Two-Phase Commit (2PC) is a distributed transaction protocol that ensures all participants in a distributed system either commit or abort a transaction together, maintaining consistency across multiple databases or services. It uses a coordinator to manage the process in two phases: first asking all participants if they can commit (prepare phase), then telling them to actually commit or abort based on the responses.

**Key Properties:**

- Atomic transactions: All participants commit or all abort (no partial commits)
- Coordinator-driven: Central coordinator manages the protocol
- Two phases: Prepare phase + Commit/Abort phase
- Blocking protocol: Participants wait for coordinator decisions
- ACID compliance: Maintains transaction consistency across systems

**How It Works:**

- Phase 1 (Prepare): Coordinator asks all participants "Can you commit?"
- Participants respond: "Yes" (prepared) or "No" (abort)
- Phase 2 (Commit/Abort): Coordinator tells all participants the final decision
- Acknowledgment: Participants confirm completion

### Example:

E-commerce Order

```
class EcommerceOrderCoordinator {
  constructor() {
    this.coordinator = new TwoPhaseCommitCoordinator();

    // Setup participants
    this.inventory = new InventoryService();
    this.payment = new PaymentService();
    this.shipping = new ShippingService();

    this.coordinator.addParticipant(this.inventory);
    this.coordinator.addParticipant(this.payment);
    this.coordinator.addParticipant(this.shipping);
  }

  async processOrder(order) {
    console.log(`🛒 Processing order ${order.id}`);

    const transactionData = {
      'InventoryService': {
        action: 'reserve',
        productId: order.productId,
        quantity: order.quantity
      },
      'PaymentService': {
        action: 'charge',
        customerId: order.customerId,
        amount: order.total,
        paymentMethod: order.paymentMethod
      },
      'ShippingService': {
        action: 'schedule',
        address: order.shippingAddress,
        productId: order.productId,
        quantity: order.quantity
      }
    };

    return await this.coordinator.executeTransaction(transactionData);
  }
}

class InventoryService {
  constructor() {
    this.name = 'InventoryService';
    this.reservations = new Map();
  }

  async prepare(transactionId, data) {
    const { productId, quantity } = data[this.name];

    // Check if we have enough inventory
    const available = await this.getAvailableInventory(productId);

    if (available < quantity) {
      console.log(`📦 Not enough inventory: ${available} < ${quantity}`);
      return false;
    }

    // Reserve the inventory
    this.reservations.set(transactionId, { productId, quantity });
    await this.reserveInventory(productId, quantity);

    console.log(`📦 Reserved ${quantity} units of product ${productId}`);
    return true;
  }

  async commit(transactionId) {
    const reservation = this.reservations.get(transactionId);

    // Finalize the reservation (move from reserved to sold)
    await this.confirmSale(reservation.productId, reservation.quantity);
    this.reservations.delete(transactionId);

    console.log(`📦 Inventory committed for transaction ${transactionId}`);
  }

  async abort(transactionId) {
    const reservation = this.reservations.get(transactionId);

    if (reservation) {
      // Release the reserved inventory
      await this.releaseReservation(reservation.productId, reservation.quantity);
      this.reservations.delete(transactionId);

      console.log(`📦 Inventory reservation released for transaction ${transactionId}`);
    }
  }
}

class PaymentService {
  constructor() {
    this.name = 'PaymentService';
    this.preAuthorizations = new Map();
  }

  async prepare(transactionId, data) {
    const { customerId, amount, paymentMethod } = data[this.name];

    try {
      // Pre-authorize the payment
      const authResult = await this.preAuthorizePayment(paymentMethod, amount);

      if (!authResult.success) {
        console.log(`💳 Payment pre-authorization failed: ${authResult.error}`);
        return false;
      }

      this.preAuthorizations.set(transactionId, {
        authorizationId: authResult.authorizationId,
        amount,
        paymentMethod
      });

      console.log(`💳 Payment pre-authorized: $${amount}`);
      return true;

    } catch (error) {
      console.log(`💳 Payment prepare failed:`, error.message);
      return false;
    }
  }

  async commit(transactionId) {
    const preAuth = this.preAuthorizations.get(transactionId);

    // Capture the pre-authorized payment
    await this.capturePayment(preAuth.authorizationId, preAuth.amount);
    this.preAuthorizations.delete(transactionId);

    console.log(`💳 Payment captured for transaction ${transactionId}`);
  }

  async abort(transactionId) {
    const preAuth = this.preAuthorizations.get(transactionId);

    if (preAuth) {
      // Void the pre-authorization
      await this.voidPreAuthorization(preAuth.authorizationId);
      this.preAuthorizations.delete(transactionId);

      console.log(`💳 Payment pre-authorization voided for transaction ${transactionId}`);
    }
  }
}

// Usage
const orderProcessor = new EcommerceOrderCoordinator();

const order = {
  id: 'ORD-123',
  customerId: 'CUST-456',
  productId: 'PROD-789',
  quantity: 2,
  total: 199.98,
  paymentMethod: 'credit-card-token',
  shippingAddress: '123 Main St, City, State'
};

orderProcessor.processOrder(order);
// Output:
// 🛒 Processing order ORD-123
// 📋 Phase 1: Prepare (Transaction txn_1234567890_abc123)
//   📦 Reserved 2 units of product PROD-789
//   💳 Payment pre-authorized: $199.98
//   🚚 Shipping scheduled
// ✅ Phase 2: Commit (Transaction txn_1234567890_abc123)
//   📦 Inventory committed
//   💳 Payment captured
//   🚚 Shipping confirmed
// ✅ Transaction committed successfully
```
