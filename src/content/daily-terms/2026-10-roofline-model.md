---
title: "Roofline Model"
termSlug: "roofline-model"
year: 2026
month: 10
monthName: "October"
day: 8
order: 6
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "The roofline model puts an upper bound on the speed of one kernel on one piece of hardware. It needs only two hardware numbers. The first number is peak compute (Ppeak). This is the top rate of flo..."
---
### Definition:

The **roofline model** puts an upper bound on the speed of one kernel on one piece of hardware. It needs only two hardware numbers. The first number is **peak compute** (P_peak). This is the top rate of floating-point operations, in FLOP/s. The second number is **peak memory bandwidth** (B_mem). This is the top rate for moving bytes from HBM onto the chip, in bytes/s.

The model connects the two numbers with one metric from the algorithm. The metric is **arithmetic intensity** (also called operational intensity):

```
I  =  FLOPs performed  /  bytes moved from HBM      (unit: FLOP/byte)
```

The bound is then a single line:

```
P_attainable  =  min( P_peak ,  I x B_mem )
```

The model comes from Williams, Waterman, and Patterson (2009, *Communications of the ACM*). Read the formula out loud. When intensity is low, the second term wins. The kernel is **memory-bound**, and the memory bus sets the speed. When intensity is high, the first term wins. The kernel is **compute-bound**, and the arithmetic units set the speed.

The crossover point has a name. It is the **ridge point**:

```
I_ridge  =  P_peak / B_mem
```

```text
MEMORY-BOUND vs COMPUTE-BOUND — one picture, two regimes
═══════════════════════════════════════════════════════════════════════════

  speed (FLOP/s, log scale)
   ▲
   │                              ■────────────────────────────  P_peak
   │                            ╱     flat roof                 (compute
   │                          ╱       COMPUTE-BOUND              ceiling)
   │                        ╱         add compute -> faster
   │                      ╱
   │                    ╱
   │                  ╱   slope = B_mem
   │                ╱     (memory ceiling)
   │              ╱
   │            ╱
   │          ╱   MEMORY-BOUND
   │        ╱     add compute -> NO gain
   │      ╱       (bytes/s is the wall)
   │    ╱
   │  ╱
   └─●─────────────────────────────────────────────────────────────►
     │                    arithmetic intensity (FLOP/byte)
     ridge
   I_ridge = P_peak / B_mem

  left  of ridge : roof  =  I x B_mem   (memory-bound)
  right of ridge : roof  =  P_peak     (compute-bound)

  ┌──────────────────────────────────────────────────────────────────┐
  │  one picture answers one question:                                │
  │  "is my kernel waiting on the ALUs, or waiting on HBM?"           │
  └──────────────────────────────────────────────────────────────────┘
```

**Why the ridge keeps moving right.** Chip compute grows faster than memory bandwidth. The industry calls this gap the **memory wall**. Each new generation adds more FLOP/s than bytes/s. So the ridge point rises, and more kernels fall into the memory-bound region.

```text
RIDGE POINTS — list specs, round numbers, dense (no sparsity)
═══════════════════════════════════════════════════════════════════════════

 ┌──────────────┬───────────────┬──────────────┬────────────────────────┐
 │ ACCELERATOR  │ PEAK (BF16)   │ B_mem        │ RIDGE = P/B            │
 ├──────────────┼───────────────┼──────────────┼────────────────────────┤
 │ A100 80 GB   │ ~312 TFLOP/s  │ ~2.0 TB/s    │ ~155 FLOP/byte         │
 │ H100 SXM5    │ ~989 TFLOP/s  │ ~3.35 TB/s   │ ~295 FLOP/byte         │
 │ TPU v5e MXU  │ ~197 TFLOP/s  │ ~0.82 TB/s   │ ~240 FLOP/byte         │
 │ B200         │ ~2.25 PFLOPS  │ ~8.0 TB/s    │ ~280 FLOP/byte (BF16)  │
 │ B200 (FP8)   │ ~4.5 PFLOPS   │ ~8.0 TB/s    │ ~560 FLOP/byte (FP8)   │
 └──────────────┴───────────────┴──────────────┴────────────────────────┘

  NOTE 1  real H100/B200 kernels reach only ~80-85% of the claimed peak.
  NOTE 2  a lower-precision peak RAISES the ridge. FP8 doubles P_peak,
          while B_mem stays fixed. So FP8 pushes MORE kernels left of
          the ridge, into the memory-bound region.
```

