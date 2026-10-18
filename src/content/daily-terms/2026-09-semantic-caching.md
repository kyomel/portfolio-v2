---
title: "Semantic Caching"
termSlug: "semantic-caching"
year: 2026
month: 9
monthName: "September"
day: 16
order: 12
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Semantic Caching is a cache that matches requests by meaning, not by text. The cache turns every incoming prompt into an embedding vector. It then searches for the nearest prompt it has answered be..."
---
### Definition:

**Semantic Caching** is a cache that matches requests by *meaning*, not by text. The cache turns every incoming prompt into an embedding vector. It then searches for the nearest prompt it has answered before. If the similarity score passes a threshold, the cache returns the stored answer and the model never runs.

The pattern exists because real traffic repeats itself. Users do not ask a thousand unique questions. They ask the same five questions in a thousand different words. An exact-match cache sees five distinct prompts and pays five model calls. A semantic cache sees one meaning and pays one.

The request path has five steps:

1. Embed the prompt with an embedding model (for example `text-embedding-3-small`, 1536 dimensions).
2. Search a vector index for the nearest stored prompt (approximate nearest neighbour, usually HNSW).
3. Compare the similarity score to a threshold.
4. Score ≥ threshold → return the stored answer. This is a **hit**. No model call.
5. Score < threshold → call the model, then store the new prompt vector and the new answer. This is a **miss**.

The cache lives at the application layer or at the AI gateway layer. The gateway layer wins in practice, because the gateway already sees every provider, every key, and every request metric. Published gateway guides report 30–50% cost cuts for repetitive support and FAQ traffic. The real number depends on how diverse the questions are.

Semantic caching is not the only cache in a modern LLM stack, and the three layers answer different questions. Provider **prompt caching** keys on a byte-identical prompt prefix (usually the system prompt). It reduces prefill compute and the model still generates a fresh answer, so it carries no correctness risk. **Exact-match caching** keys on the full prompt text and reuses the whole answer. **Semantic caching** keys on meaning and reuses the whole answer.

```text
EXACT-MATCH + PROMPT CACHING  vs  SEMANTIC CACHING — what actually gets reused
═════════════════════════════════════════════════════════════════════════════

FOUR MEMBERS ASK ONE QUESTION IN ONE HOUR:

  Q1  "cara refund transaksi gagal?"            ← original wording
  Q2  "transaksi gagal, gimana cara refundnya?" ← same meaning
  Q3  "uang saya balik kapan kalau gagal?"      ← same meaning
  Q4  "refund dong, transaksi gagal"            ← same meaning

WITHOUT SEMANTIC CACHING — the text is the key
┌───────────────────────────────────────────────────────────────────┐
│  question ──► [ cache key = the exact prompt bytes ]              │
│                        │                                          │
│      Q1 HIT            │   Q2 MISS   Q3 MISS   Q4 MISS            │
│      (stored earlier   │                                          │
│       from the same    ▼                                          │
│       wording)   ┌──────────────┐                                 │
│                  │   the model  │   4 prompts ──► 4 calls         │
│                  │   (900 ms)   │   3 of them redundant           │
│                  └──────────────┘                                 │
├───────────────────────────────────────────────────────────────────┤
│  provider prompt caching helps a little here: the shared system   │
│  prompt prefix is cheap for all four, but all four still generate │
│  a full answer. Cost per answer drops. Calls do not.              │
└───────────────────────────────────────────────────────────────────┘

WITH SEMANTIC CACHING — the meaning is the key
┌────────────────────────────────────────────────────────────────────┐
│  question ──► [ embed + ANN search + threshold ]                   │
│                        │                                           │
│      Q1 HIT            │   Q2 HIT   Q3 HIT   Q4 HIT                │
│      (cold cache:      │                                           │
│       the model ran    ▼                                           │
│       once)      ┌────────────────────┐                            │
│                  │  1 model call for  │   stored vector + answer   │
│                  │  all four meanings │   goes back into the index │
│                  └────────────────────┘                            │
├───────────────────────────────────────────────────────────────────┤
│  the price of the win: similarity is a GUESS. A wrong guess       │
│  returns a fluent, confident, well-formatted, WRONG answer —      │
│  and the user has no way to tell it came from a cache.            │
└───────────────────────────────────────────────────────────────────┘
```

The threshold is the whole design. One number controls the hit rate and the false-positive rate at the same time. No single value gives both a high hit rate and few wrong answers.

```
ONE KNOB, TWO METRICS — the shape every threshold sweep produces
════════════════════════════════════════════════════════════════════

  threshold   hit rate   precision (500 sampled hits, human/judge graded)
  ─────────────────────────────────────────────────────────────────────
    0.75        61%        79%   ✗ cheap but reckless: 1 in 5 answers wrong
    0.86        38%        97%   ← the shipped operating point
    0.92        12%       99.6%  ✗ safe but weak: almost no reuse left
  ─────────────────────────────────────────────────────────────────────

  quality falls as you loosen the threshold, savings fall as you tighten it
  → so the cache is a QUALITY decision first and a cost decision second

  the measurement set you need (a hit rate alone hides quality problems):
    · hit rate        — how often the cache fired
    · precision       — of the hits, how many were actually correct
    · recall          — of the reusable answers, how many you captured
    · F1              — the balance point you tune toward
    · expected latency = (hit rate × cache latency)
                       + (miss rate × full pipeline latency)
    · cost per successful answer, and cost per tenant
```

Four failure modes matter, and the last one survives every threshold setting:

- **Negation blindness.** Embedding models place a sentence and its negation close together. A 2025 study in *Scientific Reports* measured this directly. "You must keep the subscription" and "you must not keep the subscription" score as highly similar. No threshold fixes this, because the vectors really are close.
- **Context dependence.** Two prompts look similar and deserve different answers, because one carries a conversation history, an account state, or a retrieved document. Agentic and RAG traffic is context-sensitive by definition, so a prompt-only key is too weak. The key must include the model, the system prompt version, the tenant, and any retrieved context hash.
- **Staleness.** The world moves and the cached answer does not. A price change, a policy change, or a fixed bug leaves the old answer in the index until the TTL expires.
- **Cross-tenant leakage.** A shared index makes one member's answer available to another member's matching question. Any answer that contains personal, health, or financial data must not enter a shared namespace.

The safe configuration uses strict rules:

- One index per tenant for anything member-specific. One shared index only for public, static, factual answers.
- Exact-match lookup first (normalize the text, then hash it). Only make the embedding call when the exact key misses.
- A strict threshold per category. Health, money, and legal answers get the strict value, or no cache at all.
- A validator on the ambiguous band (for example 0.86–0.94). A small, cheap model checks the candidate before the answer is served.
- A TTL per category, and a flush hook that every content change calls.
- An adversarial "must not hit" test set in CI: hundreds of pairs of near-identical questions with opposite answers.
- Sampled hits graded offline, every week, with the grade feeding back into the threshold.

### Example:

Kyomel's **fasting-bot** grew an LLM assistant called **"Tanya Ustadz"**. Members ask it about sahur, buka, travel, illness, and the fast of pregnant members. The bot answers in Indonesian. Volume is 1.8M questions per month, and the traffic pattern is harsh: at **04:00–05:00 WIB**, one hour carries **9,000 questions**, with a peak of about 900 questions per minute. The conversation provider rate-limits the workspace at 400 requests per minute, so the burst used to return 429s to real members.

The first version called the model for every question. p50 latency was 900 ms per answer, and the bill was about **$0.0019 per answer**, or **$3,420 per month**.

The second version added a semantic cache at the gateway: one embedding call per question (about **8 ms**, **$0.00002**), one HNSW index, threshold **0.86** on cosine similarity, TTL 24 hours.

```text
THE REQUEST PATH AFTER THE CACHE — and the numbers it produced
═══════════════════════════════════════════════════════════════════════

  member question
        │
        ▼
  ┌─────────────────┐        ┌──────────────────────┐
  │ embed (8 ms)    │───────►│ ANN search (HNSW)    │
  │ $0.00002        │        │ nearest stored prompt│
  └─────────────────┘        └───────────┬──────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │ similarity ≥ 0.86 ?  │
                              └───┬──────────────┬───┘
                            yes   │              │  no
                                  ▼              ▼
                     ┌────────────────────┐  ┌────────────────────┐
                     │ return stored      │  │ call the model     │
                     │ answer  (9 ms)     │  │ 900 ms, $0.0019    │
                     └────────────────────┘  └─────────┬──────────┘
                                                       │ store vector
                                                       │ + answer + TTL
                                                       ▼
                                             ┌────────────────────┐
                                             │ vector index       │
                                             └────────────────────┘

  RESULT (measured over one month, 1.8M questions)
  ─────────────────────────────────────────────────────────────────────
  hit rate, all day          38%     p50 latency   900 ms → 561 ms
  hit rate, sahur burst      71%     p50 in burst  900 ms → 267 ms
  burst model calls          9,000 → 2,610 per hour at a 71% hit rate;
                             900 q/min peak → 261 calls/min, under the
                             400/min provider limit
  cost                       $3,420 → 1,116,000 misses × $0.0019
                             + 1.8M embeddings × $0.00002 = $2,156
  saving                     ≈ $1,264 per month, before tune-up
  ─────────────────────────────────────────────────────────────────────
```

Then the cache answered a question it should have refused.

Two members asked questions that a human reads as opposites. `"Batal nggak puasanya kalau lupa makan siang?"` (a genuine mistake) and `"Batal kan puasanya kalau sengaja makan?"` (a deliberate act). The answers differ: one is "the fast stands, continue your day", the other is "the fast is broken, you must make it up". The embeddings scored **0.91**. Member two received the cached answer for member one, in flawless Indonesian, in 9 ms. The member escalated, and the escalation is what found the bug, not any dashboard.

The fix list is the same list every team ends up with. They split the index by category and gave the **fiqh** category a threshold of **0.95**. They added an exact-match tier in front, so repeated identical questions never pay an embedding call. They added a small validator model on hits between 0.91 and 0.95, and they accepted the extra ~300 ms on that thin band. They built a **"must not hit" CI suite** of 240 adversarial pairs — lupa versus sengaja, sahur versus iftar, pregnant versus menstruating, travel by air versus travel by land — and every pair must score below the category threshold or the build fails. And they scoped member-specific answers, such as cycle tracking and medication notes, to a per-member namespace with the cache disabled for those categories.

Three lessons generalise. **A hit is a claim about correctness, not a cache statistic**, so precision — never hit rate — is the number that decides whether the cache stays. **Thresholds belong to categories, not to the system**, because "what is the refund policy" is a safe question to fuzzy-match and "does my fast count today" is not. And **the embedding call is paid on every request, hit or miss**, so a semantic cache that fires rarely is a straight cost increase: at a 12% hit rate the assistant would have paid $3,046 against a $3,420 baseline, which means the team optimised a metric and paid more money.

The punchline: every cache before this one reused *bytes*, and bytes are safe to compare. A semantic cache reuses *meaning*, and meaning is a similarity score with a decimal point. That decimal point now sits on the request path of a system where a wrong answer costs trust, so the work is no longer cache configuration — it is a labelled test set, a per-category threshold, and the discipline to serve a slower answer when the fast one might be wrong.
