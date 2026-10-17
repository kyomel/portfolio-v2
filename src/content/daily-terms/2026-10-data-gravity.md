---
title: "Data Gravity"
termSlug: "data-gravity"
year: 2026
month: 10
monthName: "October"
day: 6
order: 4
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Data gravity is the pull that a body of data exerts on applications, services, and other data. Dave McCrory coined the term in 2010. He copied the shape of Newton's law. Mass attracts mass, and mas..."
---
### Definition:

**Data gravity** is the pull that a body of data exerts on applications, services, and other data. Dave McCrory coined the term in 2010. He copied the shape of Newton's law. Mass attracts mass, and mass is hard to move. A large dataset pulls compute, tools, and people toward it. The dependent set then makes the data harder to move again.

The pull comes from four forces. Say each force out loud before you pick a region.

```text
THE FOUR FORCES — why a dataset holds its compute in place
═══════════════════════════════════════════════════════════════════════════

 1. TRANSFER COST              ingress is free, egress is priced high
                               AWS $0.09/GB out, GCP $0.12/GB,
                               Azure $0.087/GB  (list price)
                               wholesale transit ≈ $0.005/GB
                               → markup of 17x to 24x on the way out
                               → 1 TB out of AWS ≈ $90

 2. DISTANCE                   every read crosses a network
                               a daily scan pays the latency daily
                               a training job pays it per batch

 3. ENTANGLEMENT               pages, schemas, indexes, caches,
                               IAM rules, dashboards, cron jobs,
                               backups, feature tables

 4. LOCK-IN AS A PRODUCT       free in + cheap storage + paid out
                               the exit fee is a choice, not a cost
```

Force 3 carries more weight than people expect. Data does not grow alone. A team builds a whole ecosystem around a table. The ecosystem, not the byte count, decides the price of the next move. A 50 TB table with 40 downstream jobs resists a move more than a 500 TB archive that nobody reads.

**The naive pattern ignores the pull.** A platform team keeps compute in one region and data in another. Every job pays the distance, and every migration pays the fee.

```text
COMPUTE-CENTRIC vs DATA-CENTRIC             (same 500 TB dataset)
═══════════════════════════════════════     ══════════════════════════════════

 COMPUTE-CENTRIC  (fight gravity)            DATA-CENTRIC  (ride gravity)

   data: 500 TB            new GPU cluster     data: 500 TB    GPU cluster
   eu-central-1            us-east-1           eu-central-1    eu-central-1
        │                        │                   │              │
        └──── pull 500 TB ───────┘                   └── read via ──┘
              ~$46,000 egress                            private link
              ~5 days at 10 Gbps                         ~$0 transfer
              every new job repeats both                 2 ms, not 150 ms

   the invoice grows with the traffic            compute adapts to the data
```

The pattern is one rule: **move the compute to the data**. HDFS and MapReduce wrote this rule down in 2004. A mapper reads its input from the local disk when it can. Modern tools keep the same rule. Push the query down to the storage engine. Run the container in the same region as the bucket. Train the model next to the corpus.

```text
STRENGTH OF THE PULL  —  gravity ∝ volume × dependents × growth rate
═══════════════════════════════════════════════════════════════════════════

   SMALL AND YOUNG                    LARGE AND OLD
   ┌────────────────────────┐         ┌──────────────────────────────────┐
   │  12 GB Parquet file    │         │  400 TB lake                     │
   │  1 dashboard           │         │  + 60 jobs + 20 models           │
   │  no other reader       │         │  + IAM + CDC + backups           │
   └───────────┬────────────┘         └───────────────┬──────────────────┘
               │                                      │
      move in 2 hours                    every dependent orbits here
      cost under $2                            ╔═══════════════════╗
               │                               ║   the gravity well ║
               ▼                               ╚═══════════════════╝
        escape is easy                                 │
                                                       ▼
   PRO                                           CON
   • one copy, one source of truth                • switching cost compounds
   • locality removes latency                     • lock-in grows in silence
   • egress on a small set stays small            • blast radius grows with the lake
   • the first placement is free                  • a 50 GB choice becomes a
                                                   3-year commitment at 500 TB
```