The metric that reports how close a kernel runs to the roof is **MFU** (Model FLOPs Utilization). It divides achieved FLOP/s by P_peak. A low MFU is not always a bug. On the left of the ridge, a low MFU is the expected result of a memory-bound kernel.

**The two workloads that sit on opposite sides.** A transformer forward pass has two phases, and the roofline separates them cleanly.

```text
PREFILL vs DECODE — same model, opposite regimes
═══════════════════════════════════════════════════════════════════════════

  PREFILL  (process the prompt)          DECODE  (generate 1 token)
  ────────────────────────────           ──────────────────────────

  many tokens at once                     one token at a time
  matmul x matmul  (GEMM)                 vector x matrix  (GEMV)
  weights reused across the tokens        weights loaded once per step
  I > 1000 FLOP/byte                      I ~ 1-2 FLOP/byte
  RIGHT of the ridge                      LEFT of the ridge
  Tensor Cores busy, MFU 50-75%           Tensor Cores idle, MFU < 5%

  ┌──────────────────────────────────────────────────────────────────┐
  │ PRO (the model)                    CON (the model)                │
  │ • one line explains the result     • static: ignores cache reuse, │
  │ • predicts the whole speedup       │   fusion, and L2 hits          │
  │   before any profiling             • needs the right P_peak and    │
  │ • names the wall in one number     │   B_mem, or the line is wrong  │
  │   (compute or memory)              • predicts a BOUND, not a       │
  │ • guides the fix: raise I or       │   target. Real kernels stay   │
  │   add bandwidth                     │   under the roof              │
  └──────────────────────────────────────────────────────────────────┘
```

Honest limits of the model:

- **It is an upper bound, not a forecast.** A kernel can only stay under the roof. Many reasons keep it below the roof (launch overhead, occupancy, uncoalesced access).
- **The roof uses peak numbers.** Real kernels reach roughly 80-85% of peak FLOP/s on NVIDIA parts. Use achieved rates when you compare, or the bound looks unreachable.
- **The model ignores the memory hierarchy.** It counts HBM traffic only. L2 cache reuse, shared memory, and fusion change the real byte count. A kernel can beat the naive roofline estimate for this reason.
- **A single ridge point is a simplification.** Some hardware has separate roofs per unit (MXU versus VPU, Tensor Core versus CUDA core). The true bound is a set of roofs, not one line.
- **Bandwidth is not only HBM.** Inter-chip links have their own roofline. A multi-GPU kernel can be memory-bound inside one chip and network-bound across chips at the same time.
- **Arithmetic intensity is a count, not an order.** It says how much work sits per byte. It does not say whether the work is useful.

### Example:

"SuaraKita" is a customer-support assistant for an Indonesian marketplace. It answers chat questions about orders, refunds, and shipping. The service runs one **70B model in FP8** on one **H100 SXM5**. vLLM serves the model with continuous batching.

The team reads the spec sheet first. The H100 has P_peak near 989 TFLOP/s in BF16 and B_mem near 3.35 TB/s. The ridge point sits near 295 FLOP/byte. In FP8 the compute peak doubles, so the FP8 ridge sits near 590 FLOP/byte.

Then the team computes the arithmetic intensity of decode. At batch size 1, the model reads all weights once per token. FP8 uses 1 byte per parameter.

```text
DECODE, BATCH = 1 — far left of the ridge
═══════════════════════════════════════════════════════════════════════════

  weights                 = 70e9 params x 1 byte     =  70 GB
  FLOPs per token         = 2 x 70e9                 = 140 GFLOP
  bytes per token         = 70 GB  (every weight, every step)

  intensity I             = 140e9 / 70e9             =   2 FLOP/byte
  ridge (FP8, H100)       = 590 FLOP/byte

  ┌──────────────────────────────────────────────────────────────────┐
  │  2 FLOP/byte   vs   590 FLOP/byte   ->  295x left of the ridge    │
  │  compute used   = 2 / 590   ~=  0.34% of peak, under 1%           │
  └──────────────────────────────────────────────────────────────────┘

  time per token  >=  70 GB / 3.35 TB/s  =  20.9 ms
  reported speed  <=  ~48 tokens/s per stream  (memory-bound ceiling)

  every improvement to the ALUs changes nothing here.
  the memory bus is the wall.
```

