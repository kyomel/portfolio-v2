---
title: "Columnar Tables (Column-Oriented Storage)"
termSlug: "columnar-tables-column-oriented-storage"
year: 2026
month: 7
monthName: "July"
day: 9
order: 7
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "A Columnar Table is a way of storing data on disk where values are grouped by column instead of by row. In a traditional row-oriented database (PostgreSQL, MySQL), every row is stored contiguously..."
---
### Definition:

A Columnar Table is a way of storing data on disk where values are grouped by column instead of by row. In a traditional row-oriented database (PostgreSQL, MySQL), every row is stored contiguously — all the columns of row 1 are together, then all the columns of row 2, and so on. In a columnar database (Snowflake, Redshift, ClickHouse, Parquet files), all the values of column 1 are stored together, then all the values of column 2, and so on.

### Example:

This seemingly small change has massive implications for analytics performance:

```text
═══════════════════════════════════════════════════════════════
  ROW-ORIENTED vs. COLUMN-ORIENTED STORAGE
═══════════════════════════════════════════════════════════════

  Imagine a table with 1 billion customer records:

  ┌─────────┬────────────┬────────────┬─────────────┐
  │  ID     │  Name      │  Email     │  Spend ($)  │
  ├─────────┼────────────┼────────────┼─────────────┤
  │ 1       │ Alice      │ a@x.com    │ 1,250       │
  │ 2       │ Bob        │ b@x.com    │ 3,400       │
  │ 3       │ Charlie    │ c@x.com    │ 890         │
  │ ...     │ ...        │ ...        │ ...         │
  │ 1B      │ Zoey       │ z@x.com    │ 2,100       │
  └─────────┴────────────┴────────────┴─────────────┘

  ROW-ORIENTED STORAGE (PostgreSQL, MySQL, SQL Server)
  ═══════════════════════════════════════════════════════

  Disk Layout:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  [1 | Alice | a@x.com | 1250]                           │
  │  [2 | Bob   | b@x.com | 3400]  ← One row = contiguous  │
  │  [3 | Charlie | c@x.com | 890]    on disk               │
  │  [4 | Diana | d@x.com | 2100]                           │
  │  [5 | Eve   | e@x.com | 5600]                           │
  │  ...                                                    │
  │  [1B | Zoey | z@x.com | 2100]                           │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  Best for:  "Give me everything about customer #42"
             (All columns for one row — fast since the whole
              row is stored together)

  Worst for: "What is the AVERAGE spend across all customers?"
             (Must read ALL columns of ALL rows — even though
              you only need the "spend" column)

  COLUMN-ORIENTED STORAGE (Snowflake, Redshift, ClickHouse)
  ═══════════════════════════════════════════════════════════
  Disk Layout:
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │  ID column:       [1, 2, 3, 4, 5, ..., 1B]            │
    │  Name column:     [Alice, Bob, Charlie, Diana, ...]    │
    │  Email column:    [a@x.com, b@x.com, c@x.com, ...]    │
    │  Spend column:    [1250, 3400, 890, 2100, 5600, ...]   │
    │                         ▲                               │
    │  When you query        │                               │
    │  AVG(spend), only      ┘                               │
    │  THIS column is read    (The other 3 columns remain     │
    │                         untouched on disk — never read) │
    └─────────────────────────────────────────────────────────┘
  
    Best for:  "What is the AVERAGE spend across all customers?"
               (Reads ONLY the "spend" column — 75% of data
                is never touched. 4x less I/O.)
  
    Worst for: "Give me everything about customer #42"
               (Must read all 4 columns from different parts
                of the disk and reassemble them — slower than
                row-oriented for this pattern)
```

**The key insight:** Most analytics queries read a FEW columns across MANY rows ("average spend," "count of users," "total revenue by month"). Row-oriented storage forces you to read ALL columns even when you only need one. Columnar storage lets you read ONLY the columns you need.

Analogy — The Library vs. The Encyclopedia 📚

**Row-oriented storage is like a set of encyclopedias.** Volume 1 covers Aardvark to Antarctica. Volume 2 covers Antarctica to Brazil. Each volume contains everything about that page range — history, geography, economy, culture — mixed together. If you want to know the "population" of every country, you have to flip through ALL volumes and extract just the population number from each page. You read thousands of pages about history, geography, and culture that you don't need.

**Columnar storage is like having a single "Population of Every Country" reference sheet** stored separately from a "Capital City of Every Country" sheet, stored separately from an "Official Language" sheet. If you want to know the population of every country, you grab ONE sheet. The other 20 sheets stay on the shelf. You read exactly what you need and nothing more.

In the analytics world, this difference means: a query that takes **2 minutes** on a row-oriented database takes **2 seconds** on a columnar database — and uses 60x less memory.

### Example:

A visual comparison of how the same analytics query runs on row vs. columnar storage.

**SCENARIO:** A retail company with 1 billion sales records needs to calculate:
*"What was the total revenue per region in Q2 2026?"*

The table has 20 columns — but the query only needs **3**: `region`, `amount`, `date`.

