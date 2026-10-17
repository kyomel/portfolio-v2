---
title: "Continuous Batching"
termSlug: "continuous-batching"
year: 2026
month: 9
monthName: "September"
day: 11
order: 9
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Continuous batching — also called iteration-level scheduling, in-flight batching (TensorRT-LLM) or persistent batching (LMDeploy) — is the LLM-serving scheduler design in which the batch sitting on..."
---
### Definition:

**Continuous batching** — also called **iteration-level scheduling**, **in-flight batching** (TensorRT-LLM) or **persistent batching** (LMDeploy) — is the LLM-serving scheduler design in which the batch sitting on the GPU is **re-composed on every single decode iteration**. The instant a sequence emits its stop token, its slot and its KV-cache memory are freed; the instant a slot is free, a waiting request is admitted into it and folded into the running batch for the next forward pass. There is no such thing as a "batch lifetime" — the batch's shape changes every token.

It exists because of a structural defect in the naive approach. In classic **static batching** (which is what a hand-rolled `model.generate()` loop does), you collect N prompts, run them together, and return results only when *all N* are done. The batch therefore runs for as many decode steps as its **longest** member needs. Every shorter request finishes early and then occupies a dead slot — padded tensor row, KV cache still reserved — contributing nothing but holding resources. Since real output lengths vary by 50x or more (a 20-token classification vs. a 2,000-token reasoning trace), most slots are idle most of the time. The dashboard says "GPU busy"; the throughput says otherwise.

The intuition to hold onto is that LLM decoding has two phases with opposite physics, and only one of them parallelizes well on its own:

```
PREFILL  (the prompt)      : all prompt tokens processed at once
                             → big matrix multiplies, COMPUTE-bound,
                               high arithmetic intensity, GPU loves it

DECODE   (one token at a time) : 1 new token per sequence per step, but the
                             model must re-read the entire KV cache to do it
                             → tiny compute, HUGE memory traffic,
                               MEMORY-BANDWIDTH-bound, GEMM with batch=1
                               is an almost empty GPU

CONSEQUENCE: decoding 1 sequence alone wastes ~95% of an H100.
             You need MANY sequences in flight to saturate the hardware.
             Static batching cannot keep many in flight, because finished
             work cannot leave and new work cannot enter.
```

The fix is to change the **unit of scheduling** from a request to a **decode iteration**. This was formalized by the **Orca** paper (OSDI 2022), which named it iteration-level scheduling; **vLLM** (2023) made it runnable at scale by pairing it with **PagedAttention** — a paged KV cache where each sequence holds a list of fixed-size blocks instead of one contiguous reservation. That pairing is not optional, it is co-designed: dynamic admission/eviction means sequence memory is constantly being allocated and returned, and with naive contiguous allocation you get fragmentation plus up-to-60% memory waste, which in turn caps how many sequences you can keep in the batch. Continuous batching is the *scheduling* innovation; PagedAttention is the *memory* innovation that makes it possible.

```
STATIC BATCHING — the batch is FROZEN until the slowest member finishes
═══════════════════════════════════════════════════════════════════════════
slot │                     decode iterations →
     │  t0      30       300        900             1500
─────┼────────────────────────────────────────────────────────────────
 R1  │ ██████████████████████████████████████████████  done (1500 tok)
 R2  │ ██████ done ░░░░░░░ idle ░░░░░░░░░ idle ░░░░░░░ idle
 R3  │ ██████ done ░░░░░░░ idle ░░░░░░░░░ idle ░░░░░░░ idle
 R4  │ ██████ done ░░░░░░░ idle ░░░░░░░░░ idle ░░░░░░░ idle
 R5  │ ██████ done ░░░░░░░ idle ░░░░░░░░░ idle ░░░░░░░ idle
 R6  │ ██████ done ░░░░░░░ idle ░░░░░░░░░ idle ░░░░░░░ idle
─────┴────────────────────────────────────────────────────────────────
 response time: t1500 for EVERYONE  ·  slot-time wasted: ~86%
 new request arriving at t=31 → puts on a queue and waits for t1500
 KV cache for all 6 slots stays RESERVED the whole time

CONTINUOUS BATCHING — the batch is re-composed at every iteration
═══════════════════════════════════════════════════════════════════════════
slot │  it0     it30      it31          it300      it301       it1500
─────┼────────────────────────────────────────────────────────────────
 R1  │ ███████████████████████████████████████████████████████ done
 R7  │            ▲ADMIT  ███████████████ done
 R8  │                              ▲ADMIT ████████████████████ done
 R9  │                                          ▲ADMIT ██████████ done
─────┴────────────────────────────────────────────────────────────────
 short requests return at it30 (not it1500)
 every freed slot is refilled on the NEXT iteration
 throughput ≈ 5x–23x static batching at comparable p50 latency
```

