---
title: "Floyd-Warshall Algorithm"
termSlug: "floyd-warshall-algorithm"
year: 2025
month: 11
monthName: "November"
day: 14
order: 10
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "The Floyd-Warshall Algorithm is a dynamic programming algorithm that finds the shortest paths between all pairs of vertices in a weighted graph. It works with both positive and negative edge weight..."
---
### Definition:

The Floyd-Warshall Algorithm is a dynamic programming algorithm that finds the shortest paths between all pairs of vertices in a weighted graph. It works with both positive and negative edge weights (but no negative cycles).

**Key characteristics:**

- Time complexity: O(V³)
- Space complexity: O(V²)
- Works on directed and undirected graphs
- Finds shortest paths between ALL pairs of nodes

### Example:

Let's use a graph with 4 nodes (A, B, C, D):

```
A ----2---- B
|           |
5           1
|           |
C ----3---- D
Step 1: Create distance matrix (∞ means no direct path)

     A  B  C  D
A [  0  2  5  ∞ ]
B [  ∞  0  ∞  1 ]
C [  ∞  ∞  0  3 ]
D [  ∞  ∞  ∞  0 ]
Step 2: For each intermediate node k, update shortest paths

k = A: Check if going through A gives shorter path
k = B: Check if going through B gives shorter path
k = C: Check if going through C gives shorter path
k = D: Check if going through D gives shorter path
Final Result:

     A  B  C  D
A [  0  2  5  3 ]  ← A→D: A→B→D = 2+1 = 3
B [  ∞  0  ∞  1 ]
C [  ∞  ∞  0  3 ]
D [  ∞  ∞  ∞  0 ]
```
