---
title: "Sieve Algorithm or Sieve of Eratosthenes"
termSlug: "sieve-algorithm-or-sieve-of-eratosthenes"
year: 2026
month: 1
monthName: "January"
day: 2
order: 2
source: "2026/jan-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/jan-term.md"
excerpt: "The Sieve Algorithm (specifically Sieve of Eratosthenes) is an ancient, efficient method for finding all prime numbers up to a given limit. It works by systematically \"crossing out\" multiples of ea..."
---
### Definition:

The Sieve Algorithm (specifically Sieve of Eratosthenes) is an ancient, efficient method for finding all prime numbers up to a given limit. It works by systematically "crossing out" multiples of each prime, leaving only primes unmarked.

Key idea: Instead of testing each number individually, eliminate all non-primes in batches.

**Why It Matters**

- Fast: Much faster than checking each number individually
- Simple: Easy to understand and implement
- Efficient: Great for finding many primes at once (up to millions)

**How It Works (Simple Steps)**

- List all numbers from 2 to n
- Start with the first unmarked number (it's prime)
- Cross out all its multiples (they're composite)
- Repeat with the next unmarked number
- Continue until done

### Example:

Find all primes up to 30:

```
Step 1: List numbers 2-30
2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30

Step 2: 2 is prime, cross out multiples of 2
2  3  ✗  5  ✗  7  ✗  9  ✗  11 ✗  13 ✗  15 ✗  17 ✗  19 ✗  21 ✗  23 ✗  25 ✗  27 ✗  29 ✗

Step 3: 3 is prime, cross out multiples of 3
2  3  ✗  5  ✗  7  ✗  ✗  ✗  11 ✗  13 ✗  ✗  ✗  17 ✗  19 ✗  ✗  ✗  23 ✗  25 ✗  ✗  ✗  29 ✗

Step 4: 5 is prime, cross out multiples of 5
2  3  ✗  5  ✗  7  ✗  ✗  ✗  11 ✗  13 ✗  ✗  ✗  17 ✗  19 ✗  ✗  ✗  23 ✗  ✗  ✗  ✗  ✗  29 ✗

Step 5: Continue with 7, 11, 13...

Final Result (primes): 2, 3, 5, 7, 11, 13, 17, 19, 23, 29
```
