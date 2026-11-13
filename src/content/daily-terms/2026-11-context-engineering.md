---
title: "Context Engineering"
termSlug: "context-engineering"
year: 2026
month: 11
monthName: "November"
day: 12
order: 9
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Context engineering is the work of deciding what the model reads at each step of a run. It covers the system prompt, retrieved documents, tool results, memory, and conversation history. It also cov..."
---
### Definition:

**Context engineering** is the work of deciding what the model reads at each
step of a run. It covers the system prompt, retrieved documents, tool results,
memory, and conversation history. It also covers what you remove. Prompt
engineering polishes one instruction. Context engineering manages the whole
window across many steps.

Three facts drive this discipline:

1. **The window is finite.** Long runs fill it fast. One raw tool result can
   hold 2,000 tokens. Ten of them crowd out the instruction.
2. **Attention is not uniform.** The study "Lost in the Middle" (Liu et al.,
   2023) shows a U-shape: models use facts at the start and the end of the
   window better than facts in the middle.
3. **Every token costs.** The provider bills the full window on every call. A
   stale document costs the same as a fresh one.

```text
WITHOUT CONTEXT ENGINEERING              WITH CONTEXT ENGINEERING
(one bucket that only grows)             (layers you control)

┌──────────────────────────────┐         ┌───────────────────────────────┐
│ system prompt                │         │ L1  instructions    stable    │
│ 50 past messages             │         │ L2  working state   small     │
│ full repository dump         │         │ L3  retrieved docs  on demand │
│ 10 raw tool outputs          │         │ L4  tool results    summarized│
│ 3 whole documents            │         │ L5  history         trimmed   │
└──────────────────────────────┘         └───────────────────────────────┘
                │                                        │
                ▼                                        ▼
  answer hides in the middle              assembler picks layers per step
  model repeats old instructions        raw output leaves after extraction
  you pay for dead weight                 you pay for what the step needs
```

The core move is selection, not volume. Extra context can hurt. An irrelevant
document pulls the model off the answer. A superseded instruction fights the
current one. So the engineer asks, at every step: what is the minimum set of
tokens that lets the model do this step well?

What usually gets cut:

- raw logs and tool output, after you extract the facts from them
- instructions that a later message replaced
- duplicate retrievals of the same document
- old turns that no longer affect the next action

What must stay:

- the goal of the run, in stable wording
- the facts the model derived, in short form
- constraints that still bind, like budget, format, or safety rules

The failure modes look the same from the outside: the model ignores an
instruction, or answers from a stale document. The cause is window management,
not model quality. Debugging means reading the exact context the model saw,
not the prompt you meant to send.

### Example:

Scenario: a support agent answers a refund question. The policy document has
8,400 tokens. The agent has 40 past tickets in its history, about 11,000
tokens.

```text
NAIVE — one growing dump
──────────────────────────────────────────────────────────────────────────────

  turn 1   input = policy.txt (8,400) + 40 old tickets (11,000) + question
           ┌────────────────────────────────────────────────────────────┐
           │ instruction │ old tickets │ policy: page 1..42 │ question  │
           └────────────────────────────────────────────────────────────┘
                                                 ▲
                                    the 14-day rule sits here,
                                   in the middle, next to noise

           model quotes the 30-day rule from page 2. wrong answer.

  turn 2   add: agent reply + 2 raw tool outputs (+3,000 tokens)
           window = 22,400 tokens. most of it is dead weight.
           billing grows. the answer gets harder to find.

WITH CONTEXT ENGINEERING — assemble, use, evict
──────────────────────────────────────────────────────────────────────────────

  user question
        │
        ▼
  retrieve section "refunds" (600 tok) ──► extract 3 rules (120 tok)
        │                                              │
        ▼                                              ▼
  evict the raw document               answer from working state
        │                                              │
        └─────────── next turn ────────────────────────┘
                               │
                               ▼
                 window at turn 2: ~900 tokens
           instructions + facts + new question only

  time      token count in window        what the model reads
  ───────   ───────────────────────      ──────────────────────────────
  turn 1    19,400 (naive)               mostly noise
  turn 1       900  (managed)            the 3 refund rules, clearly
  turn 2    22,400 (naive)               noise grows again
  turn 2       900  (managed)            state stays small, answer stays fresh
```

The managed path does more work per step: one retrieval, one extraction, one
eviction. It returns a smaller window and a better answer. That trade is the
job. Measure it with two numbers: tokens per turn, and answer accuracy on
questions that need a rule from the middle of the document.