Honest limits:

- **Gravity is a tendency, not a law.** You can move the data. The bill and the calendar tell you the price.
- **Decide the placement early.** At 12 GB the choice costs nothing. At 500 TB it is a project with a sponsor.
- **Move the query, not the table.** Federation, query pushdown, and compute over open formats in place (Parquet, Iceberg) remove part of the pull. The storage engine does the work where the bytes already sit.
- **Replicate the derived data, not the lake.** A curated table, a CDC stream, or a materialized view is far cheaper than a full copy.
- **The egress lever weakened.** Google Cloud dropped exit fees for leaving customers in January 2024. AWS and Microsoft followed in part. The EU Data Act took effect in September 2025 and requires providers to phase out switching charges. Read the wording. A waiver often applies only when the customer closes the whole account.
- **Cross-AZ and cross-region traffic is the quiet cost.** Internet egress is occasional. Replication, multi-AZ HA, and analytics pay a transfer fee on every read and every pipeline run. One 2025 analysis puts this internal traffic above internet egress in aggregate for analytics workloads.
- **Regulation can beat gravity.** A residency law forces a copy even when the physics says no. Then you run two lakes and pay for both.
- **Digital Realty publishes the Data Gravity Index (DGx).** It scores this pull across metro areas. Use it as a rough input, not a verdict.

### Example:

A fintech keeps a 400 TB analytics lake in `eu-central-1` (S3 plus Iceberg tables). The ML team wants to fine-tune a model in `us-east-1`, because GPU capacity is cheaper and easier to reserve there. The proposal looks simple. Copy the lake once, then train forever.

The transfer line kills the plan. 400 TB out of AWS at the list price of $0.09 per GB is about **$37,000**, and the copy needs days to finish. A nightly cross-AZ read makes the same point at a smaller scale. A job that reads 20 TB from another availability zone pays about **$410 per night**, or about **$12,000 per month**, at the $0.01 per GB list price in each direction.

The team does not abandon the plan. It shrinks it.

```text
THE DECISION — full copy vs curated subset
═══════════════════════════════════════════════════════════════════════════

  PLAN A  move the lake                    PLAN B  move the training set
  ──────────────────────────────           ──────────────────────────────

  eu-central-1  ─── 400 TB ───▶ us-east-1  eu-central-1
   S3 + Iceberg      $37,000                 ├── 396 TB stays. Jobs keep
                     ~days                   │   running in-region.
                     every refresh            │
                     repeats the fee          └── 4 TB curated set ──▶
                                                  $370 egress, 2 hours
  ┌────────────────────────────────────┐
  │ cost       : ~$37,000 per copy     │     ┌──────────────────────────┐
  │ time       : days, link-bound      │     │ cost   : ~$370 per copy  │
  │ refreshes  : drift between copies  │     │ time   : 2 hours         │
  │ result     : two lakes to govern   │     │ result : one lake, one    │
  └────────────────────────────────────┘     │          training copy    │
                                             └──────────────────────────┘
  PLAN C  keep the data. rent GPUs in eu-central-1. move nothing.

  the rule that survived the meeting:
    shrink the mass BEFORE the pull matters.
    move gigabytes on purpose.
    never move terabytes by reflex.
```

The curated set is the key idea. 4 TB moves in two hours for about $370. The 396 TB stays home, and every existing job keeps its locality. Training reads the copy, and the results travel back as a model file of a few gigabytes.

Two limits stay visible. First, a stale copy has a cost of its own. The training set needs a refresh policy, or the model learns last quarter's truth. Second, GPU price and GPU availability can outweigh the transfer saving. The honest comparison puts the egress quote next to the GPU quote on one page. Then the team picks the region with the lower total, and the smaller copy keeps that choice open.

The punchline: data gravity is a timer, not a wall. It grows with every byte you add and every service you attach. A placement that costs nothing at 12 GB costs a project at 400 TB. So place the data on purpose, push the compute toward it, and move only the small derived piece when a cheaper machine calls.
