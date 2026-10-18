---
title: "Kruskal's Algorithm"
termSlug: "kruskals-algorithm"
year: 2026
month: 3
monthName: "March"
day: 10
order: 7
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Kruskal's Algorithm is a greedy algorithm that finds the Minimum Spanning Tree (MST) of a graph — connecting all nodes together with the lowest possible total edge weight, using no cycles."
---
### Definition:

Kruskal's Algorithm is a greedy algorithm that finds the Minimum Spanning Tree (MST) of a graph — connecting all nodes together with the lowest possible total edge weight, using no cycles.

Given a network of nodes and weighted connections, Kruskal's finds the cheapest way to connect everything.

Key Concepts First
| Term | Meaning |
|----------------------|----------------------------------------------|
| Graph | A set of nodes connected by edges |
| Edge Weight | The cost of a connection between two nodes |
| Spanning Tree | A tree that connects all nodes with no cycles|
| Minimum Spanning Tree| The spanning tree with the lowest total weight|
| Cycle | A path that loops back to the starting node |
| Simple Analogy | |

🏘️ Imagine you're a city planner connecting 5 towns with roads. Each possible road has a different construction cost. You want to connect all towns while spending the least amount of money — and you don't need redundant roads (no loops). Kruskal's finds the cheapest set of roads to build.

### Example:

Building the MST step by step

```text
Step 1 — Add C─E (weight 1)        Step 2 — Add A─C (weight 2)
    A       B                           A       B
            │                           │
    C ─── E D                           C ─── E     D

Step 3 — Add B─D (weight 3)        Step 4 — Add A─B (weight 4)
    A       B                           A ─────── B
            │                           │         │
    C ─── E D                           C ─── E   D

                  ✅ Final MST (all 5 nodes connected!)
                      A ─────── B
                      │         │
                      C ─── E   D
                  Total cost = 1 + 2 + 3 + 4 = 10
```
