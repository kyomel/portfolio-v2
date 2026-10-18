---
title: "Dijkstra's Algorithm"
termSlug: "dijkstras-algorithm"
year: 2026
month: 10
monthName: "October"
day: 14
order: 10
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Dijkstra's algorithm finds the shortest path from one source node to every other node in a weighted graph. Every edge carries a cost. The cost is called a weight, for example minutes, kilometers, o..."
---
### Definition:

**Dijkstra's algorithm** finds the shortest path from one source node to every other node in a weighted graph. Every edge carries a cost. The cost is called a weight, for example minutes, kilometers, or dollars. The algorithm returns the cheapest total cost to each node. It also returns the path that reaches that cost.

Edsger W. Dijkstra designed the algorithm in 1956 and published it in 1959. The first problem was a route between two cities in the Netherlands. The machine was the ARMAC. Dijkstra designed the method in about 20 minutes, in a cafe, with no pencil and no paper. The algorithm is now the default shortest-path engine. It runs in map services, network routers, and game pathfinding.

The algorithm is greedy. One rule controls the whole run: **always work on the unfinished node with the smallest known cost.** Then settle that node. A settled node never changes again.

That rule needs one condition. All edge weights must be zero or positive. With a positive weight, no later path can reach a settled node with a smaller cost. The proof is short. Every remaining path travels through the frontier. The frontier holds costs that are already larger than the settled cost. Any addition makes them larger again. A negative weight breaks that argument, and the algorithm returns a wrong answer.

```text
THE THREE REGIONS DURING A RUN
═══════════════════════════════════════════════════════════════════
  ┌─────────────────┐   relax an edge   ┌──────────────────┐
  │   UNREACHED     │ ────────────────▶ │     FRONTIER     │
  │   dist = inf    │                   │   min-heap of    │
  │   no path yet   │ ◀──────────────── │   known costs    │
  └─────────────────┘   never goes back └────────┬─────────┘
                                                 │ pop the
                                                 │ smallest cost
                                                 ▼
                                        ┌──────────────────┐
                                        │     SETTLED      │
                                        │  dist is final   │
                                        │  never updated   │
                                        └──────────────────┘

  node count:  UNREACHED shrinks, FRONTIER floats, SETTLED grows.
  every node crosses from left to right exactly one time.
```

The whole algorithm is one loop and one comparison. The comparison is called a **relaxation**.

```
dist[source] = 0
dist[other]  = infinity
heap         = [ (0, source) ]

while heap is not empty:
    (d, u) = heap.pop_min()
    if d > dist[u]:                  # stale entry, skip it
        continue
    for (v, w) in edges[u]:
        if dist[u] + w < dist[v]:    # the relaxation step
            dist[v] = dist[u] + w
            heap.push( (dist[v], v) )
```

Two names matter in that loop. `u` is the node you settle. `v` is a neighbour of `u`. The heap holds pairs. A pair carries a cost and a node.

The heap explains the cost of the algorithm. A heap keeps the smallest item on top, and it keeps them in order. Order is a sort. A sort costs one log factor. Dijkstra cannot remove that factor, and that single fact stayed unbroken for 66 years.

The greedy rule gives a second property. The pop order is already sorted by cost. The algorithm sorts the nodes while it searches them. That property is a useful debugging tool, and it also explains the 2025 result at the end of this entry.

The naive alternative is BFS. BFS counts hops, not cost. On an unweighted graph the two ideas agree. On a weighted graph they disagree at the first cheap detour.

```text
FEWEST HOPS (BFS)  vs  LOWEST COST (DIJKSTRA)
══════════════════════════════════════════════════════════════════════
 EDGES, weight in minutes
   W -> A = 4     W -> B = 1     B -> A = 2
   A -> C = 5     B -> C = 8     C -> D = 3

   W ──4──▶ A ──5──▶ C ──3──▶ D        BFS: hop count wins
   │                   ▲                 3 hops, cost 4 + 5 + 3 = 12 min
   1                   2
   │                   │
   ▼                   │                DIJKSTRA: cost wins
   B ───────8──────────┘                 4 hops, cost 1 + 2 + 5 + 3 = 11 min

 ─────────────────────────────────────────────────────────────────────
  BFS returns the route with fewer hops.  Dijkstra returns the route
  with the lower bill.  The two answers are both correct.  They answer
  different questions.
```

