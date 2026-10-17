---
title: "Rotary Position Embedding (RoPE)"
termSlug: "rotary-position-embedding-rope"
year: 2026
month: 10
monthName: "October"
day: 9
order: 7
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Rotary Position Embedding (RoPE) is the position scheme that most modern large language models use. It comes from RoFormer (Su et al., 2021, arXiv 2104.09864). RoPE rotates the query vector by the..."
---
### Definition:

**Rotary Position Embedding (RoPE)** is the position scheme that most modern large language models use. It comes from RoFormer (Su et al., 2021, arXiv 2104.09864). RoPE **rotates** the query vector by the query position, and the key vector by the key position. The attention score then depends only on the distance between the two tokens.

**Why position is needed.** Self-attention is order-blind. It sees a set of tokens with no built-in idea of sequence. Give it "dog bites man" and "man bites dog", and the plain dot products come out the same. A position signal breaks the tie.

Two older families add a vector to the token:

- **Absolute additive**: a learned table or a fixed sinusoidal vector `p_m` is added to the token. The model holds one vector per position. The maximum length is fixed, because the table has a fixed size.
- **Relative bias**: ALiBi adds a fixed penalty to the score, based on distance. It needs no table, but it is a bias, not an encoding.

RoPE does neither. It multiplies instead of adding. It rotates.

**The one-line idea.** Let `m` be the query position and `n` the key position. RoPE applies a rotation `R` to the query by `m`, and a rotation to the key by `n`. The score becomes:

```
score(m, n)  =  q_m^T  R_{n-m}  k_n
```

The term `R_{n-m}` holds only the difference. So the score depends only on the relative distance `n - m`. The proof is one step: a rotation applied in one direction cancels the rotation applied the other way.

**The frequencies.** The model splits the `d` head dimensions into `d/2` pairs. Pair `j` gets a fixed base frequency:

```
theta_j  =  base ^ ( -2 (j - 1) / d )        base = 10,000 by default
```

Early pairs turn fast (short wavelength). Late pairs turn slow (long wavelength). The set forms a geometric ladder. A fast pair separates nearby tokens. A slow pair separates far tokens.

```
NAIVE ADDITIVE vs ROTARY  —  how the score sees position
════════════════════════════════════════════════════════════════════════════

  ADDITIVE (learned / sinusoidal)         ROTARY (RoPE)
  ──────────────────────────────          ──────────────────────────────
  score = (q_m + p_m)^T (k_n + p_n)

  expand:                              q_m ──► rotate m·theta ──► q_m'
       │                               k_n ──► rotate n·theta ──► k_n'
       ├─ q_m^T k_n     (no position)
       ├─ q_m^T p_n     (cross term)   score = q_m'^T k_n'
       ├─ p_m^T k_n     (cross term)         = q_m^T R_{n-m} k_n
       └─ p_m^T p_n     (absolute)           └── ONE term, relative only

  ┌──────────────────────────────┐    ┌──────────────────────────────────┐
  │ 4 entangled terms            │    │ 1 clean term, holds (n - m)      │
  │ absolute vectors are ADDED   │    │ position is MULTIPLIED, no params│
  │ fixed table -> fixed max len │    │ length free, rotates on the fly  │
  └──────────────────────────────┘    └──────────────────────────────────┘

  frequency ladder (head_dim 128 -> 64 pairs, base 10,000)
  ┌──────────────────────────────────────────────────────────────────────┐
  │ pair  1   theta 1.0       wavelength      6       fast, local         │
  │ pair 17   theta 0.1       wavelength     63                           │
  │ pair 33   theta 0.01      wavelength    628                           │
  │ pair 49   theta 0.001     wavelength  6,283                           │
  │ pair 64   theta 1.16e-4   wavelength 54,410      slow, long-range     │
  └──────────────────────────────────────────────────────────────────────┘
  every 16 pairs, theta drops by a factor of 10.
```

**The cost is small.** The rotation is elementwise work, so it costs `O(d)`, not `O(d^2)`. RoPE has no learned parameters. The runtime rotates the key before it writes the key into the KV cache. The cache then holds rotated keys, so RoPE adds zero bytes to the cache.

**The decay property.** As the distance grows, the fast pairs cancel out and the slow pairs stay in phase. So the expected score decays. This gives the model a soft bias toward nearby tokens, with no mask.

**Long context.** RoPE alone does not extrapolate far past the training window. A slow pair needs a long wavelength, and that wavelength does not finish a full turn inside a short window. Three repairs exist:

- **Position Interpolation (PI)**: divide the position by a scale `s`. Simple. It compresses the fast bands and blurs local order.
- **NTK-aware scaling**: change the base instead of the position. For `d = 128` and `s = 16`, the base moves from 10,000 to about 167,000. It keeps the fast bands sharp.
- **YaRN** (Peng et al., 2023, arXiv 2309.00071): scale each band by its own wavelength, plus a small attention-temperature fix. The paper reports about 10x fewer training tokens and 2.5x fewer steps than the earlier method (PI).

Production models ship a raised base: Llama 3 uses base 500,000, and Qwen2 uses base 1,000,000.

**Honest limits.**

