---
title: "Currying (Functional Programming Technique)"
termSlug: "currying-functional-programming-technique"
year: 2025
month: 7
monthName: "July"
day: 11
order: 10
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Currying is a technique where a function with multiple arguments is transformed into a sequence of functions, each taking a single argument. Explanation: returns a function that multiplies its argu..."
---
### Definition:

Currying is a technique where a function with multiple arguments is transformed into a sequence of functions, each taking a single argument.

### Example:

```
def multiply(x):
    def inner(y):
        return x * y
    return inner

# Usage:
mul_by_3 = multiply(3)
result = mul_by_3(5)   # result is 15

# Or, in one line:
result = multiply(3)(5)  # result is 15

```

Explanation:

```
multiply(3)
```

returns a function that multiplies its argument by 3.
