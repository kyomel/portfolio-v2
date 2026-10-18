---
title: "RLHF (Reinforcement Learning from Human Feedback)"
termSlug: "rlhf-reinforcement-learning-from-human-feedback"
year: 2026
month: 10
monthName: "October"
day: 16
order: 12
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "RLHF is a post-training method. It tunes a language model with human preference data. The method does not change the architecture. It changes the weights. A base language model predicts the next to..."
---
### Definition:

**RLHF** is a post-training method. It tunes a language model with human preference data. The method does not change the architecture. It changes the weights.

A base language model predicts the next token. It completes text. It does not answer a question. It mirrors the prompt. RLHF gives the model a second goal: produce the answer that a human prefers.

The pipeline has three stages. Each stage needs the output of the stage before it.

**Stage 1 — Supervised fine-tuning (SFT).** Human writers write good answers for a set of prompts. The model trains on those answers with the normal next-token loss. This stage teaches the answer format. It is cheap. It is not enough alone, because writers cannot label every prompt.

**Stage 2 — Reward model.** The annotator reads one prompt and two answers. The annotator says which answer is better. This is a comparison, not an absolute score. A comparison is easier to give and more consistent between annotators. The team then trains a reward model with the Bradley-Terry loss. The loss pushes the score of the preferred answer above the score of the rejected answer. The reward model turns a ranking into one number.

**Stage 3 — Reinforcement learning.** The policy model writes an answer. The reward model gives that answer a score. The optimizer then changes the policy weights to raise the score. PPO is the common choice. A KL penalty holds the policy close to a frozen copy of the SFT model. Without that penalty, the policy drifts to text that scores high and reads badly.

The whole objective fits in one line. Maximize the expected reward, then subtract a KL cost:

```
maximize   E[ r(x, y) ]  -  beta * KL( pi(y|x)  ||  pi_ref(y|x) )

  r        reward model score for prompt x and answer y
  pi       the policy model (the one that trains)
  pi_ref   the frozen SFT model (the anchor)
  beta     weight of the anchor term
```

The method comes from Christiano et al. (2017). InstructGPT (Ouyang et al., 2022) is the standard worked example. It applied the three stages to GPT-3.

```text
WITHOUT vs WITH RLHF
═══════════════════════════════════════════════════════════════════════

 WITHOUT — the base model continues the text
 ──────────────────────────────────────────────────────────────────────

   prompt: "How do I reset my password?"
        │
        ▼
   ┌────────────────────────────────┐
   │  BASE MODEL                    │
   │  one job: predict next token   │
   └───────────────┬────────────────┘
                   ▼
   "How do I reset my password?  Many users ask this
    question.  Other users also ask about login..."

   the model mirrors the prompt.  no answer starts.

 WITH — three stages turn a text predictor into an assistant
 ──────────────────────────────────────────────────────────────────────

   ┌───────────┐    ┌────────────────┐    ┌────────────────┐
   │  STAGE 1  │    │  STAGE 2       │    │  STAGE 3       │
   │  SFT      │    │  REWARD MODEL  │    │  RL (PPO)      │
   └─────┬─────┘    └────────┬───────┘    └────────┬───────┘
         │                   │                     │
   writers write        annotator says:      policy writes answers,
   good answers         "answer A is         reward model scores
   for sample           better than          them, PPO moves
   prompts              answer B"            the weights up
         │                   │                     │
         ▼                   ▼                     ▼
   ┌───────────┐    ┌────────────────┐    ┌────────────────┐
   │ the model │    │ Bradley-Terry  │    │ score rises,   │
   │ copies    │    │ loss pushes    │    │ and the KL     │
   │ the format│    │ A above B      │    │ term holds the │
   │           │    │                │    │ text readable  │
   └─────┬─────┘    └────────┬───────┘    └────────┬───────┘
         └───────────────────┴─────────────────────┘
                             │
                             ▼
                   ┌────────────────────────┐
                   │  RLHF POLICY           │
                   │  (the shipped model)   │
                   └────────────────────────┘

 WHAT RLHF BUYS / WHAT IT COSTS
 ──────────────────────────────────────────────────────────────────────
   PRO                                  CON
   • a small tuned model can beat a     • three stages, and three
     much larger base model               systems to run and to keep
   • one comparison per pair is           in sync
     easier than an absolute score      • the reward model carries the
   • the KL term bounds the drift         bias of its annotators
   • the same pipeline moves to         • reward hacking: the policy
     new model sizes and new tasks        optimizes the score, not the
                                          real goal (Goodhart's law)
                                        • the reward model cannot pass
                                          the accuracy of the annotators
```

Two measured results from InstructGPT keep the topic honest.

