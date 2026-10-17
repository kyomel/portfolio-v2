---
title: "Functional Programming"
termSlug: "functional-programming"
year: 2025
month: 7
monthName: "July"
day: 15
order: 12
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Functional Programming is a programming paradigm that treats computation as the evaluation of mathematical functions, emphasizing immutability, pure functions, and avoiding side effects."
---
### Definition:

Functional Programming is a programming paradigm that treats computation as the evaluation of mathematical functions, emphasizing immutability, pure functions, and avoiding side effects.

Key Principles:

- Pure Functions - Same input always produces same output
- Immutability - Data cannot be changed after creation
- No Side Effects - Functions don't modify external state
- Higher-Order Functions - Functions can take other functions as arguments or return them

Popular Functional Languages: Haskell, Lisp, Clojure, F#, Erlang, Scala

### Example:

JavaScript - Pure vs Impure Function

```
// IMPURE - Modifies external state
let counter = 0;
function increment() {
    counter++; // Side effect
    return counter;
}

// PURE - No side effects, same input = same output
function add(a, b) {
    return a + b;
}
```

Python - Functional Approach

```
# Functional style with map, filter, reduce
numbers = [1, 2, 3, 4, 5]

# Using higher-order functions
squared = list(map(lambda x: x**2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

from functools import reduce
sum_all = reduce(lambda x, y: x + y, numbers)

print(f"Original: {numbers}")
print(f"Squared: {squared}")
print(f"Evens: {evens}")
print(f"Sum: {sum_all}")

```
