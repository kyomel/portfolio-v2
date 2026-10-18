---
title: "Constrained Decoding"
termSlug: "constrained-decoding"
year: 2026
month: 9
monthName: "September"
day: 25
order: 19
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Constrained Decoding is an inference-time technique that forces a language model to emit only text that is valid against a given grammar, JSON schema, or regular expression. The decoder does this b..."
---
### Definition:

Constrained Decoding is an inference-time technique that forces a language model to emit only text that is valid against a given grammar, JSON schema, or regular expression. The decoder does this by **masking the next-token distribution at every decoding step**.

The mechanism has one idea. Before the sampler picks a token, the decoder asks a small state machine one question: "given the text produced so far, which tokens can legally come next?" The decoder sets every other token to logit `-inf`. The sampler then draws from the survivors. The model keeps its relative preference among the allowed tokens, because masking removes options, it does not reorder them.

Aliases you will meet in the wild name the same machinery: guided generation, schema-guided sampling, structured outputs, JSON mode, GBNF (llama.cpp), and `strict: true` on tool definitions (Anthropic).

The constraint source decides the automaton:

```
  REGEX                →  DFA (regular language, linear time to evaluate)
  JSON SCHEMA          →  schema walker, or an FSM compiled from the schema
  CONTEXT-FREE GRAMMAR →  pushdown automaton (GBNF, EBNF)
  FUNCTION CALLING     →  a JSON-schema constraint with a different framing
```

```text
NAIVE (PROMPT-ONLY) vs CONSTRAINED (MASKED):
════════════════════════════════════════════════════════════════════════

  NAIVE — ask nicely in the prompt, then parse the result:

    prompt ──► [ MODEL ] ──► free text ──► [ parse ] ──► maybe OK
                 no mask      can drift       can fail

    Legal set at step N:  THE WHOLE VOCABULARY (32K–128K tokens)
    An invalid token can be sampled at ANY step.

    ┌────────────────────────────────────────────────────────────┐
    │ "Sure! Here is the JSON you asked for:                     │
    │  ```json                                                   │
    │  { "tipe": "puasa_sunnah", "sahur": 4.20 }                 │
    │  ```                                                        │
    │  Let me know if you need anything else!"                    │
    └────────────────────────────────────────────────────────────┘
                          │
                          ▼
    parse → FAIL (markdown fence, wrong key, float where time
    was promised) → retry the whole request → at scale, 1–5% of
    calls break, and every retry buys a second full generation.

  CONSTRAINED — mask invalid tokens at every step:

    prompt ──► [ MODEL ] ──► logits over 100K tokens
                                │
                                ▼
                    ┌───────────────────────────┐
                    │ GRAMMAR STATE MACHINE     │
                    │ state = text so far       │
                    │ out   = legal token IDs   │
                    └───────────┬───────────────┘
                                │
                                ▼
                    set all OTHER tokens to -inf
                                │
                                ▼
                    softmax → sample one token
                                │
                                ▼
                    feed token back → state advances
                    ─────────────────────────────
                    loop until the terminal state
                    or EOS

    Legal set at step N:  ONLY THE TOKENS THAT KEEP THE OUTPUT
    VALID. Everything else is -inf. Invalid output is not rare.
    Invalid output is UNREACHABLE.

  ┌────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: the guarantee lives in the SAMPLER, not in the       │
  │  model's good will. A model that "wants" to write a chatty      │
  │  preamble cannot: every prose token is masked to probability 0. │
  └────────────────────────────────────────────────────────────────┘
```

One step of the loop, spelled out:

```
  1  the model emits logits over the full vocabulary
  2  the state machine returns the legal token IDs for this state
  3  the decoder writes -inf on every other token ID
  4  softmax renormalizes the distribution over the survivors
  5  the sampler draws one token (temperature and top-p still apply)
  6  the chosen token advances the state machine → new state
```

The trade-offs, stated honestly:

