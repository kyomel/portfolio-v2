---
title: "Event Sourcing"
termSlug: "event-sourcing"
year: 2025
month: 7
monthName: "July"
day: 16
order: 13
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Event Sourcing is a software architectural pattern where state changes are stored as a sequence of events, rather than just the current state. Each event represents a change in the system, allowing..."
---
### Definition:

Event Sourcing is a software architectural pattern where state changes are stored as a sequence of events, rather than just the current state. Each event represents a change in the system, allowing for complete reconstruction of the application's state at any point in time.

Key Concepts:

- Events - Immutable, timestamped records of state changes
- Event Store - Database for persisting events
- Event Handlers - Process events to update application state

- CQRS - Often used with Command Query Responsibility Segregation for separating read and write operations

### Example:

Bank Account with Event Sourcing

```
# Event Store
events = [
    {"type": "AccountCreated", "account_id": 1, "timestamp": "2025-07-16T10:00:00"},
    {"type": "Deposit", "account_id": 1, "amount": 100, "timestamp": "2025-07-16T10:01:00"},
    {"type": "Withdrawal", "account_id": 1, "amount": 50, "timestamp": "2025-07-16T10:02:00"}
]

# Event Handler
def apply_events(events):
    balance = 0
    for event in events:
        if event["type"] == "Deposit":
            balance += event["amount"]
        elif event["type"] == "Withdrawal":
            balance -= event["amount"]
    return balance

# Get current balance
current_balance = apply_events(events)
print(f"Current Balance: ${current_balance}")  # Output: $50
```