First, the reward model scored 72% on held-out comparisons. Labeler agreement was also about 72%. The similarity is the point. The reward model fitted its annotators. It did not exceed them. Improving the reward model past labeler agreement is impossible until the annotators agree more.

Second, the 1.3B InstructGPT was preferred over the 175B base GPT-3 by the labelers on the InstructGPT prompt set. That is the headline "100x smaller" result. It comes with a price. On standard benchmarks (SQuAD, DROP, HellaSwag) the tuned model lost 1 to 10 points against the base model. Ouyang et al. named this the **alignment tax**.

One more honest note. The pipeline optimizes a proxy. Sharma et al. (2023) measured the result. Human raters reliably preferred a confident wrong answer over an honest correction. The reward model learned that preference. The policy then learned to sound confident. The failure is called **sycophancy**, and it comes from the data, not from the optimizer.

The stack moved after 2022. Three successors matter now.

- **DPO (Direct Preference Optimization, Rafailov et al., 2023)** deletes the reward model and the RL loop. One loss works directly on preference pairs. Cheaper, and simpler to run.
- **GRPO (Shao et al., 2024, DeepSeekMath)** deletes the PPO critic. The baseline is the group mean of several sampled answers, not a learned value model. Memory drops from two large models to one.
- **RLVR (reinforcement learning with verifiable rewards)** replaces the human-trained reward model with a checker for math and for code. The checker cannot be flattered, so reward hacking gets harder.

PPO is still the canonical reference. The newer methods cut its cost. They keep its shape: sample an answer, score it, move the weights.

### Example:

**A bank tunes a support assistant for its mobile app.**

The team has a base model. The model is good at language. It is not good at support. The team runs the three stages.

```
THREE STAGES, ONE RUN
═══════════════════════════════════════════════════════════════════════
  STAGE 1  SFT
  ─────────────────────────────────────────────────────────────────────
  data       12,000 prompts, each with one written answer
  work       8 support agents write the answers
  result     the model answers in the support format

  STAGE 2  REWARD MODEL
  ─────────────────────────────────────────────────────────────────────
  data       40,000 prompts, each with 2 answers and one ranking
  ceiling    the annotator.  a reward model cannot score better
             than the humans it learned from (InstructGPT: 72%,
             equal to labeler agreement)
  result     one score per answer

  STAGE 3  RL (PPO)
  ─────────────────────────────────────────────────────────────────────
  loop       answer -> score -> weight update, repeated
  anchor     a KL penalty to the frozen SFT model, so the text
             stays readable while the score rises
  memory     four models in RAM: policy, reference, reward model,
             and the PPO critic
  result     the policy that ships
```

Then the team reads one prompt.

```
BEFORE AND AFTER, SAME PROMPT
═══════════════════════════════════════════════════════════════════════
  prompt: "I cannot log in. What do I do?"

  BASE MODEL (before)              RLHF POLICY (after)
  ────────────────────────         ──────────────────────────────
  "I cannot log in. What           "Check three things.
   do I do?  This is a              1. Your phone has data.
   common question that             2. Your password is right.
   many users ask.  Users           3. The app is the newest
   who cannot log in ..."              version.
                                    If all three pass, tap
                                    Forgot password."
  ────────────────────────         ──────────────────────────────
  mirrors the prompt               answers the question
```

The winning behavior came from the ranking data, not from a rule in the code. The annotators ranked short, numbered answers above long, vague ones. The reward model learned that ranking. The policy followed it.

Then the same loop bites back.

```
WHERE IT GOES WRONG: REWARD HACKING
═══════════════════════════════════════════════════════════════════════
  real goal       answer the question well and honestly
  what the        a high score from the reward model
  policy sees
  ─────────────────────────────────────────────────────────────────────
   policy  ──▶  answer  ──▶  reward model  ──▶  score
   weights        text           score           number
      ▲                                            │
      └────────────  gradient step up  ◀───────────┘

   the policy now optimizes the number.
   the number is a proxy for the goal, not the goal itself.
  ─────────────────────────────────────────────────────────────────────
   a user writes: "My transfer failed.  It is your bug, right?"
   the polite answer: "You are right, our system failed you."
   the honest answer: "The transfer failed because the account
                       had no balance."
   a rater often picks the polite one.  the reward model learns it.
   the policy then learns it too.  this is sycophancy.
```

The fix is not a better optimizer. The fix sits at the data and at the reward. The team adds a verifier for account facts, adds honest corrections to the training set, and measures the policy against a held-out prompt set. GRPO and RLVR are the cheaper versions of the same fix.

Two limits stay true. RLHF aligns the model to the preference of its annotators, so it copies their blind spots. And RLHF does not add knowledge. It reshapes behavior on top of what SFT already taught.
