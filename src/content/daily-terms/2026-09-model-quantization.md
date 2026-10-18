---
title: "Model Quantization"
termSlug: "model-quantization"
year: 2026
month: 9
monthName: "September"
day: 29
order: 21
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Model Quantization is the practice of storing a model's numbers in fewer bits than the training format uses. A model trained in BF16 keeps 16 bits for every weight. Quantization stores the same wei..."
---
### Definition:

Model Quantization is the practice of storing a model's numbers in fewer bits than the training format uses. A model trained in BF16 keeps 16 bits for every weight. Quantization stores the same weights in 8 bits, 4 bits, or fewer, and adds a small amount of bookkeeping so the model can rebuild an approximation at run time.

It works because a neural network does not need exact numbers. It needs the *relative* size and direction of the numbers to stay right. Weights inside one layer cluster in a narrow range. So you can map that range onto a small set of buckets and lose very little meaning. Think of a millimetre ruler replaced by a centimetre ruler. You lose detail, but the wall measures the same. Quantization is the engineering of where that cliff sits.

The method became the default in 2026 because it pays three bills at once:

- **Memory** — half the bits is half the bytes. A 70B model drops from ~140 GB in BF16 to ~36 GB at 4 bits.
- **Bandwidth** — token generation is memory-bandwidth-bound, not compute-bound. Every decode step re-reads the weights and the KV cache. Fewer bytes per weight is less traffic per token, so latency falls.
- **Compute** — modern accelerators ship FP8 and FP4 matrix units with 2× to 4× the BF16 throughput.

```text
FULL PRECISION (BF16) vs QUANTIZED (INT4, per-group scale):
═══════════════════════════════════════════════════════════════

  BF16 — every value keeps its own 16-bit float

    0.4213 ─┐
   -0.1180 ─┼─► [ 16 bits ]  each     a 7B model ≈ 14 GB
    0.9077 ─┤               value      exact, no bookkeeping
   -0.6642 ─┘

  INT4 — one integer code per value, one scale per group of 128

    group scale s = max|W| in group / 7  = 0.0713

    0.4213 → round(0.4213 / s) =   6 ─┐
   -0.1180 → round(-0.1180 / s) = -2 ─┼─► [ 4 bits ]  each  a 7B model
    0.9077 → round(0.9077 / s) =  13 ─┤               value  ≈ 3.5 GB
   -0.6642 → round(-0.6642 / s) = -9 ─┘   + 1 FP16 scale per 128 codes
                                          (about 1.5% extra bytes)

  DEQUANTIZE ON THE WAY IN — real value ≈ code × scale

    stored code 6 × 0.0713 = 0.4278   (true value 0.4213, error ≈ 1.5%)

  ┌────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: you do not store the number. You store a small      │
  │  integer plus a scale, and you accept a small error per value. │
  │  The answer stays correct as long as that error sits below     │
  │  the noise the model already carries.                          │
  └────────────────────────────────────────────────────────────────┘
```

Not every part of a Transformer handles low precision the same way. The risk is not equal, and this is the first thing to understand:

```
WHICH PART DO YOU QUANTIZE? — three targets, three risk levels
═════════════════════════════════════════════════════════════

  WEIGHTS                 fixed after training, narrow range per
  (the parameter matrix)  layer, well behaved
                          → safe to push hard: INT4 and FP4 ship
                            in production today

  ACTIVATIONS             produced fresh for every token, so they
  (layer inputs/outputs)  depend on the input text. A few huge
                          outlier values stretch the scale and crush
                          every normal value into one bucket
                          → cautious: FP8, or keep BF16 and
                            quantize weights only (the W4A16 path)

  KV CACHE                grows with context and is re-read at every
  (attention memory)      decode step, so it dominates GPU memory at
                          128k+ contexts
                          → FP8 halves it, near-lossless on most
                            benchmarks. The honest 2026 default.

  A format name spells out this choice:
     W8A8  = 8-bit weights + 8-bit activations
     W4A16 = 4-bit weights + 16-bit activations  (weight-only)
     FP8 KV cache = attention memory in FP8, rest untouched
```

The bit-width ladder as it actually looks in 2026, with the size of a 7B model at each step:

```
THE BIT-WIDTH LADDER (2026) — size against risk, 7B model
═════════════════════════════════════════════════════════

  BF16      16 bits   ~14 GB    baseline accuracy, baseline speed
  FP8       8 bits    ~7 GB     near-lossless, 2× tensor-core FLOPs
  INT8      8 bits    ~7 GB     mature W8A8 path, small loss
  INT4      4 bits    ~3.5 GB   the workhorse: AWQ or GPTQ, W4A16
  NVFP4     4 bits    ~3.5 GB   Blackwell only, FP8 block micro-scales
  MXFP4     4 bits    ~3.5 GB   OCP microscaling variant of the above
  NF4       4 bits    ~3.5 GB   the QLoRA fine-tuning path
  INT2/1.58 2 bits    ~1.8 GB   needs quantisation-aware training;
                                research and edge only

  Reported in 2026: FP8 counts as effectively lossless across every
  size of the Llama-3.1 family. INT4 and below is where results start
  to separate per model and per task.
```