The profile confirms the prediction. GPU compute utilization sits near 5%. The memory bus runs near 100%. Adding a faster GPU clock gains nothing. So the team attacks the intensity, not the clock.

```text
THE FIX — raise I, or cut the bytes
═══════════════════════════════════════════════════════════════════════════

  LEVER 1  BATCH the requests  (raise the numerator)
  ────────────────────────────────────────────────────
   32 chat requests share ONE weight read per step

        batch 1            batch 32
     ┌──────────┐       ┌──────────────┐
     │ 1 token  │       │ 32 tokens    │
     │ 70 GB    │       │ 70 GB        │  same weight read
     │ 140 GF   │       │ 4,480 GF     │  32x the FLOPs
     └──────────┘       └──────────────┘
      I = 2              I = 64 FLOP/byte     (32x, still < ridge)
      ~48 tok/s          ~1,500 tok/s total

  LEVER 2  QUANTIZE the weights  (cut the denominator)
  ────────────────────────────────────────────────────
     FP8 -> FP4  halves the bytes per weight
     70 GB -> 35 GB  =  ~2x speed on a memory-bound kernel

  LEVER 3  RAISE B_mem  (move the ridge left is impossible;
                         move the workload right instead)
  ────────────────────────────────────────────────────
     H100 3.35 TB/s  ->  B200 8.0 TB/s
     same I, ~2.4x the memory bandwidth
```

The team pushes intensity up with batching and cuts bytes with FP8. The two phases now sit on opposite sides of the ridge, and the two fixes match their regimes.

```text
PHASE -> ROOF -> FIX, on the same H100 (FP8)
═══════════════════════════════════════════════════════════════════════════

  ┌────────────┬────────────────┬──────────────────┬──────────────────┐
  │ PHASE      │ INTENSITY      │ REGIME           │ FIX THAT WORKS   │
  ├────────────┼────────────────┼──────────────────┼──────────────────┤
  │ prefill    │ > 1,000 F/B    │ compute-bound    │ keep MFU high;   │
  │            │                │                  │ add Tensor Core  │
  │            │                │                  │ work, not B_mem  │
  ├────────────┼────────────────┼──────────────────┼──────────────────┤
  │ decode     │ ~2 F/B (b=1)   │ memory-bound     │ batch, quantize, │
  │            │ ~64 F/B (b=32) │ still memory-    │ chunk the KV; do │
  │            │                │ bound            │ NOT add compute  │
  └────────────┴────────────────┴──────────────────┴──────────────────┘

  rule of thumb: a kernel left of the ridge ignores faster math.
  a kernel right of the ridge ignores faster memory.
  read the intensity BEFORE you buy the fix.
```

Three checks keep the analysis honest:

- **Measure achieved bytes, not predicted bytes.** A profiler (`ncu`, `nsys`) reports real HBM traffic. Fusion and L2 hits can cut the byte count far below the formula.
- **Use the right peak for the right precision.** The ridge doubles from BF16 to FP8. A comparison that mixes precisions is wrong.
- **Watch MFU per phase.** A high prefill MFU with a low decode MFU is normal, not a regression. The two phases live on different sides of the ridge.

The honest limits stay on the table:

- The roofline bounds one kernel on one chip. A full request walks several kernels, a scheduler, and a network. The end-to-end time is a sum, not one roof.
- Batch size raises intensity, but it also raises latency. Large batches fill the roof and hurt the tail. The ridge point is not a target.
- Quantization cuts bytes and adds dequantization work. The gain stays positive only while the kernel stays memory-bound.
- A network-bound cluster has its own ridge (link bandwidth against compute). Fix the memory roof, and the link roof becomes the new wall.

The punchline: the roofline model turns "why is this slow" into one number, the arithmetic intensity. Compute the intensity, place it against the ridge of the hardware, and the wall becomes visible. Left of the ridge, you add memory bandwidth and batching. Right of the ridge, you add compute and keep the units fed. The model gives a bound, not a promise. So measure the achieved bytes and the achieved FLOP/s, put them on the same chart, and the fix chooses itself.
