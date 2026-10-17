---
title: "Twitter Snowflake"
termSlug: "twitter-snowflake"
year: 2025
month: 8
monthName: "August"
day: 14
order: 15
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "A Twitter Snowflake is a unique 64-bit ID system used by Twitter (now X) to generate billions of unique identifiers for tweets, users, and other objects. It's called \"Snowflake\" because like real s..."
---
### Definition:

A Twitter Snowflake is a unique 64-bit ID system used by Twitter (now X) to generate billions of unique identifiers for tweets, users, and other objects. It's called "Snowflake" because like real snowflakes, each ID is guaranteed to be unique.

**How It Works:**

The 64-bit ID is split into parts:

- Timestamp (41 bits): When it was created
- Machine ID (10 bits): Which server generated it
- Sequence (12 bits): Counter for IDs created in the same millisecond

### Example:

A Twitter Snowflake ID might look like: 1234567890123456789

When you see a tweet URL like:

```
https://twitter.com/user/status/1234567890123456789
```

That long number (1234567890123456789) is the Snowflake ID for that specific tweet.

**Why It's Useful**

- Roughly sortable by time: Newer tweets have higher IDs
- Globally unique: No two tweets will ever have the same ID
- High performance: Can generate millions of IDs per second across multiple servers

**Real-World Impact**
This system allows Twitter to handle billions of tweets while ensuring every single one has a unique identifier, making it possible to link, share, and reference any tweet ever posted!