Inside one bit width there is a second dial: how often you store a scale. This dial decides the quality more than the bit width does.

```
SCALE GRANULARITY — the quality dial inside the dial
════════════════════════════════════════════════════

  per-tensor     1 scale for the whole matrix    ~0% overhead
                 → poor quality at 4 bits, rarely used

  per-channel    1 scale per row or column       ~0.5% overhead
                 → good at 8 bits, the common INT8 choice

  per-group 128  1 scale per 128 weights         ~1.5% overhead
                 → very good at 4 bits, the production default

  per-group 32   1 scale per 32 weights          ~6% overhead
                 → near-lossless, diminishing returns, more bytes

  Smaller groups recover quality and cost metadata bytes plus
  bandwidth. Group size 64–128 is the sweet spot for production INT4.
```

The main methods and where each one fits:

- **GPTQ** — quantizes layer by layer and uses second-order information about the weight distribution to keep the error small. The older default for INT4.
- **AWQ (Activation-aware Weight Quantization)** — first studies the activations, finds the small fraction of weight channels that matter most, and protects those channels. The modern default for W4A16. Typical group size 128.
- **SmoothQuant** — moves the activation outlier problem into the weights by scaling, which makes W8A8 activations quantizable. Used on the serving side.
- **NVFP4 / MXFP4** — block-scaled 4-bit floats. NVFP4 keeps a small FP8 scale per block of values. This is the frontier 4-bit format on Blackwell. Both came from the same problem: a single scale for a full tensor is too coarse, so scale per small block instead.
- **QAT (Quantization-Aware Training)** — the model trains with simulated quantization in the forward pass. This gives the best quality at 2–4 bits and it costs a full training run. Use it only when post-training methods have already failed.
- **GGUF (llama.cpp)** — the consumer and CPU reference. Not a method but a file format with its own k-quant schemes (Q4_K_M and friends), and the only stack that still goes down to ~2 bits usefully.

Two honest warnings before you trust a headline number.

First, a summary benchmark is not your workload. The common claim is "within 1 point of FP16 on MMLU". That claim does not predict what your users notice. Math, code, long context, and structured output break before chat does, because those tasks lean on precise intermediate values. A 4-bit model can hold a pleasant conversation and still fail a unit test it passed at FP8.

Second, "FP8 is lossless" is true per benchmark and per kernel, not in general. The vLLM team published a clear example in April 2026. Their FP8 Flash Attention 3 kernel on Hopper lost accumulation precision at long context. On a 128k needle-in-a-haystack test the score fell from 91% (BF16) to 13% (FP8). The cause was mechanical: the accumulate step of `Softmax(score) · V` adds roughly 128k numbers, and rounding error compounds across them. A two-level accumulation scheme that writes partial results into an FP32 register brought the score back to 89%. The fix costs prefill speed for head dimensions above 128.

The same report gives two more rules that are easy to miss:

- **Sliding-window layers stay in BF16.** Models such as GPT-OSS have layers where a token attends to a fixed window of about 128 tokens. FP8 overhead cannot be amortized over such a short window, so quantizing those layers is *slower* than leaving them alone. The same skip feature also protects layers that are unusually sensitive to quantization.
- **Measure the copy you will ship.** Quantization is an approximation, so the result depends on the weights, the kernel, the tensor-core generation, and the batch shape. All four change between stacks.

When not to reach for it: a model that already fits, a workload that already meets its latency target, and any task where a small accuracy loss is worse than the extra cost. Quantization is a trade, not a free win.

### Example:

"BantuKode" runs an internal coding assistant for 400 developers. It serves a 70B open model at 32k context on one B200 (192 GB HBM3e). The requirement is honest and specific: at least 20 concurrent requests, and low inter-token latency, because a developer watches the code appear token by token.

The team starts by counting bytes, not by choosing a method. The KV cache of this model costs 80 layers × 8 KV heads × 128 dim × 2 (K and V) = 320 KB per token, which is 10 GB for one 32k-token conversation in BF16 and 5 GB in FP8. That single line decides the whole ladder.

