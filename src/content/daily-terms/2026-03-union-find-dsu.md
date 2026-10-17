---
title: "Union Find (DSU)"
termSlug: "union-find-dsu"
year: 2026
month: 3
monthName: "March"
day: 5
order: 4
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Union Find (also known as Disjoint Set Union / DSU) is a data structure that efficiently tracks which elements belong to the same group, and supports two core operations — merging groups and checki..."
---
### Definition:

Union Find (also known as Disjoint Set Union / DSU) is a data structure that efficiently tracks which elements belong to the same group, and supports two core operations — merging groups and checking if two elements are in the same group.

Think of it as managing a collection of non-overlapping groups, where you can quickly unite two groups or ask "are these two things connected?"

Simple Analogy
👥 Imagine a school with students forming friend groups. At first, everyone is their own group. As friendships form, groups merge together. Union Find lets you instantly answer "Are Alice and Bob in the same friend group?" — even after hundreds of merges.

The 2 Core Operations
| Operation | Description |
|-----------|-------------|
| find(x) | Find which group/set element x belongs to (returns the root/representative) |
| union(x, y) | Merge the groups containing x and y into one |

### Example:

Imagine checking if computers in a network are connected

```
Always attach the smaller tree under the larger tree to avoid tall unbalanced chains:

Bad (no rank):        Good (with rank):
  0                       0
  |                     / | \
  1                    1  2  3
  |
  2
  |
  3
Time Complexity
Operation	Naive	With Both Optimizations
find(x)	O(n)	O(α(n)) ≈ O(1)
union(x, y)	O(n)	O(α(n)) ≈ O(1)
α(n) is the inverse Ackermann function — grows so slowly it's effectively constant for all practical input sizes.
```
