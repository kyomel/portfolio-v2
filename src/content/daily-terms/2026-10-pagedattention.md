---
title: "PagedAttention"
termSlug: "pagedattention"
year: 2026
month: 10
monthName: "October"
day: 7
order: 5
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "PagedAttention is an attention algorithm that keeps the KV cache in fixed-size blocks. The blocks do not sit next to each other in memory. Each sequence owns a block table. The table maps the logic..."
---
### Definition:

**PagedAttention** is an attention algorithm that keeps the KV cache in fixed-size blocks. The blocks do not sit next to each other in memory. Each sequence owns a **block table**. The table maps the logical blocks of the sequence to physical blocks in the GPU pool. The attention kernel reads keys and values through that table.

The idea comes from the operating system. Virtual memory gives a process a flat address space while the frames live anywhere in RAM. PagedAttention gives a sequence a flat token order while its blocks live anywhere in the KV cache pool. Tokens are bytes. Blocks are pages. Sequences are processes. The paper is Kwon et al., **"Efficient Memory Management for Large Language Model Serving with PagedAttention"** (SOSP 2023, arXiv 2309.06180). The system built on top of it is **vLLM**.

**Why the naive layout fails.** A decoder generates one token per step. Every step needs the keys and values of all previous tokens. So the KV cache grows one token at a time, and nobody knows the final length when the request arrives.

Classic serving systems store the cache of a request as one contiguous tensor. Deep learning frameworks want contiguous tensors, so the scheduler reserves a chunk sized for the **maximum** length (for example 2048 tokens) before the first token exists. Three kinds of waste follow:

```text
THE THREE WASTES OF CONTIGUOUS RESERVATION
════════════════════════════════════════════════════════════════════════════

  NAIVE — one contiguous chunk per request, sized at MAX length
  ─────────────────────────────────────────────────────────────────────────

   request A   max 2048, real length 300
   ┌──────────────────────────────┬─────────────────────────────────────┐
   │ 300 real tokens              │ 1748 slots RESERVED for the future  │
   └──────────────────────────────┴─────────────────────────────────────┘
   request B   max 2048, real length 900
   ┌─────────────────────────────────────────┬──────────────────────────┐
   │ 900 real tokens                         │ 1148 slots RESERVED      │
   └─────────────────────────────────────────┴──────────────────────────┘
   request C   max 512, grows to 512
   ┌─────────────────────────────────────────┐
   │ 512 real tokens                         │   external fragment      │
   └─────────────────────────────────────────┘   around the chunk

   1. RESERVED slots      unused while the request is alive, and the space
                          is blocked for other requests
   2. INTERNAL fragment   over-provision to the max length, never filled
   3. EXTERNAL fragment   the allocator (buddy allocator) leaves holes of
                          the wrong size, so a new chunk does not fit

   the paper profiled this: only 20.4% - 38.2% of the KV cache memory
   held real token states in the systems they measured
```

PagedAttention replaces the one big chunk with a pool of equal blocks and a lookup table:

```text
NAIVE CONTIGUOUS vs PAGED BLOCKS
════════════════════════════════════════════════════════════════════════════

  NAIVE — the request owns one chunk, max-length sized, fixed address
  ─────────────────────────────────────────────────────────────────────────

    request A  ─────────►┌───────────────────────────────┬──────────────┐
                         │ 300 real tokens │ 1748 empty   │  one tensor  │
                         └───────────────────────────────┴──────────────┘
    request B  ─────────►┌────────────────────┬──────────────────────────┐
                         │ 900 real          │ 1148 empty               │
                         └────────────────────┴──────────────────────────┘

    contiguity is required by the old kernel, so length must be promised
    up front. the promise is the waste.

  PAGED — one shared pool of 16-token blocks, any order in memory
  ─────────────────────────────────────────────────────────────────────────

    KV cache pool    ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬─────┐
    (physical blocks)│ b0 │ b1 │ b2 │ b3 │ b4 │ b5 │ b6 │ b7 │ b8 │ ... │
                     └────┴────┴────┴────┴────┴────┴────┴────┴────┴─────┘
                       ▲         ▲         ▲              ▲
                       │         │         │              │
    request A  block table:  [ b7 , b2 , b9 ]     3 blocks, 48 slots
    request B  block table:  [ b1 , b4 ]          2 blocks, 32 slots
    request C  block table:  [ b7 , b2 , b9 ]     same blocks as A -> SHARED

    a block is allocated only when the sequence needs it, 16 tokens at a time
    the last block of a sequence keeps free slots
    no full block is ever reserved for the future
    all blocks are the same size, so external fragmentation disappears
```

