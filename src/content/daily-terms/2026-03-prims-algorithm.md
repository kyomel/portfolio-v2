---
title: "Prim's Algorithm"
termSlug: "prims-algorithm"
year: 2026
month: 3
monthName: "March"
day: 9
order: 6
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Prim's Algorithm is a greedy algorithm used to find the Minimum Spanning Tree (MST) of a weighted, undirected graph. It builds the MST by starting from any node and greedily adding the cheapest edg..."
---
### Definition:

Prim's Algorithm is a greedy algorithm used to find the Minimum Spanning Tree (MST) of a weighted, undirected graph. It builds the MST by starting from any node and greedily adding the cheapest edge that connects a visited node to an unvisited node — one edge at a time — until all nodes are included.

A Minimum Spanning Tree is a subset of edges that connects all nodes in a graph with the minimum possible total edge weight, without forming any cycles.

💡 Simple Analogy
Imagine you're a city planner connecting 5 towns with roads. You want every town connected, but you want to spend as little money as possible on road construction. Prim's Algorithm says: "Start at one town, always build the cheapest road to the nearest unconnected town next."

⚙️ How It Works — Step by Step
| Step | Action |
|------|--------|
| 1 | Start at any node — mark it as visited |
| 2 | Look at all edges from visited nodes to unvisited nodes |
| 3 | Pick the cheapest edge |
| 4 | Add that edge and its new node to the MST |
| 5 | Repeat steps 2–4 until all nodes are visited |

### Example:

Graph Setup

```
        2       3
   A ——————B ——————C
   |       |       |
 6 |     8 |     7 |
   |       |       |
   D——————E ——————F
        5       4

Edge List with Weights
| Edge | Weight |
|------|--------|
| A–B  | 2      |
| A–D  | 6      |
| B–C  | 3      |
| B–E  | 8      |
| C–F  | 7      |
| D–E  | 5      |
| E–F  | 4      |

🔍 Prim's Walkthrough — Starting at Node A
Step 1 — Start at A

Visited: [A]
Available edges: A–B(2), A–D(6)
✅ Pick cheapest → A–B (weight 2)
Step 2 — Add B

Visited: [A, B]
Available edges: A–D(6), B–C(3), B–E(8)
✅ Pick cheapest → B–C (weight 3)
Step 3 — Add C

Visited: [A, B, C]
Available edges: A–D(6), B–E(8), C–F(7)
✅ Pick cheapest → A–D (weight 6)
Step 4 — Add D

Visited: [A, B, C, D]
Available edges: B–E(8), C–F(7), D–E(5)
✅ Pick cheapest → D–E (weight 5)
Step 5 — Add E

Visited: [A, B, C, D, E]
Available edges: C–F(7), E–F(4), B–E(skip–visited)
✅ Pick cheapest → E–F (weight 4)
✅ All nodes visited — MST complete!
```
