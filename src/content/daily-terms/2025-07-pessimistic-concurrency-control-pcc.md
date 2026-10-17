---
title: "Pessimistic Concurrency Control (PCC)"
termSlug: "pessimistic-concurrency-control-pcc"
year: 2025
month: 7
monthName: "July"
day: 23
order: 18
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "PCC is a database locking strategy that prevents conflicts by locking data while it's being read or modified, ensuring only one transaction can access it at a time. Use Case"
---
### Definition:

PCC is a database locking strategy that prevents conflicts by locking data while it's being read or modified, ensuring only one transaction can access it at a time.

**Use Case**
Banking systems use PCC to prevent two users from withdrawing the same money simultaneously.

### Example:

```
-- Transaction A locks the row for update
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- No other transaction can read or update this row until A commits
```