**One decode step through the table.** The kernel does not stream one tensor. It walks the block table of each sequence and gathers the keys and values of the listed blocks:

```text
A DECODE STEP — how the kernel reads a non-contiguous cache
════════════════════════════════════════════════════════════════════════════

   new token arrives, query vector q
        │
        ▼
   ┌──────────────────────────────────┐
   │ BLOCK TABLE of request A         │
   │   logical 0 ──► physical b7      │
   │   logical 1 ──► physical b2      │
   │   logical 2 ──► physical b9      │   last block, 9 of 16 slots full
   └────────────────┬─────────────────┘
                    │
                    ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │ ATTENTION KERNEL — one launch for the whole batch               │
   │   for each sequence: gather K and V from the blocks in its list │
   │   score q against every key in those blocks                     │
   │   write the new K and V into the current block                  │
   └────────────────┬─────────────────────────────────────────────────┘
                    ▼
   the layout is invisible above the kernel. the sequence still behaves
   like one continuous list of tokens.

   vLLM default block size = 16 tokens (CacheConfig.DEFAULT_BLOCK_SIZE = 16)
   the OS analogy holds: block size 16 ≈ page size, block table ≈ page table
```

**Sharing and copy-on-write.** Two sequences that hold the same prefix can point at the same physical blocks. A reference count tracks the users of a block. Read is free. Write is not. When a sequence must write into a shared block, the runtime copies the block for that sequence first, then writes. This is the copy-on-write rule from the OS, applied to the KV cache:

```text
COPY-ON-WRITE ON A SHARED PREFIX
════════════════════════════════════════════════════════════════════════════

   prompt "explain this log" + 3 samples (n = 3)
   2,400-token system prompt = 150 full blocks

   ┌────────────── shared blocks, ref_cnt = 3 ───────────────┐
   │  b7  │  b2  │  b9  │ ... 150 blocks, one copy in the pool │
   └───┬───┴───┬──┴───┬──┴────────────────────────────────────┘
       │       │      │
   ┌───┴──┐ ┌──┴───┐ ┌┴────┐
   │ s1   │ │ s2   │ │ s3  │   all three read the same blocks
   └──┬───┘ └──┬───┘ └──┬──┘
      │        │        │
      │  s1 samples a token and the shared block is not full
      │        │        │
      ▼        ▼        ▼
   ┌────────────────────────────────────────────────────────────┐
   │ the runtime COPIES the shared block for s1, then writes    │
   │ b9 -> b9' for s1, ref_cnt(b9) drops by one                 │
   │ s2 and s3 keep the old block. no data is lost.             │
   └────────────────────────────────────────────────────────────┘

   after the copy, s1 and s2 stop sharing blocks. sharing pays only
   while the generated tokens stay equal.
```

**Prefix caching on top of the blocks.** A full block holds a fixed tuple of tokens, so it can be named by a hash. vLLM hashes each block over the block tokens plus the prefix before it. The components are the parent block hash, the block token ids, and extra keys (LoRA adapter id, image hash for multimodal input, cache salt for tenant isolation). A later request with the same prefix hits those blocks and skips the prefill work. Since v0.11 the default hash is `sha256`, chosen to make collisions practically impossible.

Measured numbers from the paper:

```text
PUBLISHED RESULTS (vLLM paper, SOSP 2023)
════════════════════════════════════════════════════════════════════════════

  ┌───────────────────────────────────────────────┬───────────────────────┐
  │ MEASURE                                       │ VALUE                 │
  ├───────────────────────────────────────────────┼───────────────────────┤
  │ throughput vs. FasterTransformer and Orca     │ 2x - 4x, same latency │
  │ gain on longer sequences / larger models      │ gain grows           │
  │ KV memory holding real token states, before   │ 20.4% - 38.2%        │
  │ vLLM (i.e. 61.8% - 79.6% wasted)              │                      │
  │ memory saving, parallel sampling, Alpaca      │ 6.1% - 9.8%          │
  │ memory saving, parallel sampling, ShareGPT    │ 16.2% - 30.5%        │
  │ memory saving, beam search w=6, Alpaca        │ 37.6% - 55.2%        │
  │ memory saving, beam search, ShareGPT          │ 44.3% - 66.3%        │
  │ model accuracy                                │ unchanged            │
  └───────────────────────────────────────────────┴───────────────────────┘

  note the pattern: the win grows when sequences share more prefix.
  parallel sampling shares the prompt only. beam search shares more,
  because beams stay identical for many steps.
```

