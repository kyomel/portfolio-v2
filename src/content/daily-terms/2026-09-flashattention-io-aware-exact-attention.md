---
title: "FlashAttention (IO-Aware Exact Attention)"
termSlug: "flashattention-io-aware-exact-attention"
year: 2026
month: 9
monthName: "September"
day: 21
order: 15
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "FlashAttention is an attention algorithm that never materializes the N x N score matrix in GPU global memory. It computes attention in small tiles that stay on-chip, and it fuses the whole operatio..."
---
### Definition:

**FlashAttention** is an attention algorithm that never materializes the N x N score matrix in GPU global memory. It computes attention in small tiles that stay on-chip, and it fuses the whole operation into one GPU kernel. The output is exact. The saved data movement is the whole point.

Start with the memory hierarchy, because the algorithm makes sense only there:

```
THE TWO MEMORIES THAT DECIDE ATTENTION SPEED
═══════════════════════════════════════════════════════════════════════

  HBM (global memory)            SRAM (shared memory, on-chip)
  ────────────────────           ──────────────────────────────
  40–80 GB per GPU               192–228 KB per SM
  ~1.5–3 TB/s                    ~19 TB/s
  off-chip, slow, big            on-chip, fast, tiny
        ▲                              ▲
        │                              │
        └──── ~12x bandwidth gap ──────┘

  Attention moves a lot of bytes:
    - FLOPs  : O(N² · d)     (d = head dim, N = sequence length)
    - bytes  : O(N²)         (one score per query-key pair)
  -> few FLOPs per byte moved = MEMORY-BOUND
  -> the GPU cores wait on memory. More FLOPs/s does not help.
```

A naive attention kernel walks the N x N matrix through HBM several times: write the scores, read them back for softmax, write the probabilities, read them back for the final multiply. At N = 8,000 tokens with 8 heads, that matrix alone is 1.07 GB in FP16. At N = 128,000 tokens it is 32.8 GB for a single head. The compute is fine. The traffic is fatal.

FlashAttention removes the matrix instead of compressing it:

```text
NAIVE ATTENTION (materialize)  vs  FLASHATTENTION (tile + fuse)
═══════════════════════════════════════════════════════════════════════

NAIVE — the N x N matrix lives in HBM, and the kernel touches it 4x
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   Q, K ──► S = Q·Kᵀ ──► [WRITE S: N x N] ──► [READ S]             │
│                                                 │                 │
│                                                 ▼                 │
│                            P = softmax(S) ──► [WRITE P: N x N]    │
│                                                    │              │
│                                                    ▼              │
│   V ─────────────────────────────────────► O = P·V  ([READ P])    │
│                                                                   │
│   HBM traffic : Θ(N·d + N²)      Memory : Θ(N²)  per head         │
│   Kernel count: 4+ separate passes, each one re-reads the result  │
└───────────────────────────────────────────────────────────────────┘

FLASH — the matrix never exists. Tiles pass through SRAM, once
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   for each block of Q        (Q block stays in registers)         │
│     O = 0;  m = -inf;  l = 0        ← running output, max, sum    │
│     for each block of K, V   (streamed from HBM)                  │
│        S_tile = Q_block · K_blockᵀ       128x128 → ~32 KB in SRAM │
│        m_new  = max(m, rowmax(S_tile))                            │
│        l        = e^(m - m_new)·l + rowsum(e^(S_tile - m_new))    │
│        O        = e^(m - m_new)·O + e^(S_tile - m_new)·V_block    │
│        m        = m_new                                           │
│     write O once ──► HBM        (plus one scalar logsumexp per row)│
│                                                                   │
│   HBM traffic : Θ(N²·d² / M)     Memory : Θ(N·d)  per head        │
│   Kernel count: 1                                                │
└───────────────────────────────────────────────────────────────────┘

  M = SRAM size. With d = 64–128 and M ≈ 100 KB, the paper measures
  4x–20x fewer HBM accesses — close to the IO lower bound for matmul.
```

Four ideas carry the design:

- **Tiling.** Split Q, K, V into blocks that fit in SRAM. The full matrix is never needed at once, so it is never built.
- **Online softmax.** Softmax needs the row maximum and the row sum, and both are known only after the whole row. The online form keeps a running max `m` and a running sum `l`, and rescales the partial output `O` each time a new block raises the max. The rescale is exact, not an approximation. It corrects earlier blocks to the new max, so the final value equals the textbook softmax.
- **Kernel fusion.** One kernel does the matmul, the max, the exponential, the sum, and the second matmul. No intermediate tensor travels to HBM.
- **Recomputation in the backward pass.** Training needs the probability matrix `P` for gradients. Standard training stores `P` (O(N²)). FlashAttention stores only the logsumexp value `L` — one float per query row (O(N)) — and rebuilds `P` from SRAM tiles during backward. That adds FLOPs and removes a large block of HBM traffic. On a memory-bound kernel, that trade wins.

This is not an approximation. Sparse attention and linear attention change the math to cut FLOPs. FlashAttention keeps the math and cuts bytes. Models stay bit-comparable to the reference attention up to floating-point tolerance.

The generations:

- **FlashAttention-1 (Dao et al., NeurIPS 2022, A100).** Tiling plus online softmax plus fusion. Loop order: outer loop over K, V blocks.
- **FlashAttention-2 (Dao, 2023).** Inverted the loop nest, so the output block stays in registers. Added parallelism over the sequence dimension. Better work partitioning.
- **FlashAttention-3 (Shah et al., 2024, Hopper H100).** Asynchronous copies with the Tensor Memory Accelerator. Warp specialization: producer warps load and run softmax, consumer warps run tensor-core matmul. FP8 support with block scaling.
- **FlashAttention-4 (Tri Dao and collaborators, March 2026, Blackwell B200/GB200).** Targets the new bottleneck: tensor cores now outrun shared memory and the exponential unit. Adds emulated exponentials, LPT scheduling of tiles, 2-CTA MMA mode, and CuTe-DSL in Python instead of C++ templates. Reported: up to 1613 TFLOPs/s (about 71% of B200 peak) in BF16, 1.3x over cuDNN 9.13, 2.7x over Triton, and 22x–32x faster kernel compile (2.5 s vs 55 s for the forward kernel).

Adoption is the reason this term is worth knowing: the flash kernel is the default attention path in PyTorch `scaled_dot_product_attention`, and in vLLM, HuggingFace Transformers, TensorRT-LLM, and cuDNN.

### Example:

A coding agent sends one request with a 120,000-token repository context to a single 80 GB GPU. This is a prefill-heavy request: the model must run attention over all 120,000 tokens at once. Compare the two paths.

```text
ONE 120K-TOKEN PREFILL REQUEST — WHERE THE MEMORY GOES
═══════════════════════════════════════════════════════════════════════

  NAIVE ATTENTION — the score matrix must exist in HBM
  ─────────────────────────────────────────────────────────────────
    N = 120,000   FP16 (2 bytes per value)

    scores per head        = N x N x 2 B     = 28.8 GB
    with 8 KV heads        = 8 x 28.8 GB     = 230 GB
    ┌──────────────────────────────────────────────────────────┐
    │  RESULT: OOM on one 80 GB GPU before the first matmul     │
    │  ends. Chunked workarounds exist, and they re-read HBM.   │
    └──────────────────────────────────────────────────────────┘

  FLASHATTENTION — only O(N) tensors exist
  ─────────────────────────────────────────────────────────────────
    Q, K, V, O  per head   = 4 x N x d x 2 B = 123 MB  (d = 128)
    logsumexp L per head   = N x 4 B         = 0.48 MB
    with 8 KV heads        = ~0.99 GB total
    ┌──────────────────────────────────────────────────────────┐
    │  RESULT: fits. The 28.8 GB score matrix is never created. │
    │  The 128x128 tiles live and die inside SRAM.              │
    └──────────────────────────────────────────────────────────┘
```

The execution path, block by block:

```text
PREFILL PATH — 120K tokens, one Q block at a time
═══════════════════════════════════════════════════════════════════════

  prompt (120K tokens)
        │
        ▼
  ┌───────────────┐   split K, V into blocks of 128 columns
  │ embed + proj  │───────────────┐
  └───────┬───────┘               │
          │ Q block 0 (128 rows)  │
          ▼                       ▼
  ┌───────────────────────────────────────────────────────────────┐
  │  SRAM WORKING SET (per SM, ~200 KB)                           │
  │                                                               │
  │    Q_block ──► ×K_blockᵀ ──► S_tile (128x128, 32 KB)          │
  │                                  │                            │
  │                                  ▼                            │
  │    running max m ──► exp ──► running sum l ──► rescale O      │
  │                                  │                            │
  │                                  ▼                            │
  │                         O += P_tile · V_block                 │
  │                                                               │
  │    K_block, V_block arrive, are used, are dropped.            │
  │    Only m, l, O stay.                      ← O(N) state       │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ last K/V block processed
                                  ▼
                       O written to HBM once
                       L (logsumexp) kept for backward
                                  │
                                  ▼
                       decode loop starts (1 token at a time,
                       now bound by KV-cache bandwidth,
                       not by attention FLOPs)
```

Two notes that separate a correct mental model from a popular half-truth:

- **FlashAttention does not make attention cheap in FLOPs.** It runs the same O(N²·d) math. At short sequences and small batches, the tensor cores are already the limit, so the speedup is small. The gain grows with sequence length, because that is where memory traffic dominates.
- **It does not fix decode.** Token-by-token generation is bound by reading the KV cache, which grows with context. FlashAttention speeds up the prefill pass and the long-context training step. For decode, the levers are different: grouped-query attention, paged KV cache, quantization, speculative decoding.

The honest limits:

- **Kernel support is narrower than plain PyTorch attention.** Arbitrary additive attention bias and exotic masks are not supported by the flash kernel. PyTorch picks a different backend (memory-efficient or math) when the mask is unsupported, and that fallback is slower. Head dimensions are capped (256 in FlashAttention-2), so unusual model shapes fall back too.
- **Non-standard attention shapes need a custom kernel.** Sliding-window, prefix-LM, or block-sparse masks are separate implementations, not a flag.
- **Backward adds FLOPs.** Recomputation costs extra compute. The trade is only good while the kernel stays memory-bound.
- **Numerics stay close, not identical.** FP8 mode in FlashAttention-3 and the emulated exponential in FlashAttention-4 change rounding. Accuracy checks stay mandatory for long-context production models.

The transferable habit is the real lesson. Before optimizing, count the bytes, not only the operations. Then find the biggest tensor that nobody actually needs, keep the live state small, and let the fast memory do the work. FlashAttention is that habit applied to the most expensive layer in every Transformer.
