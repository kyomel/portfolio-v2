---
title: "Vector Clocks"
termSlug: "vector-clocks"
year: 2026
month: 10
monthName: "October"
day: 5
order: 3
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "A vector clock is a logical clock made of a vector of counters. The system has N nodes. Each node keeps one counter per node in the system. A node updates its own counter and copies the counters it..."
---
### Definition:

A vector clock is a logical clock made of a vector of counters. The system has N nodes. Each node keeps one counter per node in the system. A node updates its own counter and copies the counters it learns from messages.

The purpose is one question: did event A cause event B, or are the two events independent? A physical clock cannot answer this question. A vector clock answers it exactly.

**Why wall-clock time fails.** Every node has its own clock. Cloud clocks drift apart. Published measurements put the drift between NTP-synced cloud machines at roughly 10 to 250 milliseconds. So a timestamp comparison across nodes is a guess. Two events with no causal link land in an order that is real in the clock and false in the world.

```text
WALL CLOCK — an order that looks true and is false
════════════════════════════════════════════════════════════════════════

  node A  write "kopi"      wall clock 12:00:00.010
  node B  write "gula"      wall clock 12:00:00.030

  naive read: A came first, so B is newer. keep B. delete A.
  truth     : A and B never saw each other. both are valid.
              the delete lost a customer order.
```

**Causality, not simultaneity.** Lamport (1978) defined the happens-before relation. It has three rules:

1. Two events on the same node are ordered by program order. The earlier event happens before the later event.
2. A send event happens before the matching receive event.
3. The relation is transitive. A before B and B before C means A before C.

Two events are **concurrent** when neither happens before the other. Concurrent does not mean simultaneous. It means causally unrelated.

**The scalar clock and its one-way guarantee.** A Lamport clock keeps one integer per node. It gives a total order that respects causality, and it is cheap. The guarantee is one-way only:

```text
LAMPORT CLOCK — cheap, but one direction only
════════════════════════════════════════════════════════════════════════

  rule:   a -> b   implies   L(a) < L(b)
  limit:  L(a) < L(b)  does NOT imply  a -> b

  trace:  node A: a1 send m1 ─────────────────────► a3 recv m2
          node B:         recv m1 ─► b2 send m2 ─►
          node C: c1 local event (C talks to nobody)

  ┌──────────────────────────────────────────────────────────────────┐
  │ LAMPORT CLOCK  (one integer per node)                            │
  │                                                                  │
  │   a1 = 1            m1 carries 1                                 │
  │   b2 = max(0,1)+1 = 2      b3 = 3      m2 carries 3              │
  │   a3 = max(1,3)+1 = 4                                            │
  │   c1 = 1                                                         │
  │                                                                  │
  │   a3 = 4  vs  c1 = 1   ->  clock reports: a3 came later          │
  │   but A and C never exchanged a message. the clock lies.         │
  └──────────────────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────────────────┐
  │ VECTOR CLOCK  (N counters, one per node)                         │
  │                                                                  │
  │   a1 = [1,0,0]     m1 carries [1,0,0]                            │
  │   b2 = max([0,0,0],[1,0,0]) = [1,0,0], then +1 on B -> [1,1,0]   │
  │   b3 = [1,2,0]     m2 carries [1,2,0]                            │
  │   a3 = max([1,0,0],[1,2,0]) = [1,2,0], then +1 on A -> [2,2,0]   │
  │   c1 = [0,0,1]                                                   │
  │                                                                  │
  │   a3 = [2,2,0]  vs  c1 = [0,0,1]                                 │
  │   component 1: 2 > 0.  component 3: 0 < 1.                       │
  │   neither vector dominates  ->  CONCURRENT                       │
  │   the clock reports the truth.                                   │
  └──────────────────────────────────────────────────────────────────┘
```

The third counter is the whole difference. One integer carries one number. A vector carries a history, one entry per node.

**The clock rules.** Three events update a vector clock:

```text
RULES — local event, send, receive
════════════════════════════════════════════════════════════════════════

  local event on node i     V[i] = V[i] + 1
  send                      V[i] = V[i] + 1, then attach the whole vector
  receive on node i         for every j:  V[j] = max(V[i][j], incoming[j])
                            then        V[i] = V[i] + 1

  the receive rule is the important one. the node absorbs the history of
  the sender before it records its own event.
```

**The comparison rule.** Two vectors compare in three ways. The result is exact, not a heuristic.

