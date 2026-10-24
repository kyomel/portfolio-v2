---
title: "Cardinality Explosion"
termSlug: "cardinality-explosion"
year: 2026
month: 10
monthName: "October"
day: 23
order: 17
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Cardinality is the number of distinct label combinations in a metric. Cardinality explosion is the failure mode where that number grows much faster than traffic does. Request rate stays flat. The s..."
---
### Definition:

**Cardinality** is the number of distinct label combinations in a metric. **Cardinality explosion** is the failure mode where that number grows much faster than traffic does. Request rate stays flat. The series count does not.

The cause is one rule of the metrics data model. A time series is not a metric. A time series is a metric name plus one exact set of label values:

```text
  http_requests_total{route="/cart", status="200", region="sg"}   <- series A
  http_requests_total{route="/cart", status="500", region="sg"}   <- series B
  http_requests_total{route="/cart", status="200", region="eu"}   <- series C
```

Change one label value and you get a different series. So the series count for one metric is a **product**, not a sum:

```text
  series  =  |values(label 1)|  x  |values(label 2)|  x  ...  x  |values(label n)|
```

A product punishes the label with an open set of values. A label with 3 values and a label with 300 values cost the same to add in code. One multiplies series by 3. The other multiplies by 300.

This is the whole trap. The label looks like a field. In the index it is a dimension.

```text
BOUNDED LABELS vs UNBOUNDED LABEL            (one metric, same traffic)
═══════════════════════════════════════════════════════════════════════════

 WITHOUT — every label has a small, closed set of values
 ─────────────────────────────────────────────────────────────────────────

   http_requests_total{ route, status, region }

   ┌─────────┬─────────┬───────────────────────────────────────┐
   │ label   │ values  │ the set                               │
   ├─────────┼─────────┼───────────────────────────────────────┤
   │ route   │ 40      │ closed: the route table               │
   │ status  │ 6       │ closed: 2xx, 3xx, 4xx, 5xx            │
   │ region  │ 3       │ closed: sg, id, eu                    │
   └─────────┴─────────┴───────────────────────────────────────┘

        40 x 6 x 3  =  720 series                          <- fixed

   new traffic joins these 720 series. the index does not grow.
   the graphs stay cheap because nothing new needs an identity.

 WITH — one label has an open set of values
 ─────────────────────────────────────────────────────────────────────────

   http_requests_total{ route, status, region, cart_id }

   ┌─────────┬────────────┬────────────────────────────────────┐
   │ label   │ values     │ the set                            │
   ├─────────┼────────────┼────────────────────────────────────┤
   │ route   │ 40         │ closed: the route table            │
   │ status  │ 6          │ closed: 2xx, 3xx, 4xx, 5xx         │
   │ region  │ 3          │ closed: sg, id, eu                 │
   │ cart_id │ 300/min    │ OPEN: one value per live cart      │
   └─────────┴────────────┴────────────────────────────────────┘

        40 x 6 x 3 x 300  =  216,000 new label sets per minute
        x 14 samples per label set  =  3,024,000 new series per minute

   every new cart is a new identity.
   every new identity is a new series.
   traffic did not change. the index did.

   PRO                                  CON
   ────────────────────────────────────────────────────────────────────
   • answers one question today        • the answer becomes a permanent
                                         index entry
   • no code change, one line          • memory, disk, scrape payload and
                                         query time scale with series
                                         count, not with traffic
   • cheap on a test dataset           • tests use 200 carts, production
                                         opens 300 per minute
   • the dashboard looks correct       • fails suddenly, not gradually
```

Three things make the explosion worse than it looks on paper.

**Classic histograms multiply the result again.** A classic histogram stores one series per bucket. Twelve buckets plus `_sum` plus `_count` means 14 series for every single label set. So 720 label sets are already 10,080 series before any new label arrives. **Native histograms**, stable since Prometheus 3.0, store the whole histogram as one sample with sparse buckets. The same 720 label sets then cost 720 series. That is a 14x cut with no loss of information and no change to the question you can ask.

**Churn costs the same as cardinality.** A label does not need unbounded values to hurt. It needs values that change. A pod name with a deployment hash, a container id, a `node_ip:port` pair, or a `build_id` creates a new series on every rollout. The old series stays in the head block until it goes stale, so a weekly deploy slowly raises the floor. Cardinality measures how many identities exist at one moment. Churn measures how many new identities appear per hour. Both bill you.