**Pros.**

- Near-zero waste. Only the last block of a sequence has empty slots.
- The batch size rises, and throughput follows the batch size, not the clock speed.
- Sharing is a first-class feature, not a trick. Same-prefix requests, parallel samples, and beams reuse one copy of the blocks.
- Blocks are uniform, so the allocator is a simple free list. No best-fit search for a hole of the right size.
- Model weights stay byte-identical, so the output does not change. PagedAttention is not an approximation.

**Cons and honest limits.**

- Waste is small, not zero. The last block of every sequence keeps up to 15 empty slots at block size 16. Short requests pay a higher share.
- Block size is a trade-off. Small blocks (8) waste less memory and add more table entries and gather steps. Large blocks (128) reduce table overhead and waste more memory.
- Paging fixes **capacity**, not **bandwidth**. Every decode step still reads the whole KV cache of every active sequence. The levers for that traffic are GQA, KV cache quantization, and speculative decoding. Paging does not touch them.
- The indirection is not free. The kernel reads a block table and gathers keys and values from many blocks instead of streaming one tensor. The paper reports a small cost in the isolated attention kernel and a net gain in the full system, because the batch size grows. Measure both, not one.
- A block hash collision returns the wrong cache silently. vLLM moved to `sha256` as the default for this reason. `xxhash` is faster and carries a documented collision risk.
- Sharing ends at the first divergent token. Copy-on-write then costs one copy per broken share. Workloads with early divergence gain little.
- vLLM v1 keeps the block table append-only. A duplicate block can therefore exist for a short time and is cleaned up when the request finishes. This is a deliberate speed trade, not a leak, but it shows in the block accounting.
- Paging raises the ceiling of one GPU. It does not remove the ceiling. Very long contexts still need tensor parallelism plus KV offload to CPU, NVMe, or another node.

### Example:

"BahasaKu" is a customer-support assistant for Indonesian online shops. Agents ask questions in Bahasa Indonesia, and the model answers with shop policy, order status, and canned replies. The service runs one 32B model in FP8 on a single H100 80 GB card. vLLM serves it with continuous batching and paged KV cache.

The team first computes the KV cache budget, because that number decides the whole capacity plan.

```
CAPACITY MATH — one H100 80 GB, 32B model in FP8
════════════════════════════════════════════════════════════════════════════

  weights, FP8                      ≈ 32 GiB
  activations + workspace           ≈  8 GiB
  ────────────────────────────────────────────
  left for the KV cache pool        ≈ 40 GiB

  KV bytes per token
    64 layers x 8 KV heads x 128 head dim x 2 (K and V) x 1 byte
      = 131,072 bytes
      = 128 KiB per token

  one 8,192-token conversation      = 8,192 x 128 KiB = 1 GiB
  one block (16 tokens)             = 16 x 128 KiB   = 2 MiB
  blocks in the pool                = 40 GiB / 2 MiB = 20,480 blocks

  this is arithmetic with round numbers, kept for teaching.
  the point is the shape: capacity is counted in blocks, not in requests.
```

**Before: contiguous reservation.** The old deployment reserved the maximum length for each admitted request. The prompt maximum was 8,192 tokens, and the average real length was about 900 tokens.

```
CONTIGUOUS RESERVATION — memory full, GPU mostly idle
════════════════════════════════════════════════════════════════════════════

  every admitted request reserves its max length up front
     8,192 tokens x 128 KiB = 1 GiB per request
  40 GiB / 1 GiB = 40 admitted requests  <- the reservation sets the cap
  when the allocator cannot find a clean 1 GiB hole, the real cap is lower

  real tokens in use   900 tokens x 128 KiB ≈ 112 MiB per chat
  40 chats x 112 MiB   ≈ 4.4 GiB of real token state
  ┌──────────────────────────────────────────────────────────────────────┐
  │ 4.4 GiB real tokens        35.6 GiB reserved-but-empty               │
  └──────────────────────────────────────────────────────────────────────┘

  util of the reservation ≈ 11%
  the promise of the max length, not the GPU, set the batch size
  extra requests waited in a queue. the queue set the latency.
```

**After: paged KV cache.** The same 40 GiB pool now holds blocks, and the scheduler admits requests by block count.

