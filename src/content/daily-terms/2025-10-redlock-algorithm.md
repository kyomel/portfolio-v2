---
title: "Redlock Algorithm"
termSlug: "redlock-algorithm"
year: 2025
month: 10
monthName: "October"
day: 16
order: 11
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Redlock Algorithm is a distributed locking mechanism designed to create reliable locks across multiple Redis instances. It solves the problem of achieving mutual exclusion in distributed systems by..."
---
### Definition

Redlock Algorithm is a distributed locking mechanism designed to create reliable locks across multiple Redis instances. It solves the problem of achieving mutual exclusion in distributed systems by requiring a majority of Redis nodes to agree on a lock, preventing the issues that can occur with single-point-of-failure locking systems.

**Key Properties:**

- Distributed consensus: Requires majority (N/2 + 1) of Redis nodes to agree
- Fault tolerance: Works even if some Redis instances fail
- Time-based expiration: Locks automatically expire to prevent deadlocks
- Clock drift consideration: Accounts for time differences between nodes
- Mutual exclusion: Only one client can hold a lock at a time

**How It Works:**

1. Acquire lock on majority of Redis instances
2. Check elapsed time is less than lock validity
3. Use the lock for critical section
4. Release lock from all instances
5. Handle failures gracefully

### Example

Payment Processing

```
class PaymentProcessor {
  constructor() {
    this.redlock = new Redlock([
      { host: 'redis-east-1' },
      { host: 'redis-east-2' },
      { host: 'redis-west-1' },
      { host: 'redis-west-2' },
      { host: 'redis-central-1' }
    ]);
  }

  async processPayment(userId, amount, paymentMethod) {
    const lockKey = `payment-lock:${userId}`;

    try {
      // Prevent duplicate payments from same user
      const lock = await this.redlock.lock(lockKey, 30000); // 30 seconds

      console.log(`🔒 Processing payment for user ${userId}`);

      // Check user balance
      const user = await this.getUserAccount(userId);
      if (user.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Process payment with external provider
      const paymentResult = await this.chargePaymentMethod(paymentMethod, amount);

      if (paymentResult.success) {
        // Update user balance
        await this.updateUserBalance(userId, user.balance - amount);

        // Record transaction
        await this.recordTransaction(userId, amount, paymentResult.transactionId);

        console.log(`💰 Payment successful: $${amount} from user ${userId}`);

        await this.redlock.unlock(lock);
        return { success: true, transactionId: paymentResult.transactionId };
      } else {
        await this.redlock.unlock(lock);
        return { success: false, error: paymentResult.error };
      }

    } catch (error) {
      console.error(`❌ Payment failed for user ${userId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async processRefund(transactionId) {
    const lockKey = `refund-lock:${transactionId}`;

    try {
      const lock = await this.redlock.lock(lockKey, 30000);

      // Ensure refund isn't processed twice
      const transaction = await this.getTransaction(transactionId);
      if (transaction.refunded) {
        throw new Error('Transaction already refunded');
      }

      // Process refund
      await this.processRefundWithProvider(transaction);
      await this.markTransactionRefunded(transactionId);

      await this.redlock.unlock(lock);
      return { success: true };

    } catch (error) {
      console.error(`Refund failed:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Multiple servers can safely process payments
const processor = new PaymentProcessor();

// Server 1 attempts payment
processor.processPayment('user123', 100, 'credit-card-token');

// Server 2 attempts same payment (will be blocked by lock)
processor.processPayment('user123', 100, 'credit-card-token');

// Result: Only one payment is processed, no double-charging!
```