**The value is usually a free-text field.** High-cardinality labels are rarely numeric. They are the fields an engineer already had in a log line: `user_id`, `email`, `session_id`, `request_id`, `cart_id`, raw URL paths with an id inside, SQL text, exception messages, and IP addresses. Prometheus documentation names this directly: every unique combination of key-value pairs is a new time series, so do not use labels for unbounded sets such as user IDs or email addresses.

```text
WHERE THE DETAIL SHOULD LIVE
═══════════════════════════════════════════════════════════════════════════
  need to group and alert on it?        -> label   (bounded, closed set)
  need to find one request later?       -> exemplar (one id on one sample)
  need the full story of that request?  -> trace + spans
  need free text or a full payload?     -> log line
  need a per-user aggregate over days?  -> columnar store, not metrics

  metrics answer "how many, how fast, how often, for which dimension".
  metrics do not answer "which one".
```

The failure is not graceful, and that is the part worth remembering. Prometheus has no default hard cap on series count. When the series set outgrows the host, memory runs out and the kernel kills the process with an OOM kill. Restart makes it worse, because the write-ahead log replay rebuilds the same series set before the first scrape lands. A single label can put a monitoring server into a restart loop.

Managed backends answer differently. They stay up, then bill per active series, or they quietly drop the excess. Silent dropping is the worst outcome, because the dashboard now shows a smaller number and nobody knows it is smaller.

So the guardrails are boring on purpose. Each one limits the product before it grows.

- **A series budget per metric.** Write it down, for example 10,000 series per metric. A number you can check beats an intention.
- **A cardinality limit inside the SDK.** The OpenTelemetry metrics spec asks SDKs to enforce a limit per instrument per collection cycle. The default it recommends is 2,000. Values past the limit are not dropped silently. They are aggregated into one series that carries the attribute `otel.metric.overflow="true"`. That series is your alarm.
- **A drop at the scraper.** `metric_relabel_configs` with `action: labeldrop` removes a label at ingest, so the cost never reaches storage. In OpenTelemetry, a view or the transform processor deletes the attribute before aggregation.
- **Aggregation at the source.** A recording rule keeps the aggregate you actually alert on and leaves the detail out. The cost of the query moves from every dashboard to one rule.
- **An alert on the slope, not the level.** A level alert fires after the failure. A slope alert fires before it.

```promql
# who owns the series count right now
topk(10, count by (__name__) ({__name__=~".+"}))

# the number that matters for capacity, and its trend
prometheus_tsdb_head_series
deriv(prometheus_tsdb_head_series[15m]) * 3600   # series added per hour
```

One distinction avoids a bad diagnosis. Cardinality **estimation** is a different problem. HyperLogLog answers "how many unique users did we see" with kilobytes of memory. Cardinality explosion is about identity in an index, not about counting distinct values. HLL is the tool for the first question. It does not help with the second one, because the index is the thing that broke.

### Example:

**A shop adds one label to answer one support ticket. Prometheus dies eight minutes later.**

"Toko" is an Indonesian online shop. The checkout service exposes `http_request_duration_seconds` as a classic histogram. The label set is small and closed: 40 routes, 6 status codes, 3 regions.

```text
BASELINE — checked before the deploy
═══════════════════════════════════════════════════════════════════════════
  label sets      40 x 6 x 3                  =      720
  samples each    12 buckets + _sum + _count   =      14
  head series     720 x 14                    =   10,080

  at roughly 1 to 3 KB per series in the head block, that is
  tens of megabytes. a normal size for one metric on one service.
```

A support agent asks a fair question: "a customer says checkout was slow at 09:02, can we see latency for that one cart?" The engineer adds `cart_id` to the histogram. The change is one line. It passes review, because the reviewer reads the code and sees a string field. Nobody reads the index.

```text
09:04  deploy 1182 ships
       http_request_duration_seconds{route, status, region, cart_id}

       cart_id values are not a closed set. the shop opens about
       300 new carts per minute during the evening peak.

       40 x 6 x 3 x 300   =     216,000 new label sets per minute
       216,000 x 14       =   3,024,000 new series per minute
       at ~1.5 KB each    =   about 4.5 GB of head memory per minute

09:05  prometheus_tsdb_head_series        10,080  ->  3,030,000

09:07  the scrape payload for /metrics grows with every cart alive
       scrape duration for checkout pods    0.4 s  ->  6.8 s
       the scrape timeout is 10 s.

09:09  head_series  15,130,000       process RSS  21 GB
       queries slow down. the checkout dashboard times out.

09:12  head_series  24,200,000       process RSS  33 GB
       kernel: Out of memory: Killed process (prometheus)

09:13  restart. WAL replay rebuilds the series set.
       new carts keep arriving. the same growth starts again.

09:19  second OOM. the monitoring server is now in a restart loop.

  ┌──────────────────────────────┬─────────────────────────────────────────────┐
  │ WHAT THE TEAM ASSUMED        │ WHAT THE LABEL DID                          │
  ├──────────────────────────────┼─────────────────────────────────────────────┤
  │ one more field on one metric │ one more dimension in the index             │
  │ cost grows with traffic      │ cost grows with carts, not requests         │
  │ the change is reversible     │ reversible only if you roll back in minutes │
  │ the label is local           │ it took the whole monitoring server down    │
  └──────────────────────────────┴─────────────────────────────────────────────┘
```

