---
title: "Consistent Hashing"
termSlug: "consistent-hashing"
year: 2026
month: 10
monthName: "October"
day: 2
order: 2
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Consistent hashing maps each key to a node without a global lookup table. It uses one rule: hash the keys and the nodes onto the same circle, then send each key to the first node clockwise from the..."
---
### Definition:

**Consistent hashing** maps each key to a node without a global lookup table. It uses one rule: hash the keys and the nodes onto the same circle, then send each key to the first node clockwise from the key. The circle is the range [0, 2^32) or [0, 2^64).

The design goal is **churn control**. When one node joins or leaves, only the keys that belong to that node move. Every other key stays on its node. That single property explains why the technique sits under caches, sharded databases, CDNs, and LLM routers.

The naive alternative is modulo hashing: `slot = h(key) mod N`. It is trivial and it breaks on membership change. Change N and almost every key lands on a different node. Every local cache entry, session binding, and warm connection dies at the same time.

```
MODULO HASHING vs CONSISTENT HASHING          (4 nodes, then add 1 node)
═══════════════════════════════════════      ═════════════════════════════════════
 slot = h(key) mod N                          nodes AND keys share one circle
 N lives inside every client                  key → first node clockwise

   slots from 4 nodes                         4 points on the ring, 0 .. 2^32
   ┌─────┬─────┬─────┬─────┐                       B
   │  0  │  1  │  2  │  3  │                     ╱   ╲
   └─────┴─────┴─────┴─────┘                   A       C     key u_104 hashes
    ▲     ▲     ▲     ▲                        ╲       ╱     to the tick mark,
    │     │     │     │                         D  ◀──╯      so it goes to D.
   3 keys 5 keys 4 keys 8 keys
   (evenly by luck, never by                       ┌──────────────┐
   design)                                         │  A─B─C─D     │
                                                   │  clockwise   │
   ADD node 4 → slot = h(k) mod 5                  └──────────────┘

   re-check all 20 keys                         ADD node E on the D→A arc

   key   h(k)  mod 5   was  now                    D ─── A   becomes  D ─ E ─ A
   ───────────────────────────
   u_101  55     0     D    A  ✗ moved              only the keys inside the
   u_102  56     1     A    B  ✗ moved              D→A arc move to E.
   u_103  57     2     B    C  ✗ moved
   u_104  58     3     C    D  ✗ moved              no other key moves.
   ... 80% of all keys move                         at most 1/4 of keys move
                                                    here, and the rest are
   ~every cache entry is now cold                   untouched.
```

The repair is a **hash ring with virtual nodes**. A single point per node gives a node a random and often huge arc. Many points per node (16, 100, 256 — the number is a tuning knob) chop the ring into small arcs and drive the load error down.

```
WHY ONE POINT PER NODE IS NOT ENOUGH
═══════════════════════════════════════════════════════════════════
 ONE POINT PER NODE                   MANY POINTS PER NODE

 arcs are random and lopsided         each node owns many small arcs

   A ████████████████████  61%          A ██████  26%
   B ██                     8%          B ██████  25%
   C ▪                      2%          C █████   24%
   D █████████             29%          D ██████  25%

   A melts. C idles.                    Load spread is even. A node
   Removing C moves 61% of keys.        that leaves moves its ~1/N only.
```

The ring is old and boring in the best way. Karger and his co-authors published it in 1997 for web caches. Amazon's Dynamo paper used it in 2007 with virtual nodes. Cassandra, Riak, Chord, Voldemort, and the memcached client libketama shipped it. Envoy's `ring_hash` load balancer pads a ring to a minimum size (1024 entries by default). Cassandra turns virtual nodes on by default (`num_tokens`, 16 in recent releases, 256 in older ones). The hash is usually xxHash or MurmurHash, not MD5, because the router must stay cheap.

One honest boundary: the ring balances **keys**, not **load**. Hash output is uniform, but key popularity is not. One hot key still lands on one node, and that node still overloads.

```
THE FAMILY — HOW A KEY PICKS ITS NODE
═══════════════════════════════════════════════════════════════════════════
                    needs a sorted   minimal      best use
                    ring?            movement?
 ─────────────────────────────────────────────────────────────────────────
 Modulo hashing     no               no           fixed pool, no resize
                                                   (e.g. 16384 fixed slots in
                                                   Redis Cluster)
 Consistent         yes              yes          caches, DHTs, sharded
 hashing                                           stores, sticky routing
 Rendezvous / HRW   no               yes          pick max(h(key,node)).
 hashing (1998)                                    O(N) per lookup, no ring
                                                   to build or store
 Jump hash (2014)   no               yes          constant memory, but
                                                   numbered buckets only
 Bounded-load CH    yes              yes          ring plus a capacity rule.
 (2018)                                            Kills hot spots. Adds a
                                                   clockwise walk
 ─────────────────────────────────────────────────────────────────────────
 Rule of thumb: any balanced scheme must move about 1/N of the keys when one
 node joins N nodes. The ring reaches that floor and adds no coordination.
```

