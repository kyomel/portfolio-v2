---
title: "ZeRO (Zero Redundancy Optimizer)"
termSlug: "zero-zero-redundancy-optimizer"
year: 2026
month: 11
monthName: "November"
day: 16
order: 11
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "ZeRO (Zero Redundancy Optimizer) is a memory sharding method for data-parallel training. DeepSpeed (Microsoft) shipped it in 2020. ZeRO splits the training states across the ranks. Each rank stores..."
---
### Definition:

**ZeRO** (Zero Redundancy Optimizer) is a memory sharding method for
data-parallel training. DeepSpeed (Microsoft) shipped it in 2020. ZeRO
splits the training states across the ranks. Each rank stores one slice.
The ranks trade data over the network instead of memory on the GPU.

Data parallelism copies everything. Each rank holds the same weights, the
same gradients, and the same Adam state. Adam in mixed precision stores
five tensors per parameter:

```text
│ STATE                    │ PRECISION   │   BYTES PER PARAMETER │
│ ──────────────────────── │ ─────────── │ ───────────────────── │
│ weights                  │ bf16        │                     2 │
│ gradients                │ bf16        │                     2 │
│ master weights           │ fp32        │                     4 │
│ Adam moment m            │ fp32        │                     4 │
│ Adam moment v            │ fp32        │                     4 │
│ TOTAL ON ONE RANK        │             │                    16 │
```

A 7.5B model needs 16 x 7.5B = 120 GB on every rank. One A100 holds 40 GB.
The job fails at allocation. Look at the split: weights take 15 GB at bf16.
The other 105 GB is gradients and Adam state.

**The core move.** ZeRO splits the state. It does not split the
computation. Every rank still runs the same batch with the same weights in
effect.

```text
WITHOUT — classic data parallelism (DDP)
┌───────────────────────────────────────────────────────────────────────────┐
│ rank 0     full weights + full gradients + full Adam state                │
│ rank 1     full weights + full gradients + full Adam state                │
│ rank 2     full weights + full gradients + full Adam state                │
│ rank 3..7  full weights + full gradients + full Adam state                │
└───────────────────────────────────────────────────────────────────────────┘
16 bytes per parameter on every rank. 7.5B model = 120 GB per rank.
```

```text
WITH — ZeRO-3 (the last stage)
┌───────────────────────────────────────────────────────────────────────────┐
│ rank 0     shard 0/8 of weights, gradients and Adam state                 │
│ rank 1     shard 1/8 of weights, gradients and Adam state                 │
│ rank 2     shard 2/8 of weights, gradients and Adam state                 │
│ ...        (ranks 3 to 6 hold their own slice)                            │
│ rank 7     shard 7/8 of weights, gradients and Adam state                 │
└───────────────────────────────────────────────────────────────────────────┘
2 bytes per parameter per rank at N=8. 7.5B model = 15 GB per rank. Each
rank gathers the weights of the current layer, runs it, then frees them.
```

**Three stages, one decision each.** Stage 1 splits the optimizer state.
Stage 2 also splits the gradients. Stage 3 also splits the weights. Pick
the highest stage that fits. A useful rule: start with ZeRO-2. Move to
ZeRO-3 only when the model does not fit.

```text
│ STAGE      │ WHAT STAYS REPLICATED      │   B/PARAM @ N=8 │   7.5B MODEL @ N=8 │
│ ────────── │ ────────────────────────── │ ─────────────── │ ────────────────── │
│ stage 0    │ everything (plain DDP)     │           16.00 │           120.0 GB │
│ stage 1    │ weights, gradients         │            5.50 │            41.3 GB │
│ stage 2    │ weights                    │            3.75 │            28.1 GB │
│ stage 3    │ nothing, gather on demand  │            2.00 │            15.0 GB │
│ ────────── │ ────────────────────────── │ ─────────────── │ ────────────────── │

N = number of data-parallel ranks. Each number is the state kept on one
rank for one parameter. Stage 1 = 4 + 12/N. Stage 2 = 2 + 14/N. Stage 3 =
16/N. Weights are 2 bytes at bf16. Adam state is 12 bytes at fp32.
```

**The cost.** Memory falls. Communication grows.

```text
one training step, one layer

DDP / ZeRO-1 / ZeRO-2
┌───────────────────────────────────────────────────────────────────────────┐
│ backward ──▶ all-reduce gradients ──▶ every rank holds the full gradient  │
│            ──▶ Adam step on the full state                                │
│ bytes per step: about 2 x model size                                      │
└───────────────────────────────────────────────────────────────────────────┘

ZeRO-3
┌───────────────────────────────────────────────────────────────────────────┐
│ forward   ──▶ all-gather weights ──▶ run layer ──▶ free gathered weights  │
│ backward  ──▶ all-gather weights ──▶ run layer ──▶ reduce-scatter grads   │
│                                              each rank keeps 1/N of them  │
│ bytes per step: about 3 x model size (gather + gather + reduce-scatter)   │
└───────────────────────────────────────────────────────────────────────────┘
```