The data structure changes the running time. Nothing else does.

```text
 TIME COMPLEXITY BY PRIORITY QUEUE
═════════════════════════════════════════════════════════════════════
 STRUCTURE          TIME                  BEST WHEN
 ─────────────────────────────────────────────────────────────────────
 binary min-heap    O((V + E) log V)      the normal default
 plain array scan   O(V^2)                E close to V^2 (dense graph)
 Fibonacci heap     O(E + V log V)        dense graph, decrease-key
 ─────────────────────────────────────────────────────────────────────
 V = nodes, E = edges.  Most libraries ship the binary heap version.
 Edge storage: adjacency list.  Space: O(V + E).
 Early exit: stop when the target node leaves the heap.
```

**The negative weight boundary.** One negative edge is enough to break the result.

```text
WHY NEGATIVE WEIGHTS BREAK THE GREEDY RULE
═══════════════════════════════════════════════════════════════════
   edges:  S -> A = 2      S -> B = 5      B -> A = -4

   S ──2──▶ A          true cheapest path to A:
   │                   S -> B -> A  =  5 + (-4)  =  1
   5                   ─────────────────────────────────────────
   │                   Dijkstra run:
   ▼                     step 1  pop A, cost 2     settle A at 2
   B ──(-4)──▶ A         step 2  pop B, cost 5     settle B at 5
                         step 3  relax B -> A      found 1, but A
                                 is already settled
                       ─────────────────────────────────────────
                       answer from Dijkstra: 2      truth: 1
                       one negative edge, one wrong number.
```

Use Bellman-Ford or Johnson's algorithm when the graph has negative weights. Bellman-Ford also detects a negative cycle.

```
 CHOOSING A SINGLE-SOURCE SHORTEST PATH ALGORITHM
═══════════════════════════════════════════════════════════════════════
 ALGORITHM      WEIGHTS ALLOWED     KEY PROPERTY        TYPICAL USE
 ──────────────────────────────────────────────────────────────────────
 BFS            all equal           fewest hops         unweighted graph
                                    queue, not heap
 Dijkstra       zero or positive    settles each node   routing tables,
                                    one time            maps, dispatch
 Bellman-Ford   negative allowed    detects negative    finance, price
                                    cycles              arbitrage
 A*             zero or positive    needs a heuristic   one target,
                                    to cut the search   map navigation
 ──────────────────────────────────────────────────────────────────────
 Dijkstra is the default.  Leave it only when a column forces you out.
```

**2025 update: the sorting barrier falls.** For 66 years the O(m + n log n) bound held on sparse graphs. People treated it as a law of nature. In April 2025, Duan, Mao, Mao, Shu and Yin published a deterministic algorithm for directed graphs with real non-negative weights. The bound is O(m log^(2/3) n). It is the first result to beat Dijkstra on sparse graphs. The method drops the full sort. It uses a partial order and a small set of "pivots", and it tolerates a bounded amount of guesswork.

```
THE SORTING BARRIER, BEFORE AND AFTER
═══════════════════════════════════════════════════════════════════════
 1959 - 2025   O(m + n log n)          Dijkstra and friends
 2025          O(m log^(2/3) n)        Duan, Mao, Mao, Shu, Yin

 n = 1e6, m = 1e6 (sparse)
   log2 n        = 19.93     Dijkstra term cost  ≈ 2.1e7 unit steps
   log2^(2/3) n  = 7.35      new algorithm cost  ≈ 7.4e6 unit steps
   ratio 2.85x fewer steps, in theory
 ───────────────────────────────────────────────────────────────────────
 n = 1e6, m = 1e7 (denser)
   Dijkstra      ≈ 3.0e7     new algorithm       ≈ 7.4e7
   ratio 0.41x              the new bound LOSES here
 ───────────────────────────────────────────────────────────────────────
  Read the second block first.  The new bound wins when the graph is
  sparse, and it loses when the edge count grows.  The unit-step counts
  are asymptotics, not a benchmark.  Constant factors and memory access
  decide real timings.
```

