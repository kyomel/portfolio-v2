---
title: "Mixture of Experts (MoE)"
termSlug: "mixture-of-experts-moe"
year: 2026
month: 8
monthName: "August"
day: 27
order: 19
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "Mixture of Experts (MoE) is a neural network architecture that makes a model dramatically larger in capacity without paying the full cost of running every parameter on every input. It does this by..."
---
### Definition:

Mixture of Experts (MoE) is a neural network architecture that makes a model dramatically larger in *capacity* without paying the full cost of running every parameter on every input. It does this by replacing the single "everything model" with many small specialized sub-networks called **experts**, plus a learned **router** that decides which experts should handle each piece of input. Only a small subset of experts is activated per input — so the model has billions of parameters in total, but only a fraction of them do work on any single token.

The key idea is **conditional computation**: instead of every neuron firing on every token (a "dense" model), MoE routes each token to just the experts best suited to it. This is the engine behind the current generation of highly efficient LLMs — DeepSeek-V3/R1, Mixtral, Qwen, and many open models use some form of MoE to deliver frontier quality at a fraction of the inference cost. It is a direct answer to the question: *"How do we make a model smarter, without making every single request slower and more expensive?"*

DENSE vs. MIXTURE OF EXPERTS:
═══════════════════════════════════════════════════════════════

  DENSE MODEL (one giant FFN, ALL params fire on every token):
  ──────────────────────────────────────────────────────────

        token ──► ┌─────────────────────────────────┐
                  │       ONE BIG NETWORK            │
                  │  (every neuron active)           │
                  │                                  │
                  │   params: 100/100 active         │
                  └─────────────────────────────────┘
                            │
                            ▼
                        output

    ✅ Simple, no routing needed
    ❌ Inference cost = 100% of params ALWAYS.
       Bigger model = smarter, but every request
       pays for ALL of it.

  MIXTURE OF EXPERTS (many small experts, router picks a FEW):
  ──────────────────────────────────────────────────────────

        token ──► ┌───[ ROUTER ]───┐   ← learned, decides
                  │ picks top-2    │     which experts fire
                  └──┬─────────┬───┘
                     ▼         ▼
              ┌─────────┐ ┌─────────┐      ┌─────────┐
              │ EXPERT A│ │ EXPERT B│      │ EXPERT C│
              │ (active)│ │ (active)│      │(dormant)│
              └────┬────┘ └────┬────┘      └────┬────┘
                   └─────┬─────┘               (not used)
                         ▼
                     combine
                         │
                         ▼
                     output

    ┌─────────────────────────────────────────────────┐
    │  Total params: e.g. 100 (capacity)             │
    │  Active per token: e.g. 2 (cost)               │
    │                                                 │
    │  ✅ Huge capacity (can learn a lot)            │
    │  ✅ Small per-token cost (only a few experts)  │
    │  ❌ Needs a router + balance to avoid experts   │
    │     being ignored or overloaded                │
    └─────────────────────────────────────────────────┘

The trick that makes MoE work: **sparsity**. "100 total, 2 active" means the model's *capacity* can grow ~50x with near-flat *compute*. That decoupling — capacity from cost — is the whole point.

### Example:

How a token flows through an MoE LLM layer — the difference between "one big block" and "many experts + a router."

```
A model generates the sentence "The cat sat on the mat."
Focus on the layer processing the token "sat".
═══════════════════════════════════════════════════════════════

  STEP 1: The token passes through shared self-attention
  ─────────────────────────────────────────────────────────────
        "sat" ──► [ SELF-ATTENTION ] ──► context-aware vector
        (sees the other tokens around it)       │
                                               ▼
                                 ┌──────────┐
                                 │  ROUTER  │
                                 └──────────┘
                                     │
                learns a soft distribution over experts
                                     │
                                     ▼

  STEP 2: Router picks the TOP-2 most relevant experts
  ─────────────────────────────────────────────────────────────
        Expert scores (simplified):
          Expert 1 (grammar)     ██████████ 0.72  ← top-1 ✔
          Expert 2 (word sense)  ██████░░░░ 0.45  ← top-2 ✔
          Expert 3 (numbers)     ██░░░░░░░░ 0.11  ✗ dormant
          Expert 4 (code)        █░░░░░░░░░ 0.08  ✗ dormant

  STEP 3: Only the 2 selected experts compute
  ─────────────────────────────────────────────────────────────
        "sat" ──► ┌─────────────────────┐
                  │ [Expert 1] grammar  │─┐
                  │ [Expert 2] word sense│─┼─► weighted sum
                  └─────────────────────┘  │   (their outputs
                                            ▼    are blended)
                                    output vector
                                        │
                                        ▼
                            [ next layer ] ──► ... → "mat"

  ┌─────────────────────────────────────────────────────────┐
  │  WHY IT MATTERS (the efficiency win):                    │
  │                                                         │
  │  Model A (Dense):  8B params,  8B active per token      │
  │  Model B (MoE):   64B total,    8B active per token     │
  │                                                         │
  │  → B is ~8x "wider" (more knowledge) yet costs about    │
  │    the SAME compute per token as A.                     │
  │  → The router concentrates each token's effort on the   │
  │    experts that matter, instead of waking everything.   │
  │                                                         │
  │  That's how models like DeepSeek-V3 (671B total,        │
  │  ~37B active) stay cheap enough to run at scale.        │
  └─────────────────────────────────────────────────────────┘
```
