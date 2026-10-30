---
title: "Diffusion Language Models (dLLMs)"
termSlug: "diffusion-language-models-dllms"
year: 2026
month: 10
monthName: "October"
day: 29
order: 21
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "A diffusion language model fills a block of text by refinement. It does not add one token at a time. It starts with every output position masked. Then it runs a fixed number of denoising steps. Eac..."
---
### Definition:

**A diffusion language model** fills a block of text by refinement. It does not add
one token at a time. It starts with every output position masked. Then it runs a
fixed number of denoising steps. Each step is one forward pass over the whole block.
That pass scores every masked position at once. The loop commits the positions it
trusts most, and it repeats until no mask is left.

```text
generate(prompt, block = 512, steps = T)
  x <- [MASK] x 512
  for step in 1..T
    logits <- model(prompt ++ x)      # all positions, one pass
    conf   <- max softmax(logits)     # one score per masked position
    k      <- schedule(step)          # how many to commit now
    commit x[top_k(conf, k)]
    optional: x[lowest_conf] <- [MASK]   # remask a bad guess
  return x
```

Three properties follow from that loop. The model reads context on both sides. The
model chooses the order of commitment. The model spends T passes over B positions to
write B tokens. A causal model spends B passes over one position to write B tokens.

```text
SAME 8 TOKENS, TWO ORDERS OF PRODUCTION
══════════════════════════════════════════════════════════════════

  AUTOREGRESSIVE — one token per pass, 8 passes
  ────────────────────────────────────────────────────────────────
  pass   1     2     3     4     5     6     7     8
         █     ██    ███   ████  █████ ██████ ███████ ████████
         ▲
         └ each pass adds one token and re-reads all 16 GB

         order is fixed: left to right, no exception
         every pass is memory-bound: read 16 GB, do 16 GFLOP

  DIFFUSION — all 8 scored per pass, 3 passes
  ────────────────────────────────────────────────────────────────
  pass   1                2                3
  out    ████████░░░░░░░░ ██████████░░░░░░ ████████████████
         all masked       "the (?) parse"  "the lazy parser"
         █ = committed    ░ = still masked

         order is chosen: confident positions first
         pass 1 saw the whole block, so it commits the easy ones

  WHAT THE SECOND ROW BUYS
  ────────────────────────────────────────────────────────────────
  AR    :  8 position-forwards, 8 weight reads  = 128 GB traffic
  dLLM  : 24 position-forwards, 3 weight reads  =  48 GB traffic
          more math, less traffic, shorter wall clock
```

**The same weights, a different bottleneck.** An autoregressive decode step at batch
1 reads every weight and does one token of math. For an 8B model in fp16 that is 16 GB
of traffic for 16 GFLOP. On an H100 at 3.35 TB/s the read takes 4.8 ms at peak, and
nearer 6 ms at the bandwidth a real server reaches. The tensor cores sit at under 1%
of peak. The GPU is a very fast calculator waiting on a memory bus.

A denoising pass does the opposite. It applies the weights to 512 positions at once.
The arithmetic is dense and the memory read is reused 512 times. So a dLLM turns an
inference problem that was bandwidth-bound into one that is compute-bound. That single
change explains almost every number below.

```text
COMPUTE PER OUTPUT TOKEN — one 8B fp16 model, one H100
══════════════════════════════════════════════════════════════════

  AR, batch 1        1 token in  ->  1 token out
                     +16 GFLOP per token, 16 GB read per token
                     tensor cores: 0.3% busy
                     ────────────────────────────────►  1.0x math

  dLLM, T=20         512 positions x 20 steps  ->  512 tokens out
                     +320 GFLOP per token, weights reused in L2
                     tensor cores: ~35% busy
                     ────────────────────────────────►  20x math

  the dLLM pays 20x more math to finish 6x sooner at batch 1.
  that is a good trade only while the tensor cores are idle.
```

**The bill arrives with concurrency.** At batch 1 the autoregressive server wastes
99% of its compute. Add streams and that idle compute gets filled for free, because
every new stream reuses the weight read that is already in flight. The dLLM has no
such headroom. It already spends the compute it has, so extra streams add latency,
not efficiency.

```text
ONE H100, 8B fp16, 512-token outputs, $2.54/GPU-hour
──────────────────────────────────────────────────────────────────
  CONFIG          AGG tok/s  GPU-h/1M tok  $/1M tok
  ──────────────────────────────────────────────────────────
  AR   batch 1          168          1.65  $4.20
  AR   batch 8        1,340          0.21  $0.53
  AR   batch 32       5,360          0.05  $0.13

  dLLM batch 1        1,080          0.26  $0.65
  dLLM batch 32       1,300          0.21  $0.54  (ceiling)

  crossover: one live stream   -> dLLM is 6.4x cheaper
             thirty-two streams -> AR is 4x cheaper
```