**Consistent hashing with bounded loads (CHWBL)** closes the hot-spot gap. Mirrokni, Thorup, and Zadimoghaddam proposed it in 2018. Each node gets a hard capacity near the mean:

```
capacity = ceil( c * m / n ),   c = 1 + ε > 1
```

A key that finds its primary node full walks clockwise to the first node with room. Now placement is still sticky, but no node passes the cap. The known cost is **cascaded overflow**: when several nodes in a row are full, all their spill lands on the next free node, and that node fills faster. Later work fixes the cascade with random jumps instead of a clockwise walk.

Honest limits:

- **Balance of keys is not balance of load.** Skew in key popularity, request size, or per-node cost defeats a perfect ring. Measure load per node, not key count.
- **Bounded loads trade cache for safety.** A spilled request lands on a node with a cold cache. That is a real cost. It is the central tension in LLM serving (see Example).
- **Every client must see the same ring version.** A stale ring sends a key to the wrong node. Version the ring and publish it atomically.
- **The ring does not resize cheaply in every design.** Rebuilding a few thousand vnode points is cheap. Rebuilding a full lookup table, as Maglev does, is a global operation.
- **A repartition is not free.** Removing a node does load its successor with the whole departed arc until data moves or the cache refills.

### Example:

A platform serves a 70B model on 24 vLLM replicas behind an LLM gateway. Agent workloads share long prefixes: the same 2,400-token system prompt, the same tool schemas, and a per-tenant LoRA adapter. vLLM keeps the prefill work of those prefixes in a **KV cache** (prefix caching).

Round-robin routing destroys that reuse. The prefix lands on R7, then R2, then R9, then R7 again. Each replica holds only a small piece of the prefix, KV blocks get evicted under pressure, and the shared 2,400 tokens are prefilled again and again. Time to first token (TTFT) stays high and unstable.

The fix is to route on the prefix instead of a random id, and to keep a load cap so affinity does not create a hot replica.

```
THE ROUTER — PREFIX AFFINITY WITH A LOAD CAP
═══════════════════════════════════════════════════════════════════════
 request: prefix P (2,400 tokens) + adapter "bantukode"

   h(P + adapter) ─────────────────────▶ position on the ring
                                              │
                                              ▼
                                        primary replica R3
                                        ┌──────────────────────┐
                                        │ load = 178% of cap   │
                                        └──────────┬───────────┘
                                                   │  cap rule:
                                                   │  walk clockwise
                                                   ▼
                                        R4  load = 91%  ──▶  serve here
                                                             (prefix cold,
                                                              extra prefill,
                                                              but no overload)
 rules in one config file:
   strategy        PrefixHash          (hash prefix + adapter name)
   meanLoadFactor  125                 (cap = 1.25 × mean load)
   replication     256                 (vnode points per replica)
```

Before and after, on the same fleet:

```
RANDOM ROUTING                       RING HASH + 1.25 LOAD CAP
══════════════════════════════       ══════════════════════════════════════
 prefix hits a different replica      prefix always maps to one replica,
 on almost every request              and spills only when that replica is
                                      above the cap
 KV hit rate      ~64%                KV hit rate      ~93%
 TTFT at 1,200    baseline            TTFT at 1,200    ~95% lower
 concurrent reqs                      throughput        ~127% higher
 at saturation    baseline            capacity          ~2.3× at a 3.5s p99
```

The last row is not a toy. A 2026 study (CacheRoute) reports 93.2% served KV hit and 2.3× the capacity of the strongest baseline on 60 H100 GPUs with Llama-3.3-70B in FP8. KubeAI's PrefixHash benchmark reports the 95% TTFT cut and the 127% throughput gain at 1,200 concurrent requests.

The same study also publishes the counterexample, and it matters more than the win. On two 32B workloads, the recoverable prefix work was too small. Affinity then bought almost no KV reuse, while its residual load skew stayed. Capacity fell instead of rising. So the rule is not "always pin keys". The rule is "pin keys only where the workload gives the pin something back".

Six rules carry the pattern:

- **Hash the thing you want to keep together.** Session id, tenant id, prefix, or shard key. Never a random request id.
- **Freeze the hash input.** Add a version tag to the key. One silent change to the key format invalidates the whole cache on deploy.
- **Use virtual nodes.** A ring with one point per node behaves worse than random. Start at 100 to 256 points.
- **Add a load cap.** Pure affinity converts key skew into hot spots. A cap near 1.25× mean load keeps the ring useful at saturation.
- **Watch the right signals.** Served cache hit rate, per-node imbalance, and p99. A drop in a single node's hit rate shows a ring bug early.
- **Test on your own workload.** Published speedups belong to the workload that produced them. Replay your own traffic before you enable affinity.

The punchline: consistent hashing is not a load balancer. It is a **placement** function with a minimal-movement guarantee. It keeps a key on the same node across membership changes, and it costs one hash and one binary search. Everything else — the vnode count, the load cap, the spill rule — is a knob you have to set against real traffic. Get the key right, keep the ring identical on every client, and put a ceiling on each node. Then adding the 25th replica is a boring event, which is the entire point.
