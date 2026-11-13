---
title: "Eval-Driven Development (EDD)"
termSlug: "eval-driven-development-edd"
year: 2026
month: 11
monthName: "November"
day: 11
order: 8
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Eval-Driven Development (EDD) is a way to build LLM applications. You first write down what \"good\" behavior looks like in numbers. Then you measure every change against those numbers. You keep a ch..."
---
### Definition:

**Eval-Driven Development (EDD)** is a way to build LLM applications. You
first write down what "good" behavior looks like in numbers. Then you
measure every change against those numbers. You keep a change only when
its score goes up or stays equal.

An eval is a test case for a model. It has an input, a rule that checks
the output, and a pass or fail result. The rule can be a string check, a
program assertion, or a second model that grades the answer. A set of
evals forms a scoreboard for your agent.

EDD behaves like Test Driven Development, but for probabilistic output.
A unit test has one right answer. An eval grades an answer that varies
between runs. So EDD compares scores of whole runs instead of asserting
one exact string.

WITHOUT EDD vs WITH EDD — how a change earns trust
──────────────────────────────────────────────────────────────────────────────

┌────────────────────────────────┐    ┌────────────────────────────────────┐
│ WITHOUT: demo-driven           │    │ WITH: eval-driven                  │
│                                │    │                                    │
│ change the prompt              │    │ write the change                   │
│ try 3 examples by hand         │    │ run the full eval set (200+ cases) │
│ "looks good"                   │    │ score = pass rate + assertions     │
│ merge to main                  │    │ compare with saved baseline        │
│                                │    │                                    │
│ weeks later: a regression      │    │ score drops 92% -> 88%             │
│ nobody knows which change      │    │ block the merge, find the case     │
│ debug guesswork, days          │    │ fix or revert, hours               │
└────────────────────────────────┘    └────────────────────────────────────┘

The core of EDD is one short loop. You run it after every change.

THE EDD LOOP — every change passes through the same five steps
──────────────────────────────────────────────────────────────────────────────

  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
  │   SPEC   │───▶│ DATASET  │───▶│   RUN    │───▶│  SCORE   │───▶│  COMPARE   │
  │  "good"  │    │  inputs  │    │  agent   │    │  pass /  │    │  vs saved  │
  │ defined  │    │ + rules  │    │  on all  │    │   fail   │    │  baseline  │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────┬─────┘
        ▲                                                                │
        │ score >= baseline ?  yes -> merge        no: fix or revert     │
        └────────────────────────────────────────────────────────────────┘

Four pieces make the loop work:

1. SPEC FIRST. Write a short spec of good behavior. Include what the
   agent must not do and what must keep working. One page is enough.
2. SMALL DATASET. Start with 30 to 100 cases. Mix real failures from
   production logs with synthetic edge cases. Grow it when a bug
   escapes, not before.
3. NARROW CHECKS. Ask one narrow question per case and grade it pass or
   fail. A 1-to-10 scale hides regressions. "Does the answer cite a
   source? yes/no" finds them.
4. SAVED BASELINE. Store the score of the current main branch. Compare
   experiments against it. A change that fixes one case and breaks
   three others shows up as a number, not as an opinion.

Trade-offs, so the picture stays honest. Someone must write and curate
the eval set, and that work never ends. An LLM judge has its own bias
and cost, so teams often fine-tune a small judge model: Cisco showed
eval models that run at up to 98% lower cost than a commercial LLM
(Splunk Agent Observability, Nov 2026). A dataset rots as the product
changes. And an eval set only measures what you wrote down. A green
scoreboard does not prove safety — it proves that these specific rules
held on these specific cases. EDD replaces "it looked fine" with
measured evidence, not with certainty.

### Example:

Scenario: a team builds a customer support agent. The agent answers
tickets and can call tools. The spec has one hard rule: the agent must
ask the user to confirm before it calls `refund_order`.

FLOW — one week of EDD on the same agent
──────────────────────────────────────────────────────────────────────────────

  when    action                                     score
  ─────   ───────────────────────────────────────    ──────
  mon     baseline run, 120 cases                    92%
          save score as baseline
  tue     change: retrieval tool + prompt rewrite    88%  <- regression
          scorer shows case 47 now fails
  wed     split the change, keep the tool only       90%
  thu     add 6 new cases for the refund rule        91%
  fri     fix: confirm step inside the tool loop     94%
          score above baseline -> merge to main

CASE 47 — the exact failure the scoreboard found
──────────────────────────────────────────────────────────────────────────────

  input    : "order 5512 arrived damaged, just refund me"
  rule     : agent asks for confirmation, no refund call yet
  ────────────────────────────────────────────────────────────────
  before   : OK     "I can refund it. Confirm?"  (no tool call)
  after    : FAIL   refund_order(order="5512")   (called directly)
  ────────────────────────────────────────────────────────────────
  cause    : the new prompt says "act fast, complete the task"
  fix      : the confirm check moves into the tool executor,
             so no prompt wording can skip it

Compare with the world without EDD. On Tuesday the demo still looks
fine: one hand-picked ticket shows a fast, correct refund. The team
merges. The skipped confirmation reaches users on Friday. With EDD the
scoreboard drops on Tuesday, case 47 names the failure, and the fix
lands before users see the change.