The dLLM curve is flat. The AR curve is a cliff. So the choice is not "which model is
faster". It is "how many streams do I serve at once, and how much does the user wait".

**The commitment problem.** Parallel commitment is not free. Two positions that commit
in the same pass cannot see each other, because both were masked when the pass ran.
If they are dependent, they can contradict each other. The error shrinks as the number
of steps grows, but it does not reach zero. A toy corpus with two valid strings
("red red" and "blue blue") gives the exact rate: a fraction 1/(2K) of samples is
invalid after K passes. At K=1 that is 50%. At K=8 it is 6.25%. At K=32 it is 1.56%.
A sequential sampler over the same model gets zero, and it pays one pass per token.

So the knob T is a quality dial, not a free speed dial.

```text
THREE PASSES OVER ONE BLOCK — confidence sets the order
══════════════════════════════════════════════════════════════════

  pass 1   the ████████ parser ████ the ████ block
                 0.99          0.41     0.88        <- confidence
                   │             │        │
                   ▼             │        ▼
                commit           │      commit
                                 │
                                 │  "parser" depends on a word that is not
                                 │  written yet, so the loop holds it back

  pass 2   the recursive parser ░░░░ the reads block
                    ▲
                    └ now 0.97, because "recursive" landed beside it

  pass 3   the recursive parser reads the input block
                                      ▲
                                      └ the last hole closes on purpose

  a causal model cannot do this. it must write "parser" before it
  knows the word that modifies it, then live with the guess.
```

```text
T AS A QUALITY DIAL — 512-token block, 8B model, one H100
──────────────────────────────────────────────────────────────
  T         tok/s  math/token   what breaks
  ──────────────────────────────────────────────────────────────
  5         4,300          4x   contradictions inside a block
  10        2,160          8x   weak on arithmetic, long chains
  20        1,080         16x   the usual default
  50          430         40x   quality gains flatten out
  100         216         80x   slower than AR, no gain
```

Between T=20 and T=50 most published curves go flat. Below T=10 the model commits
tokens it has not earned, and the errors look like grammar, not like noise.

**Block diffusion is the compromise.** A full-block model recomputes the entire block
at every pass, so it cannot reuse a prefix across passes. A block-diffusion model
splits the output into chunks of 16 to 64 tokens. It denoises one chunk at a time and
keeps a normal KV cache for the chunks already finished. That restores prefix caching,
restores token streaming, and keeps most of the parallelism inside a chunk.

```text
THREE GRANULARITIES
══════════════════════════════════════════════════════════════════

  FULL-BLOCK          [ 512 positions ][ 512 positions ]
                      no prefix cache, no streaming, most parallel

  BLOCK-DIFFUSION     [32][32][32][32][32][32][32][32] ...
                      KV cache across chunks, stream per chunk
                      the current default for serving

  AUTOREGRESSIVE      [1][1][1][1][1][1][1][1][1][1][1] ...
                      KV cache everywhere, stream per token
                      least parallel, best batch economics
```

**What it changes for builders.** Three things, and only the third is new.

1. **Infill becomes a native operation.** A masked denoiser can fill a hole in the
   middle of a file without rewriting the tail. Causal models fake this with a
   fill-in-the-middle training format, and they still pay for the tail.
2. **Streaming gets coarse.** Output arrives in chunks, or in a block that is revised
   after it appears. A chat UI that appends one token at a time does not map onto it.
3. **Serving stacks are young.** vLLM and SGLang support is partial. Many 2026
   deployments run a native Python loop behind FastAPI, which means no paged KV cache,
   no continuous batching, and no prefix cache for free.

The named systems: **LLaDA** (2025, 8B, the open reference), **Mercury Coder** and
**Mercury 2** (Inception, Feb 2025 and Feb 2026), **Gemini Diffusion** (Google, 2025),
**Seed Diffusion** (ByteDance, 2025), **Dream** (2025, causal init then diffusion),
plus **Fast-dLLM** and **LLaDA 2** on the serving side. Inception reports Mercury 3
(Oct 2026) at 1,000+ tokens per second and 4x to 8x faster than autoregressive peers
of its tier. Those are vendor numbers on vendor hardware. Measure your own before you
plan a migration.

### Example:

A team runs a coding agent. Each turn sends about 900 tokens of instruction and repo
context, and gets back a rewritten function body of about 512 tokens. The agent takes
4 turns per task. Users judge the product on one thing: how long the edit takes to
appear. The SLO is 2 s per turn, p95.

They serve an 8B autoregressive model on one H100. One stream gets 168 tok/s, so 512
tokens take 3.1 s. The SLO is missed before any queue exists.

