---
title: "Prefill-Decode Disaggregation"
termSlug: "prefill-decode-disaggregation"
year: 2026
month: 10
monthName: "October"
day: 27
order: 19
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Prefill-decode disaggregation splits one inference service into two pools. The first pool runs prefill. It reads the prompt and builds a KV cache. The second pool runs decode. It reads that KV cach..."
---
### Definition:

**Prefill-decode disaggregation** splits one inference service into two pools. The
first pool runs prefill. It reads the prompt and builds a KV cache. The second
pool runs decode. It reads that KV cache and writes one token per step. A fast
link moves the KV cache from the first pool to the second.

The two phases have opposite shapes. Prefill is one big matrix multiply over the
whole prompt. Decode is one token per request, again and again, and it re-reads
every weight for each token. So prefill wants FLOPS. Decode wants memory
bandwidth and many live streams.

```text
TWO PHASES, TWO DIFFERENT MACHINES
══════════════════════════════════════════════════════════════════

  PREFILL                           DECODE
  ─────────────────────────────     ──────────────────────────────
  n tokens in one forward pass      1 token per request per step
  work  = n x 2 x params            work  = 1 x 2 x params
  bytes = params, read once         bytes = params, read every step
  arithmetic intensity: high        arithmetic intensity: about 1
  -> compute-bound                  -> memory-bound
  -> wants FLOPS, wide TP           -> wants HBM, many live streams
  -> batch: long, short-lived       -> batch: small, long-lived
```

For a 70B model in fp16 the gap is easy to state. The weights take 140 GB. One
prompt token costs 140 GFLOP. A 4k prompt therefore costs 560 TFLOP of compute.
A decode step costs one full read of 140 GB, and it often produces less than
0.1% of that prompt's work.

**The interference.** Put both phases on the same GPUs and the scheduler must
choose. A prefill wave occupies the SM array for tens of milliseconds. Every
decode step inside that window waits. The mean stays acceptable. The tail does
not.

```text
ONE POOL, SIX STEPS IN A ROW — 2 x TP=8, 80 live streams
══════════════════════════════════════════════════════════════════

  step 1   ┃ DDDDDD ┃ PPPPPPPPPPPPPPPPPPPPPPP ┃   25 + 95 = 120 ms
  step 2   ┃ DDDDDD ┃ PPPPPPPPPPPPPPPPPPPPPPP ┃   25 + 95 = 120 ms
  step 3   ┃ DDDDDD ┃                         ┃   25 ms
  step 4   ┃ DDDDDD ┃ PPPPPPPPPPPPPPPPPPPPPPP ┃   25 + 95 = 120 ms
  step 5   ┃ DDDDDD ┃                         ┃   25 ms
  step 6   ┃ DDDDDD ┃ PPPPPPPPPPPPPPPPPPPPPPP ┃   25 + 95 = 120 ms

  D = one output token for every live stream
  P = one 2k prompt, sliced across the group

  the reader sees tokens at 25 ms, then 120 ms, then 25 ms.
  p50 TPOT is fine. p99 TPOT is 120 ms, and the SLO says 40 ms.
```

The scheduler cannot fix this with a better queue. The prompt is a single job
that needs the whole array. While it runs, the decode stream has nowhere to go.

**The coupling.** Co-location also forces one parallelism plan on two workloads.
Prefill wants wide tensor parallelism to cut TTFT. Decode wants small, cheap
replicas to hold many sequences. It also wants a batch large enough to amortize
the weight read. One number cannot serve both. So a co-located deployment
usually over-provisions to protect the stricter phase.

Disaggregation removes the choice. Each pool gets its own TP width, its own
batch policy, its own node type, and its own autoscaling signal.

```text
WITHOUT vs WITH DISAGGREGATION
══════════════════════════════════════════════════════════════════

  WITHOUT — one pool, both phases share the SMs
  ────────────────────────────────────────────────────────────────

   2k prompts ──┐
   from users ──┴──►  ┌──────────────────────────────────┐
                      │  GPU 0..15   (2 x TP=8)          │
   live streams ────► │  step: [ decode 80 ][ PREFILL ]  │
                      │         25 ms       95 ms        │
                      └──────────────────┬───────────────┘
                                        ▼
                                        TPOT p99 120 ms   TTFT p99 1.8 s
                                        both SLOs broken on one box

  WITH — two pools, one KV hop between them
  ────────────────────────────────────────────────────────────────

   2k prompts ──► ┌──────────────────────────────┐
                  │ PREFILL POOL    8 x H100     │
                  │ TP=8, no live streams        │
                  │ 88 ms per prompt, batched    │
                  └───────────────┬──────────────┘
                                 │  KV cache 625 MiB
                                 │  13 ms at 400 GbE
                                 ▼
                  ┌──────────────────────────────┐
                  │ DECODE POOL     8 x H100     │
                  │ TP=8, 80 live streams        │
                  │ 25 ms per step, steady       │
                  └──────────────────────────────┘
                        TPOT p99 31 ms    TTFT p99 300 ms
                        each SLO has an owner
```

