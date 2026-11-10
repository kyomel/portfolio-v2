---
title: "KV Cache Compression"
termSlug: "kv-cache-compression"
year: 2026
month: 11
monthName: "November"
day: 9
order: 6
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "KV cache compression makes the key-value cache of an LLM server smaller. The server keeps this cache in GPU memory while it generates text. The cache grows with every token of every session. When i..."
---
### Definition:

**KV cache compression** makes the key-value cache of an LLM server smaller.
The server keeps this cache in GPU memory while it generates text. The cache
grows with every token of every session. When it fills the GPU, the server
stops accepting sessions.

Start with the cache itself. Attention compares a new token with every earlier
token. The model stores the key (K) and the value (V) of each past token, in
each layer. Each decoding step reads them. This reuse avoids a full recompute
of the prefix.

WHY THE CACHE EXISTS — compute once, store, reuse
────────────────────────────────────────────────────────────────────────────────

  prompt tokens   t1   t2   t3  ......  t32768
                    │
                    ▼  prefill: one forward pass, compute-bound
  ┌──────────────────────────────────────────┐
  │   layer L stores K and V for every token │
  │     t1     ->  k1      v1                │
  │     t2     ->  k2      v2                │
  │     ......                               │
  │     t32768 ->  k32768  v32768            │
  └──────────────────────────────────────────┘
                    │
                    ▼  decode step 32769, memory-bound
  q32769 attends to k1 .. k32768        no prefix recomputed
  the step appends k32769 and v32769    cache grows by 1 K + 1 V per layer
                    │
                    ▼
  every new token of every session adds to the same GPU bill

The cache size follows one product. One formula gives it.

SIZE FORMULA — one product decides the bill
══════════════════════════════════════════════════════════════════════════════

  bytes = 2 x layers x kv_heads x head_dim x seq_len x batch x bytes_per_value
          ^^ K and V are both stored      fp16 = 2 bytes per value

  worked numbers: 7B chat model, fp16, multi-head attention
  ────────────────────────────────────────────────────────────────────────────
  layers 32    kv_heads 32    head_dim 128

  per token        2 x 32 x 32 x 128            = 262,144 B   = 0.262 MB
  one 32K session  0.262 MB x 32,768            = 8.6 GB
  model weights    7B params x 2 bytes          = 14 GB

  same model with grouped-query attention (8 KV heads)
  per token        2 x 32 x 8 x 128             = 65,536 B    = 0.066 MB
  one 32K session  0.066 MB x 32,768            = 2.15 GB     (4x smaller)

The same 80 GB card, two cache settings:

SAME GPU, SAME MODEL — only the stored cache differs
────────────────────────────────────────────────────────────────────────────────
┌────────────────────────────┐   ┌─────────────────────────────────────────┐
│ NO COMPRESSION (MHA, fp16) │   │ WITH COMPRESSION (GQA + SnapKV + 2-bit) │
│                            │   │                                         │
│ weights            14 GB   │   │ weights            14 GB                │
│ KV per 32K session 8.6 GB  │   │ KV per 32K session 0.03 GB              │
│ sessions at 32K    6       │   │ sessions at 32K    200+                 │
│ limit at 32K       the GPU │   │ limit at 32K       compute-bound        │
└────────────────────────────┘   └─────────────────────────────────────────┘

Compression moves one number in that formula, or removes tokens from it. Four
moves exist. They cut at different places.

FOUR MOVES — same goal, different place to cut
────────────────────────────────────────────────────────────────────────────────

MOVE       WHAT IT DOES                            WHAT IT COSTS
────       ────────────────────────────────────────────────────────────────
evict      drop low-importance tokens              long-context recall
quantize   store fewer bits per value              accuracy at the tail
low-rank   project K,V through small matrices      one extra matmul in path
architect  build a small cache: MQA, GQA, MLA      model choice at training

**Eviction trades recall for space.** H2O (NeurIPS 2023) keeps recent tokens
plus the few "heavy hitter" tokens that collect most attention mass.
StreamingLLM keeps the first tokens of the sequence, called attention sinks,
plus a recent window. SnapKV votes on prefix positions with a small
observation window at the end of the prompt. PyramidInfer gives each layer its
own budget and reports over 54% less KV memory and 2.2x throughput against
Hugging Face Accelerate. Eviction needs no retraining. The cost shows up as
lost recall on long prompts.

**Quantization stores fewer bits per value.** Keys and values behave
differently, so good schemes treat them differently. KIVI quantizes keys per
channel and values per token at 2 bits. It reports 2.6x lower combined peak
memory (weights plus cache), up to 4x larger batches, and 2.35x to 3.47x
throughput on real workloads. KVQuant calibrates the quantization grid and
separates outliers, and was evaluated up to a 10 million token context.
TurboQuant reports at least 6x memory reduction and up to 8x faster attention
on H100 GPUs at 3 bits. Low-rank methods (Palu, LoRC) project K and V through
small matrices instead.

**Architecture builds the cache small from the start.** MQA gives all query
heads one KV head. GQA shares KV heads across groups of query heads: Llama-3
70B uses 64 query heads and 8 KV heads, so its cache is 8x smaller than
multi-head attention at the same quality target. MLA (DeepSeek-V2) stores one
latent vector instead of full K and V, and reports 93.3% less KV cache than
its multi-head predecessor. These moves cost nothing at runtime. They are a
model choice, so you cannot add them to a model you already run.