```text
  ┌──────────────────────────────────────────────────────────────┐
  │  PRO                                                         │
  │  • Valid by construction — no parse lane, no retry lane.     │
  │  • Removes a whole failure class: fences, preambles, missing │
  │    fields, string-where-number.                              │
  │  • Often the SAME or lower total latency, because the model  │
  │    writes no filler and stops when the object closes.        │
  │  • Tool arguments and routing decisions become safe for code │
  │    to consume without a fallback parser.                     │
  │                                                              │
  │  CON                                                         │
  │  • Syntax only. Structure correct, content can still be      │
  │    wrong. Semantic validation stays your job.                │
  │  • Range keywords (minimum, maximum, minLength) are advisory │
  │    in most engines. The grammar checks type, not value.      │
  │  • Tight schemas can suppress reasoning. A first-token       │
  │    commitment leaves no room to think.                       │
  │  • One more moving part in the serving stack: grammar        │
  │    compile cost, tokenizer alignment, per-token mask work.   │
  └──────────────────────────────────────────────────────────────┘
```

Four limits worth knowing before you ship:

- **Syntax is not meaning.** A schema with `"confidence": number` always returns a number. Nothing stops the model from returning 0.9999 when the honest value is 0.3.
- **Range annotations are documentation.** JSON Schema `minimum`, `maximum`, `minLength`, and `maxLength` are **not** enforced by the grammar engine in most implementations. Validate those in your own code.
- **Tokenizer alignment can block a grammar.** The vocabulary may hold no single token for a required literal. Libraries preprocess the grammar against the tokenizer and keep only tokens that are valid prefixes of a legal completion. If no path exists, the library falls back to character-level decoding (slow) or rejects the grammar at compile time.
- **Constraining too early can cost quality.** If the schema is `{"answer": int}` and the task is hard, the model must commit on the first token. Two fixes are standard in 2026: put a `reasoning` string field first in the schema so the model has scratch space, or do two-stage generation (unconstrained reasoning, then constrained extraction). The CRANE paper (ICML 2025) alternates unconstrained and constrained windows and reports recovery of up to 10 percentage points on symbolic reasoning benchmarks.

Cost, in numbers, as of 2026:

```
  mask computation per token      XGrammar  < 40 µs
                                  llguidance (Rust)  ~40–50 µs
                                  — about 100x faster than 2023-era libraries
  end-to-end inference overhead   1–5% of total inference time
  grammar compile cost            milliseconds, paid once per schema
  parse failure rate, prompt-only 1–5% of calls at scale
```

The 2026 landscape, which is why the term moved from trick to default:

- **Hosted providers.** OpenAI `response_format: json_schema`, Anthropic `output_config.format` plus `strict: true` tool definitions, Google `responseSchema`. All three compile the schema into a grammar and constrain generation at inference time.
- **Self-hosted engines.** vLLM guided decoding (`guided_json`, `guided_regex`, `guided_choice`, `guided_grammar`) and SGLang. **XGrammar is the default backend in vLLM, SGLang, and TensorRT-LLM by 2026**; Outlines, lm-format-enforcer, and llguidance remain selectable.
- **Function calling is this pattern.** The trained behavior gives the semantic intent. The constraint gives the syntactic guarantee. Model weights alone give neither reliably.
- **Refusal inside valid JSON is a new failure mode.** The object can be schema-valid and still carry a refusal string. Keep a post-parse check for refusal signatures and log those responses as their own metric.

### Example:

"CatatPuasa", the fasting-log bot for Kyomel's fasting-bot project, lets a user log a fast by typing one casual message. The message is free text. The database row must be exact. The service runs Go on a small box, and it calls an open-weight model through vLLM.

```
THE JOB — one chat message in, one database row out
════════════════════════════════════════════════════════════════════════

  user: "puasa sunnah ya, sahur 04:20 buka 18:05"
        │
        ▼
  SCHEMA — compiled ONCE at service startup (~2 ms), not per request
  {
    "type": "object",
    "properties": {
      "jenis": { "enum": ["dry", "water", "sunnah"] },
      "sahur": { "type": "string", "pattern": "^[0-2][0-9]:[0-5][0-9]$" },
      "buka":  { "type": "string", "pattern": "^[0-2][0-9]:[0-5][0-9]$" }
    },
    "required": ["jenis", "sahur", "buka"]
  }
```