```text
THE COMPARISON RULE — three outcomes, no guessing
════════════════════════════════════════════════════════════════════════

  V(a) <= V(b)  means  every counter of V(a) <= the matching counter of V(b)

  ┌────────────────────────┬─────────────────────────────┬─────────────────┐
  │ relation of the two    │ meaning                     │ what to do      │
  ├────────────────────────┼─────────────────────────────┼─────────────────┤
  │ all counters equal     │ same event, same version    │ nothing         │
  │ V(a) <= V(b), one <    │ a happened before b         │ keep b, drop a  │
  │ neither <= the other   │ a and b are concurrent      │ merge or ask    │
  └────────────────────────┴─────────────────────────────┴─────────────────┘

  causal join (merge) = component-wise maximum
     [1,0,0] join [0,1,0] = [1,1,0]   both histories are kept
     the join decides what is known. it does not decide which value wins.
```

The strength of the mechanism is the biconditional: `V(a) < V(b)` if and only if `a` happens before `b`. A scalar clock gives one direction. A vector clock gives both directions, and it exposes concurrency as a first-class answer.

**The cost.**
- Memory: O(N) per event or per stored version, where N is the number of writers. A three-node cluster pays three counters. A fleet of clients pays one counter per client.
- Compare: O(N) integer comparisons. Cheap at 3 to 9 nodes. Non-trivial at hundreds of nodes.
- Metadata: every write carries the vector. For a small value (a flag, a counter), the metadata can be larger than the payload.

**Variants, and the problem each one fixes.**

```text
THE FAMILY — same idea, different scope
════════════════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────────┬───────────────────────────┐
  │ MECHANISM          │ WHAT IT ORDERS       │ SCOPE / LIMIT             │
  ├────────────────────┼──────────────────────┼───────────────────────────┤
  │ wall clock + NTP   │ nothing causal       │ drift 10-250 ms, can jump │
  │ Lamport clock      │ total order          │ cannot detect concurrency │
  │ vector clock       │ cause and effect     │ O(N), N = writers         │
  │ version vector     │ stored data versions │ keyed on storage nodes    │
  │ dotted version     │ stored data versions │ dot + server context,     │
  │ vector (DVV)       │                      │ fixes sibling explosion   │
  │ hybrid logical     │ causality + near     │ 64 bit, no concurrency    │
  │ clock (HLC)        │ wall-clock time      │ detection, needs bounded  │
  │                    │                      │ clock skew                │
  └────────────────────┴──────────────────────┴───────────────────────────┘

  a vector clock counts events on processes.
  a version vector counts data versions on storage nodes.
  the structure is the same. the meaning is different.
```

HLC packs 48 bits of physical time and 16 bits of logical counter into one 64-bit value (Kulkarni et al., 2014). The physical part keeps the timestamp readable and sortable. The logical part keeps the causality rule. CockroachDB, YugabyteDB and MongoDB use HLC-style clocks. HLC is one-way like Lamport, so it orders writes but does not detect concurrency.

**Pros and cons.**
- Pro: exact concurrency detection. No false order, no silent loss from a bad timestamp.
- Pro: no central coordinator. Each node decides locally.
- Pro: the merge operation is defined. The component-wise maximum always exists.
- Con: size grows with the number of writers. Unbounded client fleets break plain vector clocks.
- Con: the merge of the vectors is automatic, but the merge of the values is application work. A cart unions. A ledger must not guess.
- Con: garbage collection of dead writers is mandatory. Without it, the vector never shrinks.

### Example:

"Warungku" is an offline-first shopping cart for small shops. One cart, three node groups: `JKT` (Jakarta), `SBY` (Surabaya), `SIN` (Singapore). A shopper works offline on a phone and syncs later. The cart key is `cart-7`. The vector order is `[JKT, SBY, SIN]`.

```text
RUN TRACE — one partition, three writes, one merge
════════════════════════════════════════════════════════════════════════

  t1  shopper on JKT adds "kopi 1 kg"
      V(JKT) = [1,0,0]                          cart-7 = { kopi }

  t2  network between JKT and SBY is down
      shopper on SBY adds "gula 2 kg" to its own copy
      V(SBY) = [0,1,0] on the SBY copy

  t3  sync: SBY sends its version

      ┌──────────────────────────────────────────────────────────────┐
      │ classify the two versions                                    │
      │                                                              │
      │   V(JKT) = [1,0,0]        V(SBY) = [0,1,0]                   │
      │   1 > 0 at JKT, but 0 < 1 at SBY                             │
      │   neither dominates  ->  CONCURRENT  ->  keep BOTH           │
      └───────────────────────────┬──────────────────────────────────┘
                                  ▼
      ┌──────────────────────────────────────────────────────────────┐
      │ merge the values (application rule: union the cart)          │
      │                                                              │
      │   { kopi }  ×  { gula }   ->  { kopi, gula }                 │
      │   V = join([1,0,0],[0,1,0]) = [1,1,0]                        │
      │   a write on JKT records the merge: V = [2,1,0]              │
      └───────────────────────────┬──────────────────────────────────┘
                                  ▼
  t4  SIN receives the merged version and adds "susu"
      V(SIN) = max([0,0,0],[2,1,0]) = [2,1,0], then +1 on SIN
      V(SIN) = [2,1,1]

      classify [2,1,1] against [2,1,0]:  2>=2, 1>=1, 1>0
      -> SIN DOMINATES the merge. no conflict. one causal line of history.

  result
    causally ordered   : t1 -> t3 -> t4        (each saw the previous)
    concurrent         : t1 and t2             (both survived, cart merged)
    lost writes        : none
```