```text
═══════════════════════════════════════════════════════════════
  ROW-ORIENTED DATABASE (PostgreSQL)
═══════════════════════════════════════════════════════════════

  QUERY: SELECT region, SUM(amount) FROM sales
         WHERE date BETWEEN '2026-04-01' AND '2026-06-30'
         GROUP BY region;

           WHAT THE DATABASE READS FROM DISK:

           ┌─────────────────────────────────────────────────────────┐
           │                                                         │
           │  [1 | product_id | 20 cols | region | amount | date |   │
           │        customer_id | payment_method | ... | ...]         │
           │                                                         │
           │  Each row is read COMPLETELY — all 20 columns — even    │
           │  though only 3 columns are needed.                      │
           │                                                         │
           │                            ▼                             │
           │                                                         │
           │  📦 Data read from disk:  20 columns × 1B rows          │
           │     = 20 BILLION column values scanned                  │
           │                                                         │
           │  📦 Data actually needed: 3 columns × ~100M rows (Q2)   │
           │     = 300 MILLION column values                          │
           │                                                         │
           │  ❌ Waste: 98.5% of read data is thrown away             │
           │  ❌ Disk I/O: 150 GB read, when only 2 GB is needed     │
           │  ❌ Time: ~45 seconds (most spent reading & discarding) │
           │                                                         │
           └─────────────────────────────────────────────────────────┘

           ═══════════════════════════════════════════════════════════
           COLUMNAR DATABASE (Snowflake / ClickHouse)
           ═══════════════════════════════════════════════════════════

           WHAT THE DATABASE READS FROM DISK:

           ┌─────────────────────────────────────────────────────────┐
           │                                                         │
           │    17 OTHER COLUMNS                    3 NEEDED COLUMNS │
           │    (NEVER TOUCHED!)                    (READ & USED)    │
           │                                     ┌──────────────────┐│
           │  product_id     ─── NOT READ ──►    │                  ││
           │  customer_id    ─── NOT READ ──►    │  region column   ││
           │  payment_method ─── NOT READ ──►    │  ─────────────── ││
           │  discount       ─── NOT READ ──►    │  us-east         ││
           │  shipping_cost  ─── NOT READ ──►    │  us-west         ││
           │  tax            ─── NOT READ ──►    │  eu-west         ││
           │  ...            ─── NOT READ ──►    │  ap-southeast    ││
           │  ...            ─── NOT READ ──►    │  ... (1B values) ││
           │  ...            ─── NOT READ ──►    │                  ││
           │  ...            ─── NOT READ ──►    │  amount column   ││
           │                                     │  ─────────────── ││
           │                                     │  1250            ││
           │                                     │  3400            ││
           │                                     │  890             ││
           │                                     │  ...             ││
           │                                     │                  ││
           │                                     │  date column     ││
           │                                     │  ─────────────── ││
           │                                     │  2026-04-01      ││
           │                                     │  2026-04-01      ││
           │                                     │  ...             ││
           │                                     └──────────────────┘│
           │                                                         │
           │  📦 Data read from disk:  3 columns × 1B rows           │
           │     = 3 BILLION column values scanned                   │
           │                                                         │
           │  📦 Data actually needed: 3 columns × ~100M rows (Q2)   │
           │     = 300 MILLION column values                         │
           │                                                         │
           │  ✅ Waste: 0% — every byte read IS used                 │
           │  ✅ Disk I/O: 2 GB read = exactly what's needed         │
           │  ✅ Time: ~2 seconds                                    │
           │                                                         │
           └─────────────────────────────────────────────────────────┘

               ═══════════════════════════════════════════════════════════
               BONUS: COLUMNAR COMPRESSION IS BETTER
               ═══════════════════════════════════════════════════════════

               Because columnar storage groups SAME-TYPE data together,
               compression is dramatically more effective.

               ┌─────────────────────────────────────────────────────────┐
               │                                                         │
               │  Row-oriented: compress mixed types together            │
               │  [1250 | Alice | a@x.com | US] — int, string, string,  │
               │                                  string — hard to        │
               │  [3400 | Bob   | b@x.com | EU]   find patterns          │
               │  Compression ratio: ~2:1                                 │
               │                                                         │
               │  Columnar: compress same types together                 │
               │  [US, EU, APAC, US, EU, LATAM, ...]                     │
               │  Only 5 distinct values in 1B rows →                    │
               │  Store once: [US, EU, APAC, LATAM, EMEA]                │
               │  Then store: [0, 1, 2, 0, 1, 3, 4, ...]                │
               │  Compression ratio: 50:1 to 100:1                       │
               │                                                         │
               └─────────────────────────────────────────────────────────┘

               ═══════════════════════════════════════════════════════════
               RESULT COMPARISON
               ═══════════════════════════════════════════════════════════

                                 Row-Oriented         Columnar
                                 ─────────────        ─────────
               Data scanned      150 GB               2 GB
               Data kept         2 GB                 2 GB
               Waste             148 GB               0 GB
               Disk I/O          75x more             baseline
               Compression       2:1                  50:1 (effective)
               Time              42 seconds           1.8 seconds
               Memory needed     32 GB                512 MB

               Cost per query    $0.04 (compute)      $0.001 (75% less)
               (unoptimized)
```