```text
TRACE OF ONE TURN — autoregressive, batch 1, 512 output tokens
══════════════════════════════════════════════════════════════════

  t=0.00   prefill 900 tokens ......... 180 ms   compute-heavy
  t=0.18   token 1 .................... 6 ms     one weight read
  t=0.19   token 2 .................... 6 ms     one weight read
  ...
  t=3.24   token 512 .................. 6 ms     one weight read

  511 more identical steps. each one reads all 16 GB. tensor cores idle.
  total 3.2 s      SLO 2.0 s      -> violated, at batch 1, with no users
```

They try the usual levers. Speculative decoding with a 0.5B draft model accepts 78%
of its guesses and lands at 1.6 s, which meets the SLO. Then a second customer arrives
and the batch doubles, and the p95 crosses 2 s again. The draft model helps one stream
and costs compute that the second stream now needs.

So they test the dLLM path. Same weights class, 8B, block 512, T=20.

```text
TRACE OF ONE TURN — dLLM, block 512, T=20
══════════════════════════════════════════════════════════════════

  t=0.00   prefill 900 tokens ......... 180 ms
  t=0.18   pass 1   512 scored, 88 committed .. 24 ms
  t=0.20   pass 2   512 scored, 44 committed .. 24 ms
  ...      tail passes commit 1 to 4 each
  t=0.65   pass 20  last masks close .......... 24 ms

  20 passes, each one dense math over 512 positions.
  total 0.65 s      SLO 2.0 s      -> met with 3x headroom
```

Four turns of generation drop from 12.2 s to 1.9 s. The user sees the whole function
replace itself, not a growing line. Product accepts that, because an edit lands as one
unit anyway. This is the case where dLLM wins on the metric the user feels.

Then the team runs the night batch: 200 repository scans, 512 tokens each, no user
waiting. Here the flat dLLM curve hurts. At batch 32 the autoregressive pool reaches
5,360 tok/s and the dLLM pool plateaus near 1,300 tok/s. The batch job finishes
cheaper on the model the team was about to retire.

```text
  ┌──────────────────────┬──────────────┬──────────────┬────────────┐
  │ WORKLOAD             │ AR BATCH 1   │ AR BATCH 32  │ dLLM       │
  ├──────────────────────┼──────────────┼──────────────┼────────────┤
  │ latency, one turn    │ 3.2 s        │ queued       │ 0.65 s     │
  │ agg throughput       │ 168 tok/s    │ 5,360 tok/s  │ 1,300 t/s  │
  │ $ per 1M tokens      │ $4.20        │ $0.13        │ $0.54      │
  │ stream granularity   │ per token    │ per token    │ per block  │
  │ infill a function    │ rewrite tail │ rewrite tail │ native     │
  │ serves 200 users     │ no           │ yes          │ no         │
  └──────────────────────┴──────────────┴──────────────┴────────────┘
```

So they split by shape, not by preference. Interactive edits go to the dLLM at low
batch. The night batch stays on the autoregressive model at high batch. Two stacks,
one router, and a rule anyone can check: if nobody is waiting, batch economics win.

**The honest part.** The numbers above come from the FLOP and bandwidth arithmetic for
one 8B model on one H100. They are a model of the hardware, not a benchmark of a
shipped endpoint. A real dLLM endpoint pays extra: the block loop, the sampler, host
copies, and a serving stack that batches worse than vLLM does. Expect the batch-1 rate
to land below 1,080 tok/s in practice. Expect the shape to hold: a flat dLLM curve and
a steep AR curve. Re-run the two tables on your own hardware before you choose.

Three more limits, in plain terms:

1. **Tight constraints still favour the causal model.** Emit a 40-field JSON schema,
   or copy an identifier exactly, and the dLLM spends passes repairing what it
   committed too early. Constrained decoding exists for both, but it is more mature
   on the causal side.
2. **Long chains of reasoning are less natural.** The model can revise, which helps.
   It also has no fixed left-to-right scratchpad, which makes step-by-step arithmetic
   and tool-call sequencing harder to keep stable across T.
3. **The math per token never gets cheaper.** The dLLM does 20x the FLOPs. It wins on
   wall clock only where those FLOPs were idle anyway. On a GPU that is already busy,
   it is a slower way to do the same work.

**When to skip it.** High-concurrency APIs. Long outputs where users read as text
arrives. Workloads that depend on exact copying. Teams without a serving stack that
supports the block loop. And any migration planned on a vendor tok/s number, without a
trace of your own traffic.

The punchline: autoregressive decoding spends bandwidth to save math, and diffusion
spends math to save time. Neither is faster in general. One is faster when the GPU is
idle and a human is waiting. The other is faster when the GPU is the scarce resource.
Measure the batch size of your traffic before you measure the tokens per second of the
model. That number, not the benchmark, decides which of the two you should run.
