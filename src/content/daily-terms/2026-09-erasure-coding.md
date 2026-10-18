---
title: "Erasure Coding"
termSlug: "erasure-coding"
year: 2026
month: 9
monthName: "September"
day: 28
order: 20
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Erasure coding stores an object as fragments, not as whole copies. The encoder cuts the object into k data fragments. Then it computes m parity fragments from the data fragments. It writes the n =..."
---
### Definition:

Erasure coding stores an object as **fragments**, not as whole copies. The encoder cuts the object into **k data fragments**. Then it computes **m parity fragments** from the data fragments. It writes the n = k + m fragments to n different drives or nodes. Any k fragments rebuild the object. The code survives the loss of any m fragments.

The common code is Reed-Solomon. Reed-Solomon works over a finite field, usually GF(2^8). The code is MDS, which means "maximum distance separable". MDS means the threshold is exact: k fragments are necessary, and k fragments are sufficient. No other reconstruction recovers from fewer fragments.

The notation "RS(k,m)" names a scheme. RS(10,4) means 10 data fragments plus 4 parity fragments. The storage overhead is the ratio n/k. RS(10,4) needs 1.4 raw bytes for every 1 byte of user data. RAID-5 is the small case with m = 1, and RAID-6 is the case with m = 2. Erasure coding is the general form.

Replication keeps whole copies. Three-way replication keeps 3 complete copies and survives 2 losses. Its overhead is 3.0x. Erasure coding pays CPU time and repair work instead. It buys much lower overhead for the same or better fault tolerance.

One rule decides whether the code works in practice: **the fragments must sit in different failure domains.** Spread them across drives first, then nodes, then racks. A code that puts 16 fragments on 16 drives in one rack survives 4 drive failures and 0 rack failures.

```text
SCHEME A - THREE-WAY REPLICATION            SCHEME B - ERASURE CODING RS(12,4)
════════════════════════════════════════    ══════════════════════════════════════════

  A. REPLICATION - keep the object whole, then copy it
  ───────────────────────────────────────────────────────────────────────────

     object (1 GiB)
          │
          ▼
     ┌───────────────────────────────┐
     │ copy 1      copy 2     copy 3 │
     │ 1 GiB       1 GiB      1 GiB  │
     └─┬──────────┬──────────┬───────┘
       │          │          │
       ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ drive 0  │ │ drive 1  │ │ drive 2  │
    └──────────┘ └──────────┘ └──────────┘

    raw bytes on disk                 3.00 GiB
    drive losses that data survives   2
    reads to rebuild one loss         1 mirror
    read path                         one drive answers

  B. ERASURE CODING - cut the object apart, then add parity
  ───────────────────────────────────────────────────────────────────────────

     object (1 GiB)
          │
          ▼
     ┌───────────────────────────────────────┐
     │ cut into 12 data fragments            │
     │ compute 4 parity fragments            │
     │ 16 fragments x 85.3 MiB               │
     └──────────────────┬────────────────────┘
                        ▼
      ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬────┬────┬───┬───┬───┬───┐
      │D0 │D1 │D2 │D3 │D4 │D5 │D6 │D7 │D8 │D9 │D10 │D11 │P0 │P1 │P2 │P3 │
      └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴────┴────┴───┴───┴───┴───┘
        d00 d01 d02 d03 d04 d05 d06 d07 d08 d09 d10  d11  d12 d13 d14 d15

    raw bytes on disk                 1.33 GiB
    drive losses that data survives   4
    reads to rebuild one loss         12 fragments
    read path                         12 of 16 fragments answer

  ┌───────────────────────────────────────┬────────────────────────────────────────┐
  │ PROS OF REPLICATION                   │ PROS OF ERASURE CODING                 │
  │  • one drive answers a read           │  • 1.33x overhead instead of 3.00x     │
  │  • no encode CPU on the write path    │  • more losses tolerated per byte      │
  │  • small objects cost the same        │  • 768 TiB usable per 1 PiB raw        │
  │    as large objects                   │  • repair uses idle background time    │
  ├───────────────────────────────────────┼────────────────────────────────────────┤
  │ CONS OF REPLICATION                   │ CONS OF ERASURE CODING                 │
  │  • 3.0x raw capacity for 1x of data   │  • rebuild reads k fragments, not 1    │
  │  • capacity cost grows with durability│  • encode and decode cost CPU          │
  │  • the third copy rarely earns its    │  • small objects pay a full stripe     │
  │    keep on cold data                  │  • a read fans out to k drives         │
  └───────────────────────────────────────┴────────────────────────────────────────┘
```

