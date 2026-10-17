---
title: "Race Condition"
termSlug: "race-condition"
year: 2025
month: 6
monthName: "June"
day: 30
order: 3
source: "2025/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/june-term.md"
excerpt: "A race condition occurs when multiple processes or threads access shared resources simultaneously, and the final outcome depends on the unpredictable timing of their execution."
---
### definition:

A race condition occurs when multiple processes or threads access shared resources simultaneously, and the final outcome depends on the unpredictable timing of their execution.

### example:

- Bank Account Scenario

```
# Shared bank account balance
balance = 1000

# Thread A: Withdraw $100
def withdraw_100():
    global balance
    temp = balance    # Read: 1000
    temp -= 100       # Calculate: 900
    balance = temp    # Write: 900

# Thread B: Withdraw $200
def withdraw_200():
    global balance
    temp = balance    # Read: 1000 (if executed simultaneously)
    temp -= 200       # Calculate: 800
    balance = temp    # Write: 800
```

| Scenario       | Expected | Actual       | Problem        |
| -------------- | -------- | ------------ | -------------- |
| Sequential     | $700     | $700         | Correct        |
| Race Condition | $700     | $800 or $900 | Race Condition |

More explanation about race condition can be found [here](https://www.techtarget.com/searchstorage/definition/race-condition).
