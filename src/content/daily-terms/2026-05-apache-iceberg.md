---
title: "Apache Iceberg"
termSlug: "apache-iceberg"
year: 2026
month: 5
monthName: "May"
day: 25
order: 17
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "Apache Iceberg is an open-source table format for huge datasets. Think of it as a smart filing cabinet for your data lake — it keeps track of all your data files, makes queries fast, and lets you s..."
---
### Definition:

Apache Iceberg is an open-source table format for huge datasets. Think of it as a smart filing cabinet for your data lake — it keeps track of all your data files, makes queries fast, and lets you safely make changes without breaking anything.

In simpler terms: normally, dumping data into a data lake (like S3 or HDFS) is like throwing papers into a giant unorganized box. Iceberg adds a layer on top that turns that mess into a well-organized, searchable, and reliable database table.

Analogy — The Library Catalog
Imagine a massive library with millions of books but no catalog. Finding a book means walking every aisle. Updating a book means pulling it off the shelf while everyone is still reading.

Now add a librarian with a catalog system:

Concept	Real World	Apache Iceberg
Books scattered everywhere	Raw data files (Parquet, Avro, ORC)	Data files
The catalog cards	Tracks which files belong to which table	Metadata layer
Librarian	Knows exactly where everything is	Iceberg Table Format
Swapping a book without disrupting readers	Update data without locking	Snapshot isolation
The catalog tells you exactly which files to read, so queries run fast. You can add, delete, or rewrite books without the whole library grinding to a halt.

### Example:

(Spark SQL)
Here's a practical walkthrough — creating an Iceberg table, inserting data, and time-traveling:

```
1️⃣ Create an Iceberg Table

-- Run this in Spark SQL with Iceberg configured
CREATE TABLE nyc_taxis.rides (
    ride_id      BIGINT,
    pickup_ts    TIMESTAMP,
    dropoff_ts   TIMESTAMP,
    passenger_count INT,
    fare_amount  DECIMAL(10,2)
)
USING ICEBERG
PARTITIONED BY (days(pickup_ts));  -- Iceberg handles the rest!
2️⃣ Insert Some Rows

INSERT INTO nyc_taxis.rides VALUES
(1, '2025-05-20 08:15:00', '2025-05-20 08:35:00', 1, 22.50),
(2, '2025-05-20 09:00:00', '2025-05-20 09:20:00', 3, 35.00),
(3, '2025-05-21 17:10:00', '2025-05-21 17:45:00', 2, 48.75);
3️⃣ Read the Data

SELECT * FROM nyc_taxis.rides;
4️⃣ Oops — Add a Missing Column Without Downtime 🪄

ALTER TABLE nyc_taxis.rides
ADD COLUMN tip_amount DECIMAL(10,2);
No rewrite needed — existing rows just get NULL for the new column.

5️⃣ Time Travel — Query the Table as It Was 2 Snapshots Ago

-- Roll back in time!
SELECT * FROM nyc_taxis.rides
VERSION AS OF 'snapshot-12345';
Or query using a timestamp:

SELECT * FROM nyc_taxis.rides
TIMESTAMP AS OF '2025-05-20 10:00:00';
```