The numbers below come from one simple model. Each fragment fails alone with yearly probability p = 0.01. Data loss needs more than m failures in one stripe. Measure the trade by overhead and by durability:

```text
  SCHEME           OVERHEAD   LOSSES OK   P(STRIPE LOSS / YEAR)   NINES
  ─────────────────────────────────────────────────────────────────────────
  3x replication    3.000x       2 of 3          1.0e-06           6.0
  RS(6,3)           1.500x       3 of 9          1.2e-06           5.9
  RS(10,4)          1.400x       4 of 14         1.9e-07           6.7
  RS(12,4)          1.333x       4 of 16         4.0e-07           6.4
  RS(8,8)           2.000x       8 of 16         1.1e-14          14.0

  ┌────────────────────────────────────────────────────────────────────────┐
  │  Read the table as a shape, not as a promise. The model assumes that  │
  │  failures are independent. Real failures correlate: one rack power    │
  │  loss, one firmware bug, one drive batch, one long rebuild window.    │
  │  Correlated failure sets real durability, so spread the fragments     │
  │  across failure domains and watch the rebuild time.                   │
  └────────────────────────────────────────────────────────────────────────┘
```

Wider stripes lower overhead, and they raise the repair cost. Reed-Solomon repair reads k fragments to rebuild 1 loss. RS(12,4) therefore reads 12 times the data it restores. That ratio is the repair amplification, and it is the hidden bill of wide stripes.

Locally Repairable Codes (LRC) attack that bill. Azure published the classic layout LRC(12,2,2): 12 data fragments, 2 local parities, 2 global parities, 16 fragments in total. The data splits into 2 groups of 6. Each group carries its own parity. A single loss inside a group comes back from the other 6 fragments of that group, not from all 12.

```text
  RS(12,4) - REPAIR READS EVERY DATA FRAGMENT
  ─────────────────────────────────────────────────────────────────────────────
   ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
   │ D0 │ D1 │ D2 │ D3 │ D4 │ D5 │ D6 │ D7 │ D8 │ D9 │ D10│ D11│ P0 │ P1 │ P2 │ P3 │
   └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
     ▲                                                                        ▲
     └──────────── read 12 fragments to rebuild 1 lost fragment ─────────────┘

  LRC(12,2,2) - REPAIR READS ONE LOCAL GROUP
  ─────────────────────────────────────────────────────────────────────────────
   ┌────┬────┬────┬────┬────┬────┬───┐  ┌────┬────┬────┬────┬────┬────┬───┐  ┌────┬────┐
   │ D0 │ D1 │ D2 │ D3 │ D4 │ D5 │L0 │  │ D6 │ D7 │ D8 │ D9 │ D10│ D11│L1 │  │ P0 │ P1 │
   └────┴────┴────┴────┴────┴────┴───┘  └────┴────┴────┴────┴────┴────┴───┘  └────┴────┘
     └───── group 1: read 6 ─────┘        └───── group 2: read 6 ─────┘        global parities
```

Research since then pushes further. Regenerating codes lower the repair bandwidth below Reed-Solomon while they keep the same storage. Rack-aware and cascaded-parity LRC designs trade a little locality for fewer read operations. Treat the published gains as scheme-dependent. The (k, m) pair and the placement decide the result.

Production engines name a scheme with two numbers and a fragment size. HDFS uses the pattern `RS-K-M-cellsize`, for example `RS-6-3-1024k` and `RS-10-4-1024k`. MinIO sets a parity count per erasure set, with parity at half the drives by default, for example 8 data and 8 parity on 16 drives. Ceph writes a profile with `k`, `m`, and a CRUSH failure domain, and the default profile is k = 4, m = 2.

### Example:

A team runs an AI training data lake on 8 nodes with 16 drives each, 8 TiB per drive. Raw capacity is 1,024 TiB, or 1 PiB. Training jobs stream parquet shards and checkpoint files. Almost every object is large, immutable, and read by batch jobs.

The first design is three-way replication. Usable capacity is 341 TiB. The team runs out of space on day 40, and the third copy protects data that almost never changes.