ZeRO-1 and ZeRO-2 move about the same bytes as DDP. ZeRO-3 moves about
1.5x the bytes of DDP: three transfers against two. Its messages are
smaller and more frequent. Small messages cost latency, not bandwidth.
Weight prefetch hides most of this cost. Throughput stays close to DDP on
NVLink or InfiniBand. It drops on a slow link.

**ZeRO covers one axis only.** It shards the data-parallel axis. When one
shard still does not fit, you need tensor parallelism and pipeline
parallelism. Large runs combine all three: TP and PP split the model, and
ZeRO-1 or ZeRO-2 shards the data-parallel axis.

**Where it lives.**

- DeepSpeed: `zero_optimization.stage` = 0 (off), 1, 2 or 3.
- PyTorch FSDP: `FULL_SHARD` = ZeRO-3, `SHARD_GRAD_OP` = ZeRO-2,
  `NO_SHARD` = DDP, `HYBRID_SHARD` = shard inside one node, copy across
  nodes.
- Megatron-LM FSDP: `optim` = ZeRO-1, `optim_grads` = ZeRO-2,
  `optim_grads_params` = ZeRO-3.
- ZeRO-Offload and ZeRO-Infinity: move state to CPU RAM or NVMe. The model
  trains on fewer GPUs, at lower speed.

**Traps.**

- Checkpoints turn sharded. `FULL_STATE_DICT` gathers the model on rank 0.
  It can run out of memory, and it takes a long time. Use
  `SHARDED_STATE_DICT`, or run DeepSpeed `zero_to_fp32.py` after training.
- FSDP pads each layer shard to a whole element count. The real saving sits
  slightly below the formula.
- ZeRO does not repair a slow network. Stage 3 stalls on a plain TCP link.
- Gradient checkpointing stacks with ZeRO. Activations are the other large
  block of memory, and ZeRO does not touch them.

### Example:

A team wants to pretrain a 7.5B model on one node: 8 x A100 40 GB, Adam,
bf16, batch 32 x 4K tokens. They try each stage in order.

```text
ATTEMPT LEDGER — 7.5B model, 8 ranks, state per rank
┌───────────────────────────────────────────────────────────────────────────┐
│ ATTEMPT  STATE PER PARAM  STATE PER RANK  RESULT                          │
│ stage 0  16.00 B          120.0 GB        CUDA out of memory              │
│ stage 1  5.50 B           41.3 GB         CUDA out of memory              │
│ stage 2  3.75 B           28.1 GB         fits, start training            │
│ stage 3  2.00 B           15.0 GB         fits, more network traffic      │
└───────────────────────────────────────────────────────────────────────────┘
Activations add to every row. Their size depends on batch size and
sequence length. Gradient checkpointing cuts them, and it works with all
four stages.
```

Stage 2 is the answer here. It fits, and it keeps the cheap communication
pattern. Stage 3 fits too, but it pays for the extra gathers on every
layer. The team moves to stage 3 only when a longer context pushes the
activations over the limit.

The config is small:

```json
{
  "bf16": { "enabled": true },
  "gradient_accumulation_steps": 8,
  "zero_optimization": {
    "stage": 2,
    "contiguous_gradients": true,
    "overlap_comm": true
  }
}
```

At stage 3, add `"stage3_gather_16bit_model_on_save": true`. It writes one
full model file at save time.

One step with stage 3, layer i:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ forward  ──▶ all-gather weights of layer i from all ranks                 │
│          ──▶ run layer i on the local batch                               │
│          ──▶ free the gathered weights, keep my shard only                │
│                                                                           │
│ backward ──▶ all-gather weights of layer i again                          │
│          ──▶ compute gradients for layer i                                │
│          ──▶ reduce-scatter: each rank keeps 1/N of them                  │
│                                                                           │
│ update   ──▶ Adam runs on the local shard only                            │
│          ──▶ every rank holds identical weights again                     │
└───────────────────────────────────────────────────────────────────────────┘
```

The memory math is the whole story. DDP stores 16 bytes per parameter, on
every rank, forever. ZeRO-3 stores 16/N. The network carries the
difference. Read the table above before you pick a stage: the stage that
fits with the least communication is the right one.
