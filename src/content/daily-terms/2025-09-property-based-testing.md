---
title: "Property-Based Testing"
termSlug: "property-based-testing"
year: 2025
month: 9
monthName: "September"
day: 3
order: 3
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Property-Based Testing is a software testing approach that verifies general properties or invariants of your code by automatically generating hundreds or thousands of random test inputs. Instead of..."
---
### Definition:

Property-Based Testing is a software testing approach that verifies general properties or invariants of your code by automatically generating hundreds or thousands of random test inputs. Instead of writing specific test cases with fixed inputs and outputs, you define properties that should always be true, and the testing framework generates diverse inputs to try to break those properties.

### Example:

- Testing String Reverse Function

```
from hypothesis import given, strategies as st

def reverse_string(s):
    return s[::-1]

# Property-based tests
@given(st.text())
def test_reverse_properties(s):
    reversed_s = reverse_string(s)

    # Property 1: Length preserved
    assert len(reversed_s) == len(s)

    # Property 2: Reversing twice gives original
    assert reverse_string(reversed_s) == s

    # Property 3: First char becomes last char
    if len(s) > 0:
        assert s[0] == reversed_s[-1]
        assert s[-1] == reversed_s[0]

# Hypothesis automatically generates:
# "", "a", "hello", "🙂🎉", "\n\t", "a" * 1000, etc.
```

- Testing Banking Transfer System

```
class BankAccount {
    private BigDecimal balance;

    public void transfer(BankAccount to, BigDecimal amount) {
        if (balance.compareTo(amount) >= 0) {
            this.balance = this.balance.subtract(amount);
            to.balance = to.balance.add(amount);
        } else {
            throw new InsufficientFundsException();
        }
    }
}

@Property
public void transferProperties(
    @ForAll @BigRange(min = "0", max = "10000") BigDecimal initialFromBalance,
    @ForAll @BigRange(min = "0", max = "10000") BigDecimal initialToBalance,
    @ForAll @BigRange(min = "0", max = "15000") BigDecimal transferAmount) {

    BankAccount from = new BankAccount(initialFromBalance);
    BankAccount to = new BankAccount(initialToBalance);

    BigDecimal totalBefore = initialFromBalance.add(initialToBalance);

    try {
        from.transfer(to, transferAmount);

        // Property 1: Money is conserved (no money created/destroyed)
        BigDecimal totalAfter = from.getBalance().add(to.getBalance());
        assertEquals(totalBefore, totalAfter);

        // Property 2: Transfer amount was deducted correctly
        assertEquals(initialFromBalance.subtract(transferAmount), from.getBalance());
        assertEquals(initialToBalance.add(transferAmount), to.getBalance());

    } catch (InsufficientFundsException e) {
        // Property 3: Exception only thrown when insufficient funds
        assertTrue(initialFromBalance.compareTo(transferAmount) < 0);

        // Property 4: Balances unchanged on failed transfer
        assertEquals(initialFromBalance, from.getBalance());
        assertEquals(initialToBalance, to.getBalance());
    }
}
```

Popular Tools:

- Java: JUnit-QuickCheck, jqwik
- Python: Hypothesis
- JavaScript: JSVerify, fast-check
- Haskell: QuickCheck (original)
- C#: FsCheck