- A pure relative score is translation invariant. In theory, RoPE alone cannot tell position 5 from position 5,005. The causal mask and the slow bands break the tie, but the tie-break is weak and learned.
- The wavelength and the training window must match. A window of 8,192 tokens leaves 14 of the 64 pairs without one full turn.
- A changed base needs continued training. Change the base at serving time and the model degrades.
- Long context is not only a RoPE problem. Retrieval quality, attention cost, and the KV cache all limit the real context.

### Example:

"DokumenKita" is a document assistant for an Indonesian law firm. Users upload contracts and ask questions across a long file. The team serves an open 7B model. The model was trained at **8,192 tokens**, with **base = 10,000** and **head_dim = 128**.

The team wants a **32,768-token** window. They stretch the setting and test. Quality collapses on tokens past position 8,192. Perplexity rises above its value at 8,192, and answers about the middle of long contracts turn wrong.

The reason sits in the frequency ladder. At 8,192 tokens, 50 of the 64 pairs complete at least one full turn. 14 pairs never finish a turn. Push the position to 32,768, and those 14 pairs visit phase angles the model never saw in training. So the model reads position by a rule it learned on the wrong range.

```
THE INPUT — why 32K fails on an 8K-trained model (head_dim 128, base 10,000)
════════════════════════════════════════════════════════════════════════════

  position m ──►  phase in band j  =  m · theta_j     (a rotation angle)

  band  1   wavelength      6    turns many times in 8K      OK
   ...
  band 50   wavelength < 8,192   full turn fits the window   OK
  band 51   wavelength > 8,192   training sees PART of a turn
   ...
  band 64   wavelength 54,410    full turn needs 54,410 tokens

  TRAINED WINDOW 8,192                WANTED WINDOW 32,768
  ├───────────────────────┤           ├─────────────────────────────────┤
  |<- 14 slow bands see a  |           positions land on phase angles
  |   partial arc here --->|           the model never trained on
                                       └─► attention reads them wrong

  fix = re-map the phase, so the slow bands stay inside a known range
```

The team compares three repairs on the same card and the same data:

```
THREE REPAIRS — 8,192 -> 32,768 (s = 4), same 7B model
════════════════════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────┬──────────────┬────────────┐
  │ METHOD       │ WHAT CHANGES             │ LOCAL ORDER  │ EXTRA      │
  │              │                          │ KEPT?        │ TRAINING   │
  ├──────────────┼──────────────────────────┼──────────────┼────────────┤
  │ PI           │ position m -> m / 4      │ blurred      │ moderate   │
  │ (linear)     │ every band scaled same   │ (fast bands  │ (needs a   │
  │              │                          │  compressed) │  fine-tune)│
  ├──────────────┼──────────────────────────┼──────────────┼────────────┤
  │ NTK-aware    │ base 10,000 -> ~167,000  │ sharp        │ small      │
  │ (base bump)  │ only the low bands move  │              │            │
  ├──────────────┼──────────────────────────┼──────────────┼────────────┤
  │ YaRN         │ per-band scale by        │ sharp        │ smallest   │
  │ (band-wise)  │ wavelength + temp fix    │              │ ~10x fewer │
  │              │                          │              │  tokens    │
  └──────────────┴──────────────────────────┴──────────────┴────────────┘

  the team picks YaRN. the scale factor rises with the target length:
      32,768 tokens  ->  s = 4
     128,000 tokens  ->  s = 16
```

The result, after a short continued-training pass:

```
BEFORE / AFTER ON THE SAME 7B MODEL
════════════════════════════════════════════════════════════════════════════

  ┌───────────────────────────┬───────────────────┬──────────────────────┐
  │ METRIC                    │ BASE (8K)         │ WITH YaRN            │
  ├───────────────────────────┼───────────────────┼──────────────────────┤
  │ usable window             │ 8,192 tokens      │ 32,768 tokens        │
  │ answer at token 20,000    │ wrong / garbled   │ correct              │
  │ KV cache overhead         │ 0 (keys already    │ 0 (keys already      │
  │                           │    pre-rotated)   │    pre-rotated)      │
  │ extra parameters          │ 0                 │ 0                    │
  │ quality at 4K (old range) │ baseline          │ ~unchanged           │
  └───────────────────────────┴───────────────────┴──────────────────────┘

  RoPE itself never changed. Only the phase map changed.
  the model still stores one rotated key per token. the cache stays flat.
```

Three checks keep the win real:

- **Measure quality inside the old window first.** A scaling change must not break the range the model already knew.
- **Match the band to the window.** Read the slowest wavelength and compare it to the training length.
- **Keep the base and the scale in the model config.** A silent base change at load time breaks quality with no error.

The honest limits stay on the table:

- A wider window is not better recall. A model can still miss a fact in the middle of a long file.
- YaRN and NTK-aware scaling need a short fine-tune to stay stable. Zero-shot stretching works only to a small factor.
- Attention cost still grows with length. RoPE makes the position cheap, not the attention.
- A pure relative score cannot see absolute offset on its own. The causal mask and the slow bands do that work, and both are learned.

The punchline: RoPE does not add position to the token. It **rotates** the query and the key. The dot product then holds only the distance between the two tokens. Multiply, do not add. That one change gives relative position with no parameters, `O(d)` work, and no KV cache cost. The price is the training window: the slow bands need long wavelengths, and a short window never exercises them. So match the base and the scale to the window you need, fine-tune the new range, and measure recall, not just the token limit.
