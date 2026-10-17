---
title: "Static Single Assignment form (SSA)"
termSlug: "static-single-assignment-form-ssa"
year: 2026
month: 5
monthName: "May"
day: 13
order: 9
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "Static Single Assignment (SSA) is an intermediate representation (IR) used by compilers where every variable is assigned exactly once. If a program logically needs to update a value, the compiler i..."
---
### Definition:

Static Single Assignment (SSA) is an intermediate representation (IR) used by compilers where every variable is assigned exactly once. If a program logically needs to update a value, the compiler invents a new, uniquely named version of that variable. This turns a program from a sequence of destructive updates into a directed flow of immutable values, making it trivial for optimization passes to trace where any number came from.

The Core Rule
Before SSA	In SSA
One storage box (x) is overwritten repeatedly.	Each write creates a fresh name (x1, x2, x3).
y = x is ambiguous—which x?	Every use points to exactly one definition.
Easy Analogy
Think of a checking account.

Normal code is like erasing and rewriting your balance on one line of a ledger: balance = 100, then overwrite it with balance = 120. Later, someone reading the ledger sees only the final number and has to guess what happened.
SSA is like a numbered receipt for every transaction. Each receipt shows the new balance and references the previous receipt number. If you want to know where the value 120 came from, there is exactly one receipt that produced it.

### Example:

```
SSA Form

x1 = 5
x2 = x1 + 2
y1 = x2 * 3
Now each name is born exactly once. The expression for y1 transparently consumes x2; there is no ambiguity and no backward search.
```
