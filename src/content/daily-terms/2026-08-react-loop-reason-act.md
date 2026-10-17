---
title: "ReAct Loop (Reason + Act)"
termSlug: "react-loop-reason-act"
year: 2026
month: 8
monthName: "August"
day: 13
order: 9
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "The ReAct Loop is a prompting and agent-architecture pattern that interleaves Reasoning and Acting in a loop — letting an AI model alternate between thinking through a problem and taking actions (c..."
---
### Definition:

The ReAct Loop is a prompting and agent-architecture pattern that interleaves Reasoning and Acting in a loop — letting an AI model alternate between thinking through a problem and taking actions (calling tools) to gather information or affect the world, then using the results to reason further. The name combines "Re" (Reasoning) and "Act" (Acting).

It was introduced in the 2022 paper "ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al.). The key insight: reasoning alone can't access real-world information (the model might hallucinate facts it could just look up), and acting alone (blindly calling tools) lacks strategy. Combining them — reason, act, observe, reason again — produces much better results for tasks that need external knowledge or multi-step problem solving.
THE ReAct LOOP:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │                        LOOP                              │
  │                                                         │
  │              ┌─────────────────────────┐                 │
  │              │                         │                 │
  │              ▼                         │                 │
  │    ┌─────────────────────┐             │                 │
  │    │  1. REASON           │             │                 │
  │    │  (Think)             │             │                 │
  │    │  "I need to find the │             │                 │
  │    │   current weather.   │             │                 │
  │    │   I should search    │             │                 │
  │    │   the web."          │             │                 │
  │    └──────────┬──────────┘             │                 │
  │               │                         │                 │
  │               ▼                         │                 │
  │    ┌─────────────────────┐             │                 │
  │    │  2. ACT              │             │                 │
  │    │  (Do)                │             │                 │
  │    │  Call tool:          │             │                 │
  │    │  web_search("Jakarta │             │                 │
  │    │  weather today")     │             │                 │
  │    └──────────┬──────────┘             │                 │
  │               │                         │                 │
  │               ▼                         │                 │
  │    ┌─────────────────────┐             │                 │
  │    │  3. OBSERVE          │             │                 │
  │    │  (Result)            │             │                 │
  │    │  Tool returns:       │             │                 │
    │    │  "Jakarta: 30°C,     │             │                 │
    │    │   scattered clouds"  │             │                 │
    │    └──────────┬──────────┘             │                 │
    │               │                         │                 │
    │               └──────► loop back to     │                 │
    │                        REASON with      │                 │
    │                        new information  │                 │
    └─────────────────────────────────────────┘                 │
                                                                │
    The loop repeats until the goal is reached.                 │
    Each iteration adds real information from the world         │
    that the model didn't know before.                          │

### Example:

A visual walkthrough of a ReAct loop solving a multi-step problem that requires external information.

```
User asks the agent: "What's the population of the capital of the country that won the most medals at the 2024 Olympics?"

This requires multiple steps AND external information the model doesn't know.
═══════════════════════════════════════════════════════════════
  HOW A NON-ReAct MODEL (Pure Reasoning) FAILS
═══════════════════════════════════════════════════════════════

  Model just "reasons" from memory:

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Think: "Which country won the most medals in 2024?     │
  │          I think it was... the USA?"                    │
  │  (might guess wrong or have outdated data)              │
  │                                                         │
  │  Think: "USA's capital is Washington D.C.               │
  │          Population is... about 700,000?"               │
  │  (might hallucinate the number)                         │
  │                                                         │
  │  Answer: "The population is approximately 700,000."     │
  │                                                         │
  │  ⚠️ RISK: If the medal leader guess is wrong, or the    │
  │     population is wrong, the ENTIRE answer is wrong.    │
  │     Pure reasoning can't verify anything.               │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
  ═══════════════════════════════════════════════════════════════
    HOW THE ReAct LOOP SOLVES IT (Reason → Act → Observe)
  ═══════════════════════════════════════════════════════════════
  
    Iteration 1:
    ┌─────────────────────────────────────────────────────────┐
    │  REASON: "I don't know which country won the most       │
    │          medals in 2024. I should search the web."      │
    │                                                         │
    │  ACT:    web_search("2024 Olympics medal table")        │
    │                                                         │
    │  OBSERVE: "The USA topped the 2024 medal table with    │
    │           126 total medals."                            │
    └─────────────────────────────────────────────────────────┘
  
    Iteration 2:
    ┌─────────────────────────────────────────────────────────┐
    │  REASON: "The winning country is the USA. Its capital  │
    │          is Washington, D.C. I need its population."    │
    │                                                         │
    │  ACT:    web_search("Washington D.C. population 2026")  │
    │                                                         │
    │  OBSERVE: "Washington, D.C. has an estimated            │
    │           population of 689,545."                       │
    └─────────────────────────────────────────────────────────┘
  
    Iteration 3 (Final):
    ┌─────────────────────────────────────────────────────────┐
    │  REASON: "I now have verified facts: the winning        │
    │          country is the USA, and its capital's          │
    │          population is 689,545."                        │
    │                                                         │
    │  ANSWER: "The USA won the most medals at the 2024       │
    │          Olympics. Its capital, Washington D.C., has    │
    │          a population of about 689,545."                │
    │                                                         │
    │  ✅ Every fact was VERIFIED by a real action,           │
    │     not guessed. The answer is correct and evidence-    │
      │     backed.                                             │
      └─────────────────────────────────────────────────────────┘
      ═══════════════════════════════════════════════════════════════
        THE COMPLETE ReAct LOOP PATTERN
      ═══════════════════════════════════════════════════════════════
      
        ┌─────────────────────────────────────────────────────────┐
        │                                                         │
        │  ┌───────────┐     ┌───────────┐     ┌───────────┐      │
        │  │  REASON   │ ──► │   ACT     │ ──► │  OBSERVE  │      │
        │  │           │     │           │     │           │      │
        │  │ "What do  │     │ Call a    │     │ Tool      │      │
        │  │ I need to │     │ tool:     │     │ returns   │      │
        │  │ find out? │     │ search,   │     │ real      │      │
        │  │ What's my │     │ code, API,│     │ data /    │      │
        │  │ plan?"    │     │ query     │     │ result    │      │
        │  └───────────┘     └───────────┘     └───────────┘      │
        │        ▲                                   │            │
        │        │                                   │            │
        │        └───────────── LOOP ────────────────┘            │
        │                                                         │
        │  Each cycle:                                             │
        │  • REASON: decide what to do next (based on what you    │
        │    know so far)                                          │
        │  • ACT: execute a tool call                              │
        │  • OBSERVE: get real information from the tool           │
        │  → Use the observation to reason again                  │
        │                                                         │
        │  STOP when:                                              │
        │  • The goal is reached (confident answer)               │
        │  • Max iterations hit (prevent infinite loop)           │
        │  • Irrecoverable error (fail gracefully)                │
        │                                                         │
          └─────────────────────────────────────────────────────────┘
```