The mechanism, spelled out, is a three-step loop the engine runs forever:

```
EVERY DECODE ITERATION — the scheduler executes this, endlessly
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. STEP    one forward pass for every sequence currently running    │
│             (one new token each — this is the GPU's real work)       │
│                                                                      │
│  2. EVICT   any sequence that just emitted its stop token or hit     │
│             max_tokens → its slot AND its KV blocks are released     │
│             in THIS iteration, not at the end of a batch             │
│                                                                      │
│  3. ADMIT   pull waiting requests from the queue into the freed      │
│             slots (run their prefill, or a chunk of it), so the      │
│             next iteration starts with a fuller batch                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
        ▲                                                    │
        └──────────── preempt if the KV pool runs dry ────────┘
             (swap the whole sequence out, or drop and RECOMPUTE
              its KV later — Oracle/preemption policy, not luck)

TOKEN BUDGET: the scheduler does not admit everything it could. Each
iteration is capped by a token budget (max_num_batched_tokens), which is
the real dial between "many short requests" and "a few long ones".
```

**Chunked prefill** is the companion scheduling decision. A prefill is *not* free: if a 30,000-token prompt is processed in one giant pass, every already-decoding sequence on the GPU stalls for the duration — one user's long document spikes the inter-token latency of everyone else, which shows up as a p99 disaster while p50 looks great. Chunked prefill (SARATHI, 2023; the paper calls the resulting mixed batch **decode-maximal batching**) slices the prompt into token-budget-sized chunks and interleaves them with ongoing decode steps, so prefill chunks supply the parallel work needed to saturate compute while decode tokens ride along for free.

```
WITHOUT chunked prefill          WITH chunked prefill
─────────────────────────        ─────────────────────────
 it 100: 30k-token prefill        it 100: 4k prefill + 127 decodes
 it 101: (blocked)                it 101: 4k prefill + 127 decodes
 ...                              it 102: 4k prefill + 127 decodes
 every decode client sees a       decodes keep streaming between
 200–800ms ITL spike              chunks · ITL stays smooth
 TTFT: best possible              TTFT: slightly worse (more steps)
 p50 great, p99 wrecked           p50 / p99 both acceptable
```

The trade-off, stated honestly, is a knob war rather than a free lunch:

| Dial | Turn it up | Turn it down |
|---|---|---|
| `max_num_seqs` | higher throughput, fuller GPU; more KV pressure, slower per-token latency, more preemption | snappier individual responses, cheaper memory, GPU underused |
| `max_num_batched_tokens` | bigger batches (better throughput, better TTFT for long prompts) | finer-grained scheduling, lower ITL jitter |
| `enable_chunked_prefill` | smooth p99 ITL under mixed prompt lengths | best possible TTFT; risks head-of-line blocking on long prompts |
| Admission policy | throughput-first (fill every slot) | fairness-first (per-tenant caps, priority queues) — otherwise a burst of long generations starves short interactive requests |

The pattern's limits are worth naming so it does not become cargo cult. It optimizes **throughput and p50**, not tail latency: any real fleet still needs admission control, per-tenant quotas and load shedding in front of it, because continuous batching will happily let an unbounded queue turn into an unbounded TTFT. It also converts GPU memory into the binding constraint — once the paged KV pool is exhausted, the engine preempts (swap out or recompute), and recompute shows up as mysterious latency cliffs under load. And it is a *serving-engine* property: if you are calling a hosted API, you never configure it, but every per-token price you pay is computed by somebody else's scheduler running this loop. That is why the same model on the same GPU can differ 5x in cost per million tokens between a naive vendor and a good engine.

Finally, one clarification that saves a lot of confusion: continuous batching is **not** classic **batch processing**. Batch processing is a *data-engineering* mode — take a static dataset, process it in a long offline job, forget latency. Continuous batching is a *live traffic scheduler* — requests arrive unpredictably, each has its own latency budget, and the "batch" is a momentary, ever-changing grouping of in-flight work. Same word, opposite intent.

### Example:

TokoKita runs a customer-support RAG bot ("KirimChat") on **one H100** with vLLM, serving ~40 req/s at peak. The prompt is a RAG context (~3,000 tokens) plus history, and answer lengths are wildly mixed: 60% are 20–60 token "status pesanan saya?" replies, 30% are 200–500 token explanations, and 10% are 1,500+ token policy walkthroughs. Their first version used a hand-rolled loop with static batches of 8. The Flash Sale at 20:00 WIB is where it fell over.

```
STATIC BATCH OF 8 — 20:03 WIB, measured on the same H100
════════════════════════════════════════════════════════════════════════
  R1 (policy walkthrough, 1,600 tok)  ████████████████████████████ ...
  R2 (order status,        24 tok)    ██ done ░░░░ idle ░░░░ idle ░░░
  R3 (order status,        31 tok)    ██ done ░░░░ idle ░░░░ idle ░░░
  ...R4–R8 (12–48 tokens)             ██ done ░░░░ idle ░░░░ idle ░░░
════════════════════════════════════════════════════════════════════════
  p50 latency: 11.4 s  ·  p99: 13.1 s  ·  throughput: 610 tok/s
  GPU util: 38%        ·  KV cache pinned at 61% while mostly idle
  Cost: $2.90 / 1M output tokens  ·  queue depth grew to 300 during peak
```

Two things made it structurally bad: the 7 short users waited ~11 s for a one-line answer they should have had in under a second, *and* the engine had no free slot to admit the 300 queued requests into, because every slot's KV memory was reserved until the long request drained. Buying a second GPU would have cost $2/hour and fixed nothing structural — the slots would still have been parked.

The fix was a config change, not a rewrite: keep vLLM's default continuous batching, then tune it.

```
CONTINUOUS BATCHING + CHUNKED PREFILL — 20:03 WIB, same single H100
════════════════════════════════════════════════════════════════════════
 iteration │ running batch (max_num_seqs=192)
───────────┼────────────────────────────────────────────────────────────
 it 1000   │ 192 slots: 178 decodes + a 4k chunk of P-9912's long prefill
 it 1001   │ R-4021 emits EOS ─► evicted ─► queued R-7710 ADMITTED
 it 1002   │ R-7710 prefill chunk (2k) │ 191 others keep decoding
 it 1003   │ R-3318 hits max_tokens ─► evicted ─► R-8102 admitted
 ...       │ (mix changes every iteration, exactly as designed)
════════════════════════════════════════════════════════════════════════
  p50 latency: 1.9 s   ·  p99: 4.2 s   ·  throughput: 3,480 tok/s
  GPU util: 87%        ·  KV cache 92% occupied, blocks recycled per step
  Cost: $0.51 / 1M output tokens      ·  queue drained within 90 s
```

```
vLLM flags actually used
┌────────────────────────────────────────────────────────────────────┐
│ --max-model-len 32768          keep the context they trained for   │
│ --max-num-seqs 192             how many sequences may run at once  │
│ --max-num-batched-tokens 8192  per-iteration token budget          │
│ --enable-chunked-prefill       stop long prompts stalling decodes  │
│ --gpu-memory-utilization 0.92  grow the paged KV pool → more slots │
└────────────────────────────────────────────────────────────────────┘
```

The order of operations matters and is worth copying: continuous batching is already on by default in vLLM, so the first wins came from *removing* static batching and letting the engine admit continuously; the next win was raising the KV pool so more sequences could be resident; chunked prefill came last, because it trades a little TTFT for tail stability and only matters once prompts are long and traffic is mixed. Their p99 before chunked prefill was 9.8 s even with continuous batching on — a textbook case of "continuous batching fixed the p50 and exposed the p99": a single 30k-token contract upload could stall every decoding request behind it until the prompt was chunked.

Two operational notes from the post-mortem. First, `max_num_seqs=192` was found empirically, not from a blog post: pushing it to 512 raised throughput another 8% and pushed p95 latency past the 3 s SLO, because slot count is a *memory* decision — the pool ran dry, preemption kicked in, and evicted sequences were recomputed, which looks exactly like random slowness in the logs. Second, GPU utilization stopped being a meaningful dashboard signal: it now reads 85–90% whether the service is healthy or drowning, so they scale on **batch occupancy and queue wait time** instead — the scheduler's own signal is the honest one.

The punchline: continuous batching is what turned "serve an LLM" from "rent a GPU and hope" into a scheduling problem with a dial on it. The same weights on the same hardware went from 610 to 3,480 tokens per second — a 5.7x cost cut — because the scheduler stopped treating a batch as a fixed group of requests and started treating it as a living set of in-flight sequences, evicted and admitted at the granularity of a single token.
