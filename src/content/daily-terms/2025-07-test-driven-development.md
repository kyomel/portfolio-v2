---
title: "Test Driven Development"
termSlug: "test-driven-development"
year: 2025
month: 7
monthName: "July"
day: 4
order: 4
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Test Driven Development (TDD) is a software development methodology where you write tests before writing the actual code. It follows a simple cycle: Red → Green → Refactor."
---
### Definition:

Test Driven Development (TDD) is a software development methodology where you write tests before writing the actual code. It follows a simple cycle: Red → Green → Refactor.
TDD Cycle:

- Red: Write a failing test
- Green: Write minimal code to make the test pass
- Refactor: Improve the code while keeping tests passing

### Example:

Calculator Addition Function
**Step 1: Red - Write Failing Test**

```
import unittest

class TestCalculator(unittest.TestCase):
    def test_add_two_numbers(self):
        calc = Calculator()
        result = calc.add(2, 3)
        self.assertEqual(result, 5)

    def test_add_negative_numbers(self):
        calc = Calculator()
        result = calc.add(-1, -2)
        self.assertEqual(result, -3)

if __name__ == '__main__':
    unittest.main()
```

**Step 2: Green - Write Minimal Code**

```
class Calculator:
    def add(self, a, b):
        return a + b
```

**Step 3: Refactor - Improve Code**

```
class Calculator:
    def add(self, a: int, b: int) -> int:
        """Add two numbers and return the result."""
        if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
            raise TypeError("Both arguments must be numbers")
        return a + b
```

reference: [Link-1](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
