---
title: "Vertical Sharding Database"
termSlug: "vertical-sharding-database"
year: 2025
month: 7
monthName: "July"
day: 30
order: 25
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Vertical Sharding is a database partitioning technique where columns of a table are split across multiple databases or servers, rather than splitting rows. Each shard contains a subset of columns f..."
---
### Definition:

Vertical Sharding is a database partitioning technique where columns of a table are split across multiple databases or servers, rather than splitting rows. Each shard contains a subset of columns from the original table, typically grouping related columns together based on access patterns or data characteristics.

**Key Characteristics**
✅ Column-based partitioning
✅ Reduces table width
✅ Improves query performance for specific column groups
✅ Enables specialized storage optimization

### Example:

- E-commerce User Database

```
users_table:
- user_id (Primary Key)
- username, email, password_hash
- first_name, last_name, phone, address
- profile_image, bio, preferences
- last_login, created_at, updated_at
- account_balance, subscription_plan
```

After Vertical Sharding
| Shard | Database | Columns | Use Case |
| --- | --- | --- | --- |
| Authentication | `auth_db` | `user_id`, `username`, `email`, `password_hash` | Login/Security |
| Profile | `profile_db` | `user_id`, `first_name`, `last_name`, `phone`, `address` | User Management |
| Content | `content_db` | `user_id`, `profile_image`, `bio`, `preferences` | Social Features |
| Billing | `billing_db` | `user_id`, `account_balance`, `subscription_plan` | Payment Processing |