Compression has a few neighbours that solve different problems. Keep them
apart.

EVICTING BREAKS SHARED PREFIXES — a trap, not a bug
══════════════════════════════════════════════════════════════════════════════

  request A   system prompt (3,000 tokens)  ─┐
  request B   system prompt (3,000 tokens)  ─┴─►  prefix cache reuses it
                                                   (prefill runs once)

  budget pressure: eviction drops tokens 1..2,500 of the shared range
        │
        ▼
  request C carries the same system prompt
        │
        ├─► cached range is incomplete  ->  prefill recomputes 3,000 tokens
        └─► latency spike on the exact traffic you wanted to make cheaper

  rule: pin the shared prefix, evict only the private tail of each session

One more neighbour: **PagedAttention** (vLLM) removes memory waste from
fragmented allocation. It does not shrink the cache. A paged cache of 8 GB is
still 8 GB. Paging and compression stack: paging wastes less of what is
allocated, compression allocates less.

The honest limits. Compression is lossy, and the loss hides in the tail of the
distribution. Average benchmark scores barely move. A fact buried at token
20,000 moves. Three rules keep you honest:

1. Test the long tail, not the average. A needle-in-a-haystack set at your
   real context length is the smallest useful test.
2. Pin shared prefixes. Eviction can drop tokens from a system prompt that
   many requests reuse. The next request then pays prefill again.
3. Stop when memory stops being the limit. Past a point, batch size follows
   compute and scheduling. More compression buys nothing there.

### Example:

A team runs a customer-support assistant on one H100 (80 GB). The model has
7B parameters, fp16 weights, 32 layers, 32 KV heads, head_dim 128. Context is
32K tokens. Sunday traffic is light. Monday morning brings twelve chats at
once.

SESSION LEDGER — 7B model, 32K per session, weights 14 GB, activations 6 GB
══════════════════════════════════════════════════════════════════════════════

  SESSION  KV CACHE   RUNNING TOTAL   FREE ON 80 GB     RESULT
  ──────────────────────────────────────────────────────────────────────────
  #1       8.6 GB     8.6 GB          51.4 GB           accepted
  #2       8.6 GB     17.2 GB         42.8 GB           accepted
  #3       8.6 GB     25.8 GB         34.2 GB           accepted
  #4       8.6 GB     34.4 GB         25.6 GB           accepted
  #5       8.6 GB     43 GB           17 GB             accepted
  #6       8.6 GB     51.6 GB         8.4 GB            accepted
  #7       8.6 GB     60.2 GB         -0.2 GB           CUDA out of memory
  ──────────────────────────────────────────────────────────────────────────
  session 7 needs 80.2 GB of GPU. The GPU has 80 GB. The weights never
  changed.

The service rejects requests for two minutes until chats close. The team
reads the numbers and picks the cheapest fixes first, in order.

FIX LADDER — each step is independent and reversible
────────────────────────────────────────────────────────────────────────────────

  STEP  CHANGE                                     KV PER SESSION  SESSIONS
  ──────────────────────────────────────────────────────────────────────────────
  0     baseline: multi-head attention, fp16       8.6 GB          6
  1     swap to a grouped-query model (8 KV heads) 2.15 GB         27
  2     enable SnapKV, budget 4K tokens past 8K    0.27 GB         200+
  3     add KIVI 2-bit on the retained tokens      0.03 GB         compute-bound
  ──────────────────────────────────────────────────────────────────────────────
  past step 3, memory stops being the limit. Batch size then follows
  compute and scheduling, not gigabytes.

Step 1 needs no runtime flag. The team moves to a grouped-query checkpoint and
re-runs the same ledger: 2.15 GB per session, 27 sessions inside the same
budget. Step 2 turns on SnapKV only for sessions that pass 8K tokens, so
short chats keep a full cache. Step 3 adds 2-bit quantization on the retained
tokens.

Then the validation that matters. The team builds a prompt set with an order
id buried at position 20,000 and asks for it.

THE TEST THAT DECIDES IT — a needle at token 20,000
────────────────────────────────────────────────────────────────────────────────

  prompt (28,000 tokens)
  [ system | docs ... A-7734 at position 20,000 ... tail ]
                                       │
  question: "what is order id A-7734?"
                                       │
                           ┌───────────┴───────────┐
                           ▼                       ▼
                   flat eviction, 4K budget          sinks + window + SnapKV
                   position 20,000 dropped           kept by attention sinks
                           │                       │
                           ▼                       ▼
                   answer: not found                 answer: A-7734

  short prompts never show this. test the long tail before you ship.

Flat eviction fails the test. The sinks-and-SnapKV combination passes it. The
team keeps the second configuration and adds the needle set to CI, so a future
budget change fails the build instead of a customer.

What this scenario does not claim. The ledger figures come from the size
formula above, not from a published benchmark of a named company. The
eviction results illustrate the failure mode. Your model, prompt mix, and
budget move the numbers. The team still runs a full re-index of eval prompts
whenever the budget changes, and they keep one baseline run without any
compression, so they can measure the loss instead of assuming it is small.

The punchline: the KV cache is the price of not recomputing the past.
Compression lowers that price. It never removes it. Every token you drop or
shrink is a fact the model can no longer read at full precision. Pay the
smallest price your long-context eval can prove is safe, and re-measure it
when the context grows.