The second design splits the lake into two pools. Small metadata and the Postgres WAL stay on replicated storage with 3 copies. Dataset shards and checkpoints move to an erasure-coded pool with RS(12,4). Usable capacity for the coded pool is 768 TiB, and the pool tolerates 4 drive failures.

```text
CEPH - ONE POOL, ONE PROFILE, FOUR FAILURE DOMAINS
═══════════════════════════════════════════════════════════════════════════════

  ceph osd erasure-code-profile set ec-12-4 \
      k=12 m=4 crush-failure-domain=host
  ceph osd pool create training-data erasure ec-12-4

  placement of one stripe - 16 fragments, 2 fragments per host
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  host1    host2    host3    host4    host5    host6    host7    host8        │
  │  D0  D1   D2  D3   D4  D5   D6  D7   D8  D9   D10 D11  P0  P1   P2  P3       │
  │                                                                              │
  │ 16 fragments in 16 different drives, 8 different hosts, 1 room               │
  │ 4 concurrent drive losses leave the stripe readable                          │
  │ 1 host loss leaves the stripe readable (2 fragments go with it)              │
  └──────────────────────────────────────────────────────────────────────────────┘
```

Then a drive fails at 02:14. The stripe holds 15 of 16 fragments, so reads still work. The read path rebuilds the missing fragment in RAM, and the caller sees more latency, not an error.

```text
DRIVE d07 FAILS - DEGRADED READ PATH AND BACKGROUND HEAL PATH
═══════════════════════════════════════════════════════════════════════════════

  t = 0     drive d07 stops answering. 15 of 16 fragments remain.

     ┌──────────────────────────────┐        ┌──────────────────────────────┐
     │ READ PATH (foreground)       │        │ HEAL PATH (background)       │
     │  job asks for a checkpoint   │        │  recovery job starts         │
     │  decoder reads D0..D6,       │        │  reads D0..D6, D8..D11,      │
     │  D8..D11, P0, P1             │        │  P0, P1 = 12 fragments       │
     │  rebuilds D7 in memory       │        │  rebuilds the lost fragment  │
     │  returns the object          │        │  writes it to a new drive    │
     └──────────────┬───────────────┘        └──────────────┬───────────────┘
                    ▼                                       ▼
     latency: up, correctness: same          network read: 12 x 85.3 MiB
     errors: 0                               = 1.00 GiB per rebuilt fragment

     ┌─────────────────────────────────────────────────────────────────────┐
     │  The repair reads 12x what it writes. Multiply that by a fleet of   │
     │  failures and the rebuild competes with training traffic. Cap the   │
     │  recovery bandwidth, or the fix becomes the new outage. This is     │
     │  the same lesson as day - 22 (Backpressure): a system must limit    │
     │  the work it admits.                                                │
     └─────────────────────────────────────────────────────────────────────┘
```

The team caps the rebuild rate with the Ceph recovery throttles and marks the pool as low priority for client I/O. The rebuild of one drive then takes hours instead of minutes. Capacity comes back later, and the training jobs keep their latency.

```
  TIER-BY-TIER CHOICE AFTER THE CHANGE
  ─────────────────────────────────────────────────────────────────────────────
  DATA CLASS                       SCHEME              REASON
  Postgres WAL, etcd, small files  3x replication      small objects and low write
                                                       latency beat any capacity
                                                       saving
  model checkpoints, cold objects  RS(12,4)            1.33x overhead, rare reads,
                                                       rebuild runs at night
  training shards, streamed        RS(10,4) or RS(6,3) faster repair, more
                                                       parallel read streams
  hot object cache                 replication or local  a coded read fans out to
                                   NVMe + 4+2          12 drives, so keep it short
```

Three checks keep an erasure-coded pool healthy in operation:

- Measure the rebuild time, not only the rebuild bandwidth. The durability estimate assumes a short window of reduced redundancy.
- Alert on stripes below the failure threshold. A pool with 3 losses in one stripe needs a human, not a scheduler.
- Test the degraded read path on purpose. Delete one fragment in a lab and read the object. Many teams first learn about a broken decoder in production.

The honest summary: erasure coding moves cost from raw capacity to CPU, network, and repair time. Pick it for large objects that change rarely. Keep replication for small objects, hot metadata, and any write path where latency is the whole product.