Now the same team replaces the merge rule with last-write-wins on the wall clock, because the merge code is extra work.

```text
THE FAILURE MODE — one rule change, silent data loss
════════════════════════════════════════════════════════════════════════

  rule:  compare wall-clock timestamps, keep the larger one

   JKT "kopi"  12:00:00.010   ─┐
   SBY "gula"  12:00:00.030   ─┴─►  keep "gula".  "kopi" is deleted.
                                    the shopper never sees an error.

  this is not a story about a bad clock. it is a story about a wrong rule.
  a Jepsen test of Cassandra under QUORUM with last-write-wins clock
  timestamps observed 285 of 1,009 acknowledged writes lost, about 28%.
  the number is one measured case, not a universal constant.
```

The next failure is structural, and it comes from the phone fleet.

```text
SIBLING EXPLOSION — when client IDs enter the vector
════════════════════════════════════════════════════════════════════════

  40,000 shopper devices. Each device writes with its own client ID.

  vector at the start  : [JKT, SBY, SIN]             3 counters
  after a week         : [JKT, SBY, SIN, d-1, d-2, ... d-5593]   huge
  every offline write is concurrent with every other offline write
  every read returns a growing set of siblings

  ┌──────────────────────────────────────────────────────────────────┐
  │ read cart-7  ->  [ gula , gula+teh , gula+teh+kopi , ... ]        │
  │ the store must store all of them. the client must merge all.      │
  └──────────────────────────────────────────────────────────────────┘

  the fix: dotted version vectors (DVV)
    context  = vector over STORAGE nodes only     (small, bounded)
    dot      = one (node, counter) pair for the value that was written

    a client that reads a context and writes with that context
    replaces the versions it saw. only a real race creates a sibling.
    Riak hit this problem with client-keyed vectors and moved to DVV
    in version 2.0. after the change, well-behaved clients converge to
    one value, and only genuine concurrent writes stay as siblings.
```

The production rule that survived contact with real traffic:

```text
CHOOSING THE MECHANISM — three questions, in order
════════════════════════════════════════════════════════════════════════

  Q1  must the system DETECT concurrent writes?
      ├─ no  -> do not pay O(N). use HLC or a per-key single writer.
      └─ yes
          Q2  how many writers per key?
              ├─ few (3 to 9 nodes)   -> version vector keyed on nodes
              └─ many (thousands)     -> dotted version vector,
                                         or one writer per key,
                                         or a CRDT with a built-in rule

  monitoring signals that matter after launch
  ┌──────────────────────────────┬────────────────────────────────────┐
  │ conflict rate per key        │ a rise means longer partitions,   │
  │                              │ slower sync, or a bad owner split  │
  │ vector size per key          │ an unbounded climb means client   │
  │                              │ IDs entered the vector             │
  │ sibling count on read        │ more than 1 means the merge path  │
  │                              │ is live and must be tested         │
  │ clock skew between nodes     │ relevant for HLC, which needs a   │
  │                              │ bounded skew to stay correct       │
  └──────────────────────────────┴────────────────────────────────────┘
```

The limits stay visible:

- A vector clock orders events. It does not choose values. The join of two vectors is a fact. The merge of two carts is a product decision.
- A resolved write must carry both histories. If a merge writes only the branch it read, the new version stays concurrent with the other branch, and the conflict returns on the next sync.
- Vector clocks do not make replication fast. A stale node stays stale until it receives the newer version.
- HLC is compact and friendly to wall-clock reasoning, but its causality guarantee lasts only while clock skew stays bounded. Under unbounded drift, the guarantee weakens.
- The counters must be compared as integers, not as serialized field order. The implementation detail decides whether the comparison is correct.

The punchline: a vector clock answers the one question a timestamp cannot answer. It tells you whether two events are related or independent. The price is one counter per writer, and that price is fine at three nodes and dangerous at forty thousand clients. So choose the clock for the question you must answer. Detect concurrency, and pay the vector, keyed on storage nodes. Order writes and stay compact, and take HLC, accepting the one-way guarantee. Pick by the question, and the conflict story becomes boring, which is the entire point.
