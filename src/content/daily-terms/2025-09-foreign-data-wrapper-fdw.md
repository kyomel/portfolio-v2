---
title: "Foreign Data Wrapper(FDW)"
termSlug: "foreign-data-wrapper-fdw"
year: 2025
month: 9
monthName: "September"
day: 5
order: 5
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Foreign Data Wrappers (FDW) is a PostgreSQL feature that allows you to access and query data from external sources (other databases, files, APIs, web services) as if they were regular tables in you..."
---
### Definition:

Foreign Data Wrappers (FDW) is a PostgreSQL feature that allows you to access and query data from external sources (other databases, files, APIs, web services) as if they were regular tables in your local database. It creates a "virtual window" to remote data without actually storing it locally, enabling seamless integration across different data systems.

**Key Features**

- Transparent access: Query external data using standard SQL
- Real-time data: Always fetches current data from source
- No data duplication: Data stays in original location
- Cross-database joins: Combine local and remote data
- Multiple sources: Connect to various database types and services

### Example:

- E-commerce company with data in multiple systems

```
-- Connect to different data sources

-- 1. Sales data in MySQL
CREATE FOREIGN TABLE mysql_sales (
    sale_id INTEGER,
    product_id INTEGER,
    amount DECIMAL(10,2),
    sale_date DATE
) SERVER mysql_server OPTIONS (table_name 'sales');

-- 2. Product data in MongoDB
CREATE FOREIGN TABLE mongo_products (
    product_id INTEGER,
    product_name TEXT,
    category TEXT,
    price DECIMAL(10,2)
) SERVER mongo_server OPTIONS (collection 'products');

-- 3. Customer data in CSV files
CREATE FOREIGN TABLE csv_customers (
    customer_id INTEGER,
    name TEXT,
    region TEXT,
    signup_date DATE
) SERVER file_server OPTIONS (
    filename '/data/customers.csv',
    format 'csv',
    header 'true'
);

-- 4. Web analytics from REST API
CREATE FOREIGN TABLE api_pageviews (
    page_url TEXT,
    views INTEGER,
    date DATE
) SERVER api_server OPTIONS (
    endpoint 'https://analytics.company.com/api/pageviews'
);
```

- Cross-System Analytics Query

```
-- Generate comprehensive sales report combining all sources
SELECT
    mp.category,
    mp.product_name,
    cc.region,
    SUM(ms.amount) as total_sales,
    COUNT(ms.sale_id) as num_transactions,
    AVG(apv.views) as avg_page_views
FROM mysql_sales ms
JOIN mongo_products mp ON ms.product_id = mp.product_id
JOIN csv_customers cc ON ms.customer_id = cc.customer_id
LEFT JOIN api_pageviews apv ON apv.page_url LIKE '%' || mp.product_name || '%'
WHERE ms.sale_date >= '2024-01-01'
GROUP BY mp.category, mp.product_name, cc.region
ORDER BY total_sales DESC;
```
