---
title: "Open-Closed Principle"
termSlug: "open-closed-principle"
year: 2026
month: 1
monthName: "January"
day: 23
order: 16
source: "2026/jan-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/jan-term.md"
excerpt: "The Open-Closed Principle is one of the five SOLID principles of object-oriented design. It states: \"Software entities (classes, modules, functions) should be OPEN for extension but CLOSED for modi..."
---
### Definition:

The Open-Closed Principle is one of the five SOLID principles of object-oriented design. It states:

"Software entities (classes, modules, functions) should be OPEN for extension but CLOSED for modification."

In Simple Terms:

- OPEN for Extension: You can add new functionality
- CLOSED for Modification: You shouldn't change existing, tested code

The Goal: Add new features without breaking existing code that already works.

**_Why It Matters_**

❌ Without OCP:
Every new feature → Modify existing code → Risk breaking things → More bugs

✅ With OCP:
New feature → Add new code → Existing code untouched → Nothing breaks
Key Benefit: Change behavior by adding code, not editing code.

### Example:

Payment Processing

```
// Abstract base class (or interface in TypeScript/Java)
class PaymentMethod {
  process(amount) {
    throw new Error('Must implement process method');
  }
}

// Concrete implementations (EXTENSIONS)
class CreditCardPayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing $${amount} via Credit Card`);
    // Credit card specific logic
    this.validateCard();
    this.chargeCreditCard(amount);
    this.sendReceipt();
  }

  validateCard() { /* ... */ }
  chargeCreditCard(amount) { /* ... */ }
  sendReceipt() { /* ... */ }
}

class PayPalPayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing $${amount} via PayPal`);
    // PayPal specific logic
    this.authenticatePayPal();
    this.chargePayPal(amount);
  }

  authenticatePayPal() { /* ... */ }
  chargePayPal(amount) { /* ... */ }
}

class BitcoinPayment extends PaymentMethod {
  process(amount) {
    console.log(`Processing $${amount} via Bitcoin`);
    // Bitcoin specific logic
    this.generateWalletAddress();
    this.waitForConfirmation(amount);
  }

  generateWalletAddress() { /* ... */ }
  waitForConfirmation(amount) { /* ... */ }
}

// PaymentProcessor is now CLOSED for modification
class PaymentProcessor {
  constructor() {
    this.paymentMethods = new Map();
  }

  // Register new payment methods (EXTENSION POINT)
  registerPaymentMethod(name, paymentMethod) {
    this.paymentMethods.set(name, paymentMethod);
  }

  // Process payment using registered method
  processPayment(amount, paymentType) {
    const paymentMethod = this.paymentMethods.get(paymentType);

    if (!paymentMethod) {
      throw new Error(`Payment method '${paymentType}' not registered`);
    }

    paymentMethod.process(amount);
  }
}

// Usage
const processor = new PaymentProcessor();

// Register payment methods (extending functionality)
processor.registerPaymentMethod('credit_card', new CreditCardPayment());
processor.registerPaymentMethod('paypal', new PayPalPayment());
processor.registerPaymentMethod('bitcoin', new BitcoinPayment());

// Process payments
processor.processPayment(100, 'credit_card');
processor.processPayment(50, 'paypal');
processor.processPayment(0.002, 'bitcoin');
```
