---
title: "Tactical Domain-Driven Design (DDD)"
termSlug: "tactical-domain-driven-design-ddd"
year: 2026
month: 5
monthName: "May"
day: 21
order: 15
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "Tactical DDD is the code-level toolbox of Domain-Driven Design. It gives you a set of software patterns to structure the inside of a single Bounded Context so that the code reads like the business..."
---
### Definition:

Tactical DDD is the code-level toolbox of Domain-Driven Design. It gives you a set of software patterns to structure the inside of a single Bounded Context so that the code reads like the business operates—keeping business logic isolated from databases, frameworks, and UI code.

The Building Blocks
Pattern	Simple Rule
Entity	Has a unique identity that persists even when its attributes change.
Value Object	Defined only by its data; immutable, replaceable, and has no ID.
Aggregate	A consistency boundary of Entities and Value Objects. Only the Aggregate Root can be referenced from outside.
Domain Event	A notification that something meaningful happened in the business.
Repository	Loads and saves entire Aggregates; the domain’s front door to persistence.
Domain Service	Holds business logic that does not naturally belong to any single Entity or Value Object.
Factory	Encapsulates complex creation of Aggregates.

### Example:

Online Pizza Ordering

```
Inside the Ordering Bounded Context:

Aggregate Root: Order
The Order is the consistency boundary. You cannot change a line item without loading the whole Order aggregate and asking it to change itself.

Entity: OrderItem
The pepperoni pizza on line 3 of the receipt is still the same line item even if you change its size from Medium to Large. It has local identity within the Order.

Value Objects: Money($18.50), PizzaSize("Large"), Address("123 Main St")
If the delivery address becomes "456 Oak Ave," that is literally a different address object. No database ID required.

Domain Event: OrderSubmitted
When the Order is finalized, it emits this event. The Kitchen context listens and starts baking; the Billing context listens and charges the card.

Domain Service: PricingService
Runs a "Buy 2, Get 1 Free" promotion. Because the discount spans multiple OrderItems, it lives in a Service rather than inside a single pizza line.

Repository: OrderRepository
Other code calls repo.Save(order) or repo.FindByID(id). The rest of the application never writes SQL directly; it treats the Order aggregate as the single unit of persistence.

Why It Matters
Without Tactical DDD, business rules leak into controllers and database scripts. With it, a developer can look at the code and immediately understand how the pizza business works—making the system easier to change when the menu or pricing rules inevitably evolve.
```
