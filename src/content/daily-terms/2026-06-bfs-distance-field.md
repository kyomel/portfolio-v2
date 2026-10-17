---
title: "BFS Distance Field"
termSlug: "bfs-distance-field"
year: 2026
month: 6
monthName: "June"
day: 22
order: 16
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "Distance field: grid where each cell contains distance to nearest obstacle BFS (Breadth-First Search) algorithm to compute this field Used in pathfinding, collision detection, shadow mapping"
---
### Definition:

- Distance field: grid where each cell contains distance to nearest obstacle
- BFS (Breadth-First Search) algorithm to compute this field
- Used in pathfinding, collision detection, shadow mapping
- Key properties:
  - Euclidean distance (true straight-line distance)
  - Signed distance (negative inside obstacles)
  - Smooth gradients (useful for interpolation)

### Example:

```
Visualization of BFS distance field computation:
  - Obstacle grid (walls, trees)
  - Wavefront propagation from obstacles
  - Final distance field (heatmap)
```

### Key Concepts:

- BFS guarantees shortest path in unweighted grid
- Distance field enables efficient spatial queries