The rollback is the first fix. It is also the least useful one, because the support question is still real. The second fix removes the label without removing the answer.

```text
SAME QUESTION, TWO MECHANISMS, NO NEW SERIES
═══════════════════════════════════════════════════════════════════════════

  question: "why was checkout slow for cart c-9f21 at 09:02?"

  BEFORE — the id is a dimension
  ─────────────────────────────────────────────────────────────────────
    label  cart_id="c-9f21"
      -> 10,080 new series per cart
      -> 1,080,000 label sets in five minutes
      -> one data point per cart, no history, no comparison
      -> the query is exact and the answer is nearly useless

  AFTER — the id travels as an exemplar
  ─────────────────────────────────────────────────────────────────────
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ BUCKET SERIES   route=/checkout  status=200  region=sg  le="1.0"        │
    │   observations in the window : 1832                                     │
    │   exemplar                   : { trace_id="4f2a9c", cart_id="c-9f21" }  │
    │ 720 label sets. one series per bucket. the index is fixed.              │
    └────────────────────────────────────┬────────────────────────────────────┘
                                         │ click the exemplar
                                         ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ TRACE 4f2a9c                                                            │
    │   checkout               1,840 ms    (p95 for this route: 380 ms)       │
    │     cart.load               40 ms                                       │
    │     inventory.check        120 ms                                       │
    │     payment.authorize    1,510 ms    <-- the slow span                  │
    │        retry 1             9 s timeout, no fallback                     │
    └─────────────────────────────────────────────────────────────────────────┘

  the graph shows the shape. the exemplar points at one example.
  the trace explains that example. none of the three needs a new
  series per cart.
```

Then the bucket multiplier gets fixed too. The service keeps a closed label set, and the histogram becomes native.

```text
BUCKET SERIES vs NATIVE HISTOGRAM
═══════════════════════════════════════════════════════════════════════════
  classic histogram          720 label sets x 14 samples   =  10,080 series
  native histogram           720 label sets x  1 sample    =     720 series

  both answer histogram_quantile(0.95, ...) for the same label sets.
  the classic version pays 14 index entries to describe one distribution.
  the native version stores the distribution itself, with sparse buckets.

  savings are real, but note the scale. 14x on a 720-series metric is
  small. a factor of 2,400 from one unbounded label is an outage.
```

The last change is the guardrail. The SDK gets a limit, so the next engineer who adds a field cannot take the server down alone.

```text
THREE LIMITS, ONE METRIC
═══════════════════════════════════════════════════════════════════════════

  three limits, each one caps the product before it grows:

    SDK      cardinality limit, 2,000 series per instrument per cycle
             -> past the limit, one series carries otel.metric.overflow="true"

    scraper  metric_relabel_configs with action: labeldrop on cart_id
             -> the label never reaches storage

    alert    deriv(prometheus_tsdb_head_series[15m]) > 5,000 per hour
             -> the on-call gets paged before the OOM, not after it

  ┌─────────────────────────────┬─────────────────────────────────────────┐
  │ BEFORE                      │ AFTER                                   │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ 10,080 series, then 24M     │ 720 series, native histogram            │
  │ OOM kill in 8 minutes       │ limit fires, one overflow series        │
  │ found by users at 09:09     │ found by an alert at 09:06              │
  │ fix is a rollback           │ fix is a code change with a budget      │
  │ "why is monitoring down?"   │ "why did series/hour jump at 09:05?"    │
  └─────────────────────────────┴─────────────────────────────────────────┘
```

The honest summary: cardinality is a design property of the metric, and it is decided when the label is written, not when the query runs. A label is a promise to store one index entry per value, forever, for every combination around it. Ask the product question first, then check the product of the label values. If the answer is a number with a lot of digits, the detail belongs in an exemplar, a trace, or a log line. The metric keeps the shape, and the shape is what you alert on.