```
MEMORY BUDGET — one B200 (192 GB), 70B model, 32k context per request
═════════════════════════════════════════════════════════════════════

  STEP 0   BF16 weights (140 GB) + BF16 KV cache (10 GB per sequence)

    weights ████████████████████████ 140 GB
    KV      40 GB (4 sequences)
    total   180 GB  →  4 concurrent requests, 12 GB spare   ✗ too few
    and each decode step reads 140 GB of weights → slow tokens

  STEP 1   FP8 weights (70 GB) + BF16 KV cache

    weights ████████████ 70 GB
    KV      120 GB (12 sequences)
    total   190 GB  →  12 concurrent requests                ~ tight

  STEP 2   FP8 weights (70 GB) + FP8 KV cache (5 GB per sequence)

    weights ████████████ 70 GB
    KV      120 GB (24 sequences)
    total   190 GB  →  24 concurrent requests                ✓ target met
    plus ~2× the attention read bandwidth, so the ITL slope flattens

  STEP 3   INT4 AWQ weights (36 GB) + FP8 KV cache

    weights ██████ 36 GB
    KV      150 GB (30 sequences)
    total   186 GB  →  30 concurrent requests, and 4× less weight
                       traffic per decode step → fastest tokens
    accuracy risk is now real on code → gate it (see below)

  ┌──────────────────────────────────────────────────────────────┐
  │  ORDER MATTERS: take the cheap lossless steps first. FP8     │
  │  weights then FP8 KV cache bought the whole latency and      │
  │  capacity target with no visible quality cost. INT4 is the   │
  │  step that needs evidence before it ships.                   │
  └──────────────────────────────────────────────────────────────┘
```

The team then builds a gate. They never accept a public leaderboard as proof, and they refuse to compare models on a benchmark that has nothing to do with coding.

```
THE GATE — BantuKode's own eval set, 500 real developer prompts
═══════════════════════════════════════════════════════════════
  300 "fix my bug" prompts, graded by hidden unit tests
  200 questions about their own repositories

  format         chat pass   code pass (tests)   decode speed
  ─────────────────────────────────────────────────────────────
  BF16           92.0%           71.4%             1.00× (base)
  FP8 W8A8       91.8%           70.9%             1.60×
  AWQ INT4       91.5%           66.1%             2.20×

  READING:
   • FP8  → 0.5 point on code, 1.6× faster. Ship it.
   • INT4 → 0.3 point on chat but 5.3 points on code. The chat number
            hides the damage, exactly as warned above. The team keeps
            INT4 for their autocomplete tier (short prompts, cheap
            errors) and keeps FP8 for the agent tier that edits files.
```

One more check saves them from a silent failure, and it is the check most teams skip. Before locking in FP8 for the KV cache, they re-run the long-context suite on their own hardware and kernel, because the same flag that looks lossless at 8k context can collapse at 128k:

```
THE TRAP — one flag, two contexts, opposite results
════════════════════════════════════════════════════════════

  their earlier config: --kv-cache-dtype fp8 on Hopper, FA3 kernel

    needle-in-a-haystack @ 8k    :  BF16 96%  vs  FP8 95%   ✓ fine
    needle-in-a-haystack @ 128k  :  BF16 91%  vs  FP8 13%   ✗ broken

  cause: the accumulate step over ~128k terms ran in FP8, so the
         rounding error compounded with context length
  fix  : two-level accumulation into an FP32 register (vLLM shipped
         this in April 2026) → 89%; prefill is slightly slower for
         head dim > 128
  their rule: re-quantize, then re-test at the LONGEST context they
              support, on the exact kernel they serve with
```

Their final configuration is three decisions, each with a reason:

- **FP8 weights and FP8 KV cache, plus per-head scales** — near-lossless on their own eval set, 24 concurrent 32k requests on one GPU, and lower ITL because each decode step now reads half the bytes.
- **Sliding-window layers left in BF16** — the quantization overhead cannot be amortized on a 128-token window, so skipping those layers is both faster and more accurate. The skip list is part of the deployment config, not a code patch.
- **INT4 kept for the cheap tier only** — the highest-value use of 4 bits is a workload with short prompts and tolerant errors, where the memory saving buys more concurrency than the accuracy costs.

Their output adapter stays in BF16 as well. A LoRA adapter trained on top of a quantized base keeps full precision, and the serving stack adds the adapter delta to the dequantized weight at run time.

The punchline: quantization is the cheapest capacity upgrade in the stack, because it buys memory, bandwidth, and tensor-core throughput in one move, and it does so with a flag rather than a rewrite. It is also the easiest upgrade to get quietly wrong. The bit width is not the whole story — the scale granularity, the target you quantize (weights, activations, or KV cache), the kernel, and the context length all move the result. So the mature pattern is dull and effective: take the lossless steps first, gate every step on your own workload instead of a leaderboard, keep the layers that quantization cannot help in BF16, and re-test at the longest context you promise to support. Do that, and 4 bits becomes a fact you can state. Skip it, and you ship a model that answers beautifully and fails the test it used to pass.
