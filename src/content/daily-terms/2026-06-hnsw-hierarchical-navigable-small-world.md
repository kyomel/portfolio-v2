---
title: "HNSW (Hierarchical Navigable Small World)"
termSlug: "hnsw-hierarchical-navigable-small-world"
year: 2026
month: 6
monthName: "June"
day: 16
order: 12
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "HNSW is a graph-based Approximate Nearest Neighbor (ANN) search algorithm that organizes high-dimensional vectors (embeddings) into a hierarchy of navigable small-world graphs. It builds on two ideas:"
---
### Definition:

HNSW is a graph-based Approximate Nearest Neighbor (ANN) search algorithm that organizes high-dimensional vectors (embeddings) into a hierarchy of navigable small-world graphs. It builds on two ideas:

1. **Navigable Small World (NSW)** — A graph where each node is connected to its nearest neighbors, creating short paths between any two nodes (the "small world" property: you can reach any node in a few hops).
2. **Multi-Layer Hierarchy** — The graph is stratified into layers. The topmost layers are sparse, containing only a few nodes with long-range edges (coarse search). The bottom layer contains all nodes with short, precise edges (fine search).

**How search works:** Starting from the top layer, you greedily navigate to the nearest node, then descend to the layer below using that node as the entry point. Repeat until you reach the bottom layer, where you perform a fine-grained search among the closest neighbors. This is like searching a map at different zoom levels — first pan across continents, then zoom into a city, then find the exact street.

**Why it matters:** HNSW is the de facto standard for vector search today. It powers vector databases like Pinecone, Qdrant, Weaviate, and pgvector's ivfflat alternatives. It achieves search complexity of O(log N) with high recall — orders of magnitude faster than brute-force k-NN.

Analogy — Google Maps Zoom Levels 🗺️

Imagine you're looking for a specific coffee shop in Jakarta.

- **Top layer (zoom level 1):** You see only major cities — Jakarta, Surabaya, Bandung. You click Jakarta.
- **Middle layer (zoom level 5):** You see Jakarta's districts — Menteng, Kemang, Kelapa Gading. You click Menteng.

### Example:

Vector Search with a Minimal HNSW Implementation

```python
import numpy as np
import heapq
import random

class SimpleHNSW:
    """Minimal HNSW for learning — not production-grade."""

    def __init__(self, dim: int, M: int = 16, ef_construction: int = 200):
        self.dim = dim
        self.M = M
        self.ef_construction = ef_construction
        self.nodes = []
        self.graphs = []
        self.max_level = 0
        self.enter_point = None

    def _random_level(self) -> int:
        level = 0
        while random.random() < 0.5 and level < 16:
            level += 1
        return level

    def _search_layer(self, query, entry, ef, layer):
        """Greedy search on a single layer."""
        visited = {entry}
        dist_entry = np.linalg.norm(query - self.nodes[entry])
        candidates = [(dist_entry, entry)]
        heapq.heapify(candidates)
        result = [(dist_entry, entry)]

        while candidates:
            dist_c, c = heapq.heappop(candidates)
            furthest = max(result, key=lambda x: x[0])[0]
            if dist_c > furthest:
                break
            for neighbor in self.graphs[layer].get(c, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    dist_n = np.linalg.norm(query - self.nodes[neighbor])
                    furthest = max(result, key=lambda x: x[0])[0]
                    if dist_n < furthest or len(result) < ef:
                        heapq.heappush(candidates, (dist_n, neighbor))
                        result.append((dist_n, neighbor))
                        result = heapq.nsmallest(ef, result, key=lambda x: x[0])
        return result

    def insert(self, vector):
        node_id = len(self.nodes)
        self.nodes.append(vector)
        level = self._random_level()

        while len(self.graphs) <= level:
            self.graphs.append({})
        for l in range(level + 1):
            self.graphs[l][node_id] = set()

        if self.enter_point is None:
            self.enter_point = node_id
            self.max_level = level
            return

        curr_entry = self.enter_point
        for l in range(self.max_level, level, -1):
            result = self._search_layer(vector, curr_entry, 1, l)
            curr_entry = result[0][1]

        for l in range(min(level, self.max_level), -1, -1):
            result = self._search_layer(vector, curr_entry, self.ef_construction, l)
            neighbors = [n for _, n in result[:self.M]]
            self.graphs[l][node_id] = set(neighbors)
            for n in neighbors:
                self.graphs[l][n].add(node_id)
                if len(self.graphs[l][n]) > self.M:
                    n_neighbors = list(self.graphs[l][n])
                    n_dists = [(np.linalg.norm(self.nodes[n] - self.nodes[nn]), nn)
                               for nn in n_neighbors]
                    n_dists.sort(key=lambda x: x[0])
                    self.graphs[l][n] = {nn for _, nn in n_dists[:self.M]}
            curr_entry = result[0][1]

        if level > self.max_level:
            self.max_level = level
            self.enter_point = node_id

    def search(self, query, k=5):
        if self.enter_point is None:
            return []
        curr_entry = self.enter_point
        for l in range(self.max_level, 0, -1):
            result = self._search_layer(query, curr_entry, 1, l)
            curr_entry = result[0][1]
        result = self._search_layer(query, curr_entry, k, 0)
        return [(dist, nid) for dist, nid in heapq.nsmallest(k, result, key=lambda x: x[0])]

```