Honest status in 2026: this is a theory result. Production code still runs Dijkstra, A*, and contraction hierarchies. The new method is complex to implement, and it optimises the asymptotic step count, not the cache. That does not reduce the result. It removes a barrier that people believed was permanent.

### Example:

**A courier route in a dispatch engine.**

A delivery platform routes one courier from warehouse `W` to customer `D`. Edge weights are travel minutes. The graph has one trap: the shortest hop route is not the fastest route.

```text
THE INPUT GRAPH (minutes, directed)
═══════════════════════════════════════════════════════════════════════
        W ──4──▶ A ──5──▶ C ──3──▶ D
        │                  ▲
        1                  2
        │                  │
        ▼                  │
        B ────────8────────┘
```

The engine runs Dijkstra from `W`. Each row shows one settled node. A star marks a stale heap entry, created when a cheaper path arrived later.

```
TRACE OF THE RUN
════════════════════════════════════════════════════════════════════════
 STEP  SETTLED   HEAP AFTER RELAXATION         dist  W    A    B    C    D
 ────────────────────────────────────────────────────────────────────────
 init    -        W(0)                           W 0    inf  inf  inf  inf
   1     W        B(1), A(4)                     W 0     4    1   inf  inf
   2     B        A(3), A(4)*, C(9)              W 0     3    1    9   inf
   3     A        C(8), C(9)*, A(4)*             W 0     3    1    8   inf
   4     C        D(11), C(9)*, A(4)*            W 0     3    1    8    11
   5     D        empty, stale entries skipped   W 0     3    1    8    11
 ────────────────────────────────────────────────────────────────────────
 * stale entry.  the heap keeps the old value, the code skips it at pop.
   pop order: 0, 1, 3, 8, 11  -  strictly increasing cost, by construction.
```

Two relaxations changed a value that was already in the heap. Step 2 found a cheaper path to `A`, cost 3 instead of 4. Step 3 found a cheaper path to `C`, cost 8 instead of 9. Both old entries stayed in the heap, and both were skipped. This is the **lazy deletion** style. It costs extra heap space and removes the need for a `decrease-key` operation. Most production libraries prefer it.

The engine reconstructs the path from the `prev` pointer of each node.

```text
THE TWO ROUTES THE ENGINE COULD RETURN
═══════════════════════════════════════════════════════════════════════
 BFS route      W ─▶ A ─▶ C ─▶ D            3 hops     12 minutes
 DIJKSTRA route W ─▶ B ─▶ A ─▶ C ─▶ D       4 hops     11 minutes
 ───────────────────────────────────────────────────────────────────────
 the extra hop pays for itself:  W -> B costs 1 minute, not 4.
 1 minute saved on the courier, multiplied by 4,000 runs a day,
 4,000 minutes saved a day.  The dispatch engine ships Dijkstra.
```

Production adds three accelerations on top of the plain algorithm. A* replaces the heap order with `dist + heuristic`, so the search leans toward the target. Contraction hierarchies precompute shortcuts, because the road graph changes rarely and queries arrive constantly. Bidirectional search runs one Dijkstra from each end and stops at the meeting point. OSPF routers use the plain algorithm, under the name **SPF**, and recompute it after every topology change.

One boundary worth naming. Dijkstra is a single-source method. All-pairs queries need one run per source, or a different algorithm, as in Floyd-Warshall. For the courier case the single-source form is the correct shape, because the warehouse stays the same and the customer changes all day.