Without a constraint, the first version of the bot failed the way every prompt-only version fails: the model answered politely, wrapped the JSON in a markdown fence, renamed `jenis` to `tipe`, and returned `4.20` as a float where the schema promised a time string. The Go code returned an error, so the bot asked the user to repeat. Two generations for one message, and a dead-letter queue for the calls that failed twice.

With guided decoding turned on, the mask does the work:

```
STEP BY STEP — the mask shrinks the vocabulary to one legal path
════════════════════════════════════════════════════════════════════════

 step  grammar state        legal tokens            picked by sampler
 ──────────────────────────────────────────────────────────────────────
  0    expect-object       {  only                 {
  1    expect-key-name     "jenis" "sahur" "buka"   "jenis"
  2    expect-colon        :  only                 :
  3    enum value          "dry" "water" "sunnah"   "sunnah"
  4    expect-comma-or-}   ,  or  }                ,
  5    expect-key-name     "sahur" "buka"           "sahur"
  6    expect-colon        :  only                 :
  7    pattern string      tokens that keep a legal
                           prefix of ^[0-2][0-9]:… "04"
  8    pattern string      prefix must stay legal   ":20"
  9    expect-comma-or-}   ,  or  }                ,
 10    expect-key-name     "buka"                  "buka"
 11    expect-colon        :  only                 :
 12    pattern string      …                        "18:05"
 13    terminal state      }  or  EOS              }
 ──────────────────────────────────────────────────────────────────────
 every row is the ONLY way forward. There is no retry lane, because
 there is no invalid state to recover from.

┌──────────────────────────────────────────────────────────────────────┐
│  OUTPUT — always this shape, on every call, for every user:          │
│                                                                      │
│  {"jenis":"sunnah","sahur":"04:20","buka":"18:05"}                   │
│                                                                      │
│  → one INSERT, one streak update, one reply. No parser fallback.     │
└──────────────────────────────────────────────────────────────────────┘
```

The service gained three properties for free. The Go handler no longer needs a fallback parser. The retry path disappeared, so median latency fell even with the extra mask work. And the leaderboard stopped receiving rows with a missing `sahur` field.

The honest part is what the constraint still does **not** buy:

```
  SCHEMA-VALID, STILL WRONG — the mask cannot read meaning
  ─────────────────────────────────────────────────────────────
  user: "puasa sunnah ya, sahur 04:20 buka 18:05"
  model output:
      {"jenis":"sunnah","sahur":"18:05","buka":"04:20"}
                 ▲ valid JSON   ▲ times swapped
  ─────────────────────────────────────────────────────────────
  the grammar is happy. The fasting log is nonsense.

  FIX — application code, not grammar:
   • sanity check in Go: sahur must be earlier than buka
   • add "confidence": number to the schema, route low values
     to a clarify question
   • keep a "reasoning": string field FIRST in the schema, so the
     model can compare the two times before it commits to them
   • validate ranges and patterns in code, never trust
     schema "minimum" / "maximum" annotations
```

```text
THE FULL PICTURE — where each guarantee comes from
════════════════════════════════════════════════════════════════════════

  user message
      │
      ▼
  ┌──────────────────────────────┐
  │ PROMPT + JSON SCHEMA         │  intent: what the user means
  └──────────────┬───────────────┘
                 ▼
  ┌──────────────────────────────┐
  │ vLLM + XGrammar mask         │  syntax: guaranteed valid JSON,
  │ < 40 µs per token            │  correct keys, correct types
  └──────────────┬───────────────┘
                 ▼
  ┌──────────────────────────────┐
  │ GO VALIDATION                │  meaning: sahur < buka, streak
  │ range + ordering + quota     │  rules, per-user limits
  └──────────────┬───────────────┘
                 ▼
  ┌──────────────────────────────┐
  │ DATABASE ROW                 │  durable fact
  └──────────────────────────────┘

  Rule: the grammar owns SHAPE. Your service owns TRUTH.
```

The punchline: constrained decoding turns "the model usually returns parseable JSON" from a hope into a property of the sampler. One compile, a mask of tens of microseconds per token, and a whole class of production failures stops existing — fences, preambles, invented keys, wrong types. What it never does is read the content: it can promise you a well-formed object, and it will happily hand you the well-formed wrong one. So the correct split in 2026 is dull and reliable — let the grammar own structure, let the model own language, and let your own code own correctness.
