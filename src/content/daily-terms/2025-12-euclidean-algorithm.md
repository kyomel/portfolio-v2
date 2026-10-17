---
title: "Euclidean Algorithm"
termSlug: "euclidean-algorithm"
year: 2025
month: 12
monthName: "December"
day: 25
order: 19
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Euclidean Algorithm is an efficient method for finding the Greatest Common Divisor (GCD) of two integers. It works by repeatedly applying the principle that the GCD of two numbers doesn't change wh..."
---
### Definition:

Euclidean Algorithm is an efficient method for finding the Greatest Common Divisor (GCD) of two integers. It works by repeatedly applying the principle that the GCD of two numbers doesn't change when you replace the larger number with the remainder of dividing the larger by the smaller. This process continues until one number becomes zero, at which point the other number is the GCD.

**Key characteristics:**

- Finds GCD efficiently in O(log min(a,b)) time
- Uses repeated division and remainders
- Based on the principle: gcd(a,b) = gcd(b, a mod b)
- Ancient algorithm (300 BCE) still widely used
- Foundation for many other algorithms

### Example:

inding GCD of 48 and 18
Scenario: What's the largest number that divides both 48 and 18?

```
Euclidean Algorithm (Fast):

┌─────────────────────────────────────────────────────┐
│        EUCLIDEAN ALGORITHM                          │
└─────────────────────────────────────────────────────┘

gcd(48, 18) = ?

Step 1: 48 ÷ 18 = 2 remainder 12
        So: gcd(48, 18) = gcd(18, 12)

Step 2: 18 ÷ 12 = 1 remainder 6
        So: gcd(18, 12) = gcd(12, 6)

Step 3: 12 ÷ 6 = 2 remainder 0
        So: gcd(12, 6) = gcd(6, 0)

Step 4: gcd(6, 0) = 6 (when one number is 0, GCD is the other)

Answer: GCD = 6

Time: O(log min(a,b)) = O(log 18) ≈ 4 steps
Much faster!
Step-by-Step Visual:
┌─────────────────────────────────────────────────────┐
│        EUCLIDEAN ALGORITHM VISUALIZATION            │
└─────────────────────────────────────────────────────┘

    gcd(48, 18)
         │
         ▼
    48 = 18 × 2 + 12
    └─────┬─────────┘
          │ remainder
          ▼
    gcd(18, 12)
         │
         ▼
    18 = 12 × 1 + 6
    └─────┬────────┘
          │ remainder
          ▼
    gcd(12, 6)
         │
         ▼
    12 = 6 × 2 + 0
    └─────┬───────┘
          │ remainder = 0
          ▼
    gcd(6, 0) = 6 ✅

The remainders get smaller and smaller:
48 → 18 → 12 → 6 → 0

When remainder is 0, we found our answer!
```
