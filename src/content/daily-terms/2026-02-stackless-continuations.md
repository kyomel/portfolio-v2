---
title: "Stackless Continuations"
termSlug: "stackless-continuations"
year: 2026
month: 2
monthName: "February"
day: 4
order: 3
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Stackless Continuations are a programming technique that allows a function to pause its execution, save its current state (without saving the entire call stack), and resume later from exactly where..."
---
### Definition:

Stackless Continuations are a programming technique that allows a function to pause its execution, save its current state (without saving the entire call stack), and resume later from exactly where it left off. Unlike traditional continuations that capture the full call stack, stackless continuations only save minimal state information, making them lightweight and efficient.

**Key Concept:**

- Pause and Resume: Function can stop mid-execution and continue later
- No Stack Capture: Doesn't save the entire call stack (hence "stackless")
- Lightweight: Uses minimal memory compared to full continuations
- State Machine: Often implemented as a state machine under the hood

**Modern Names:**

- Coroutines (C++, Kotlin)
- async/await (JavaScript, Python, C#)
- Generators (Python, JavaScript)
- Fibers (Ruby)

### Example:

Python Generators:

```
# Generator - yields values one at a time

def count_to_million():
    """Generate numbers 1 to 1,000,000 without storing them all"""
    print("Starting generator...")

    for i in range(1, 1_000_001):
        print(f"Generating {i}")
        yield i  # 📑 PAUSE here, return value
        print(f"Resumed after {i}")

    print("Generator complete!")

# Usage
counter = count_to_million()

# First call
print(next(counter))  # Outputs: 1 (paused after yield)

# Do other stuff...
print("Doing other work...")

# Resume
print(next(counter))  # Outputs: 2 (resumed from yield, paused again)

print("More work...")

# Resume again
print(next(counter))  # Outputs: 3

# Can iterate through all values
for num in count_to_million():
    if num > 5:
        break  # Stop early, generator cleaned up
    print(num)

"""
Output:
Starting generator...
Generating 1
1
Resumed after 1
Doing other work...
Generating 2
2
Resumed after 2
More work...
Generating 3
3

Key Point: Only one number exists in memory at a time!
Without generator: Would need array with 1 million numbers! 💥
"""
```