**What the hop costs.** The KV cache is not small. Its size is fixed by the
model shape, not by the prompt.

```text
KV CACHE PER TOKEN — one 70B model, GQA, fp16
══════════════════════════════════════════════════════════════════

   2  x  80 layers  x  8 KV heads  x  128 dim  x  2 bytes
   │     │             │              │           │
   │     │             │              │           └ fp16
   │     │             │              └ head dim
   │     │             └ 8 KV heads, not 64 query heads
   │     └ decoder layers
   └ K and V

   = 320 KiB per token        2k prompt  = 625 MiB
                              32k prompt = 10 GB
```

A 10 GB transfer per request is a network problem, not a GPU problem. So the
fabric decides whether disaggregation is cheap or pointless.

```text
  ┌────────────────────┬───────────┬────────────┬──────────────────┐
  │ FABRIC             │ 2k PROMPT │ 32k PROMPT │ VERDICT          │
  ├────────────────────┼───────────┼────────────┼──────────────────┤
  │ 100 GbE, 12.5 GB/s │ 52 ms     │ 839 ms     │ hop eats the win │
  │ 400 GbE, 50 GB/s   │ 13 ms     │ 210 ms     │ workable         │
  │ NVLink, 400 GB/s   │ 2 ms      │ 26 ms      │ nearly free      │
  └────────────────────┴───────────┴────────────┴──────────────────┘
```

On 100 GbE the hop is longer than the prefill it replaces. The decode pool then
waits on a wire, and TPOT inherits a new spike. On 400 GbE the hop fits inside
one decode step, so the transfer hides.

```text
  ┌───────────────────────────────────┬─────────────────────────────────┐
  │ BUYS                              │ COSTS                           │
  ├───────────────────────────────────┼─────────────────────────────────┤
  │ TPOT isolated from prefill spikes │ KV transfer on every request    │
  │ TP width and node type per phase  │ two pools to size and autoscale │
  │ prefill scales with arrival rate  │ prefill waits for a free slot   │
  │ decode scales with live streams   │ new failure mode at the hop     │
  └───────────────────────────────────┴─────────────────────────────────┘
```

**It is a goodput change, not a speedup.** The math per token does not get
cheaper. The same FLOPs run on the same kind of GPU. What changes is how many
requests finish inside both SLOs on the same hardware. That is the metric to
report.

**When it pays.** The choice follows the SLO shape, not the hype.

```text
  ┌────────────────────────┬─────────────────┬──────────────────────────────────┐
  │ SLO SHAPE              │ BEST CONFIG     │ WHY                              │
  ├────────────────────────┼─────────────────┼──────────────────────────────────┤
  │ tight TTFT, loose TPOT │ aggregate       │ no hop in the first-token path   │
  │ loose TTFT, tight TPOT │ disaggregate    │ decode never sees a prefill wave │
  │ both tight             │ chunked prefill │ small slices, one pool, no hop   │
  └────────────────────────┴─────────────────┴──────────────────────────────────┘
```

The names in this space: **DistServe** (OSDI 2024) made the case with separate
resource allocation per phase and reported up to 7.4x more requests, or 12.6x
tighter SLO, above 90% SLO attainment. **Splitwise** split the phases across
different machine types. **Mooncake** turned the KV cache into a cluster-wide
pool. vLLM and SGLang both ship a PD mode. In 2025 the **TaiChi** paper argued
that aggregation wins for tight TTFT with relaxed TPOT, disaggregation wins for
the reverse, and neither is optimal when both are tight.

**Second-order effects to expect.** Prefix caching removes prefill work, so the
prefill pool goes idle while the decode pool stays full. The ratio that was
correct at launch drifts. Chunked prefill inside one pool also takes most of the
tail benefit with no network at all, which is why the split is a last step and
not a first step.

### Example:

A team serves a 70B fp16 model on 16 H100s. The traffic is agent traffic: 2,000
token prompts with a shared 900-token system prompt, 250 output tokens per
answer. The SLOs are TTFT under 600 ms and TPOT under 40 ms.

Launch config is aggregate: 2 replicas of TP=8, continuous batching on, prefill
unsliced. It holds for a week, then a customer turns on a retry loop. Prompt
volume doubles and the trace changes shape.

```text
TRACE OF ONE DECODE STREAM — aggregate, 2 x TP=8
══════════════════════════════════════════════════════════════════

  token   gap        what happened on the group
  ─────   ──────     ─────────────────────────────────────────────
  1       310 ms     prefill of this prompt, sliced across 8 GPUs
  2       25 ms      plain decode step
  3       25 ms      plain decode step
  4       120 ms     three other prompts arrived, prefill took the SMs
  5       25 ms
  6       25 ms
  7       120 ms     another prefill wave
  ...
  250     118 ms     tail, batch drained but prefills still queued

  p50 TPOT  25 ms   p99 TPOT 120 ms   SLO 40 ms   -> violated
  p50 TTFT 480 ms   p99 TTFT 1.8 s    SLO 600 ms  -> violated
  goodput   2.2 req/s inside both SLOs
```

The team tries the cheap fixes first. They cap `max_num_seqs` at 40. TPOT p99
drops to 70 ms and goodput drops to 1.6 req/s. They slice prefill into 512-token
chunks. TPOT p99 reaches 48 ms, close but not inside 40 ms, and TTFT p99 rises
to 2.1 s because each prompt now waits behind more queue. Both fixes trade one
SLO for the other. That is the signature of a coupling problem.

So they split. Eight GPUs run prefill with TP=8 and no live streams. Eight GPUs
run decode with TP=8 and a batch of 80. The gateway sends each new prompt to the
prefill pool and passes the handle to decode.

```text
# shape of the deployment, not a copy-paste flag list
prefill pool : 8 x H100, TP=8, producer of KV blocks, no long-lived batch
decode pool  : 8 x H100, TP=8, consumer of KV blocks, batch 80
link         : RDMA move of KV blocks, 400 GbE, 13 ms for 625 MiB
routing      : gateway -> prefill -> decode, one hop per request
```

The decode side pre-allocates the blocks and pauses that one stream while the
blocks land. A pause of 13 ms fits inside the 40 ms budget. A pause of 52 ms
would not, which is why the 100 GbE version of this cluster was rejected in the
design review.

```text
  ┌───────────────────────────────────┬────────────┬───────────────┐
  │ METRIC                            │ CO-LOCATED │ DISAGGREGATED │
  ├───────────────────────────────────┼────────────┼───────────────┤
  │ TTFT p99                          │ 1.8 s      │ 300 ms        │
  │ TPOT p99                          │ 120 ms     │ 31 ms         │
  │ TPOT floor                        │ 25 ms      │ 25 ms         │
  │ req/s inside SLO                  │ 2.2        │ 5.4           │
  │ GPU-h per 1M tokens               │ 0.90       │ 0.37          │
  │ cost per 1M tokens at $2.50/GPU-h │ $2.24      │ $0.91         │
  └───────────────────────────────────┴────────────┴───────────────┘
```

The numbers belong to this cluster, not to yours. The shape does transfer. Note
the row that did not move: the TPOT floor stays 25 ms, because that floor is the
weight read on the decode GPUs. Disaggregation removes the spikes above the
floor. It does not lower the floor. To lower it, use a smaller model, a lower
precision, or more bandwidth. Those are different projects.

**The honest part.** This team had an easier option. The shared prefix is 900 of
2,000 tokens. With prefix caching on, 45% of the prefill work disappears and the
co-located cluster reaches about 3.4 req/s. Disaggregation still wins, but the
gap is 1.6x, not 2.5x. Run prefix caching first. Then measure the prefill share
of the timeline. If prefill is under 10% of the step time, the split buys two
pools to fix a rounding error.

**When to skip it.** Short prompts, small models, and batch jobs that tolerate
seconds of latency. Also single nodes with eight GPUs and no spare node: there
the KV hop crosses PCIe, the decode pool starves, and chunked prefill is the
correct answer.

The punchline: prefill and decode are two different machines that happen to share
an API. Co-location makes the batch job steal cycles from the chat job, and no
scheduler can hide it. Disaggregation gives each phase its own resource plan, and
charges a KV transfer for the separation. Check the fabric, check the prefill
share, then decide. The cost of the split is bandwidth. The reason to split is
the tail.