```text
PAGED KV CACHE — the same 40 GiB, used in 16-token steps
════════════════════════════════════════════════════════════════════════════

  one 900-token answer   = ceil(900 / 16) = 57 blocks = 114 MiB
  the last block holds 4 real tokens and 12 free slots

  40 GiB / 114 MiB ≈ 350 conversations of that size

  ┌──────────────────────────────────────────────────────────────────────┐
  │ pool 20,480 blocks                                                   │
  │ ████████████████████  real token slots                               │
  │ ░░░░                  last-block slack (up to 15 slots per sequence) │
  └──────────────────────────────────────────────────────────────────────┘
```

The next gain comes free, because every agent shares the same prefix. All conversations open with the same 2,400-token instruction block: shop persona, tone rules, refund policy, and the tool schema. Prefix caching names those blocks by hash, so the pool keeps one copy.

```
PREFIX SHARING — one copy of the system prompt, many users
════════════════════════════════════════════════════════════════════════════

  shared system prompt    2,400 tokens = 150 full blocks = 300 MiB

  without prefix caching
      40 concurrent chats x 300 MiB = 12 GiB of duplicate KV blocks

  with prefix caching
      ┌──────────────── pool ────────────────┐
      │ 150 shared blocks, ref_cnt = 40      │  300 MiB total
      └───┬───────┬───────┬───────┬──────────┘
          │       │       │       │
        chat 1  chat 2  chat 3  ... chat 40      each appends its own
                                                  private blocks after
                                                  the shared prefix

  prefill skipped for the shared 2,400 tokens -> time to first token falls
  pools stay warm across requests -> the admission gate opens wider

  then chat 7 asks a question the prompt does not cover, and the very
  first divergent token breaks the share.
  ┌──────────────────────────────────────────────────────────────────────┐
  │ copy-on-write: the runtime copies the last shared block for chat 7   │
  │ only. chats 1-6, 8-40 keep the shared blocks. cost = one 2 MiB copy. │
  └──────────────────────────────────────────────────────────────────────┘
```

The operational numbers that matter, before and after:

```text
BEFORE / AFTER ON THE SAME CARD
════════════════════════════════════════════════════════════════════════════

  ┌────────────────────────────┬───────────────────┬─────────────────────┐
  │ METRIC                     │ CONTIGUOUS        │ PAGED (vLLM)        │
  ├────────────────────────────┼───────────────────┼─────────────────────┤
  │ admitted conversations     │ ~40 (8k reserve)  │ ~350 short chats    │
  │ reservation util           │ ~11%              │ >96% of block slots │
  │ duplicate prompt copies    │ one per chat      │ 1 shared copy       │
  │ prefill work for the       │ repeated per chat │ skipped on a hit    │
  │ 2,400-token system prompt  │                   │                     │
  │ model accuracy             │ baseline          │ identical           │
  └────────────────────────────┴───────────────────┴─────────────────────┘
```

Three checks keep the win real, and each one came from a real failure mode:

- Watch the block accounting. `vllm:gpu_cache_usage_perc` near 1.0 means the pool is the limit, not the GPU. A pool that is full while GPU compute sits at 40% says the block size or the admission rule is wrong.
- Watch the prefix hit rate. A hit rate near zero after a persona change means the prefix is no longer identical. One edited character in the system prompt invalidates 150 blocks.
- Watch the last-block slack on short traffic. A service of 60-token replies spends 15 of every 16 slots in its final block. At that shape, block size 8 or 16 beats block size 128.

The honest limits stay on the table:

- A very long chat still does not fit. A 128k-token conversation needs 16 GiB of KV cache, and no pool trick changes that. That traffic needs KV quantization, tensor parallelism, or offload to CPU and disk.
- Sharing is not a saving on unique content. A workload with a unique prompt per request gains memory efficiency, not sharing.
- Decode bandwidth is untouched. Every step reads all active KV blocks. Turn on GQA-friendly serving, KV FP8, and speculative decoding for that.
- The prefix cache must be treated as a cache with privacy rules. A cache salt per tenant isolates caches, and without it one tenant can read another tenant's shared blocks. vLLM exposes this as an export hook for prefix cache keys.

The punchline: PagedAttention does not shrink the KV cache. It **stops reserving memory that no token has claimed**. One tensor per request forces a promise of the maximum length, and that promise, not the GPU, was setting the batch size. Replace the promise with a block table, allocate 16 tokens at a time, and the same card serves the same work with a much larger batch. Then add sharing on top, because identical prefixes are the normal case in real traffic. Keep the last-block slack and the copy-on-write cost in view, and the capacity plan becomes boring arithmetic on blocks, which is the entire point.
