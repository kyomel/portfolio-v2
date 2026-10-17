---
title: "Boy Scout Rule"
termSlug: "boy-scout-rule"
year: 2025
month: 9
monthName: "September"
day: 22
order: 16
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "The Boy Scout Rule in software development states: \"Always leave the code cleaner than you found it.\" Just like Boy Scouts leave campsites better than they found them, developers should improve cod..."
---
### Definition:
The Boy Scout Rule in software development states: "Always leave the code cleaner than you found it." Just like Boy Scouts leave campsites better than they found them, developers should improve code quality whenever they touch it, even if they're just fixing a small bug.

**Core Principle**
Make small, incremental improvements every time you work on code. You don't need to refactor everything - just clean up what you're already touching.

### Example:
You need to fix a bug in a checkout function
(Messy Code)
```
def processOrder(items, user_id, promo_code):
    total = 0
    for i in items:
        total = total + i['price']
    
    if promo_code == "SAVE10":
        total = total * 0.9
    elif promo_code == "SAVE20":
        total = total * 0.8
    
    # Bug was here: missing tax calculation
    tax = total * 0.08
    final_total = total + tax
    
    return final_total
```
Applying Boy Scout Rule
```
def calculate_order_total(items, user_id, promo_code):
    """Calculate total order amount including discounts and tax."""
    TAX_RATE = 0.08
    
    subtotal = sum(item['price'] for item in items)
    
    # Apply discount
    discount_multiplier = get_discount_multiplier(promo_code)
    discounted_total = subtotal * discount_multiplier
    
    # Add tax (fixed the original bug)
    tax = discounted_total * TAX_RATE
    return discounted_total + tax

def get_discount_multiplier(promo_code):
    """Return discount multiplier for given promo code."""
    discounts = {
        "SAVE10": 0.9,
        "SAVE20": 0.8
    }
    return discounts.get(promo_code, 1.0)
```
