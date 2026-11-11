---
title: "Trunk-Based Development"
termSlug: "trunk-based-development"
year: 2026
month: 11
monthName: "November"
day: 10
order: 7
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Trunk-Based Development is a branching model. Developers merge small changes into one long-lived branch called trunk (usually main). Every change lands within hours. Incomplete work hides behind fe..."
---
### Definition:

**Trunk-Based Development** is a branching model. Developers merge small
changes into one long-lived branch called trunk (usually `main`). Every
change lands within hours. Incomplete work hides behind feature flags. The
trunk stays releasable at every commit.

The core rule is simple: no branch lives longer than a day. A developer
starts work in the morning and merges before going home. Review happens
before the merge. CI runs on every merge. If a change is too big, the
developer splits it into small steps.

WITHOUT vs WITH — when the team sees the change
──────────────────────────────────────────────────────────────────────────────

┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│ WITHOUT: long-lived branch       │      │ WITH: trunk + flags              │
│                                  │      │                                  │
│ start work on a branch           │      │ start work                       │
│ commit for 1 - 3 weeks           │      │ merge a small change, same day   │
│ merge to main at the end         │      │ CI runs the full test suite      │
│ fix conflicts under time         │      │ a flag hides incomplete code     │
│ pressure, then release           │      │ release any day                  │
└──────────────────────────────────┘      └──────────────────────────────────┘

BRANCH LIFETIME — the same feature in both models
──────────────────────────────────────────────────────────────────────────────
  long branch   ●═════════════════════════════════════════════════════════●
                day 1                                                day 14
                team sees the change once: at the merge

  trunk         ●─●─●─●─●─●─●─●─●─●─●─●─●─●
                one merge per day, every diff stays small

Three practices make this work together. Remove any one of them and the
model fails.

 1. SMALL CHANGES. One task = one merge. Big changes split into steps.
    Each step keeps the system green.
 2. FEATURE FLAGS. New code merges into trunk while it is still
    incomplete. A flag turns the code on for users. A flag also turns it
    off in one second when a defect appears.
 3. STRONG CI. Every merge runs the full test suite and deploys to a
    test environment. A red build blocks the next merge.

Why teams pick this model. Long-lived branches hide work and hide risk.
The team sees the change only at the merge. By then the code is weeks old
and other people have moved the same files. Trunk-Based moves the pain
forward: you fix a small conflict on day one instead of a huge conflict
on day thirty. It also supports continuous delivery, because the trunk
can ship any day.

The cost is real, so keep the trade-offs honest. Every developer needs
the whole test suite green before merge, so slow CI hurts. Feature flags
create debt: a forgotten flag rots and confuses the next reader. Teams
schedule flag clean-up work and treat an old flag as a defect. Small
teams feel this cost less. Large teams feel it more, and they buy speed
with automation.

A quick way to know where you stand: measure the age of your branches.
Branches that live for hours fit this model. Branches that live for
weeks do not.

### Example:

Scenario: a payment team rebuilds the checkout page. The work takes two
weeks. The team ships it with one flag, `checkout_v2`, set to OFF at
first merge.

FLOW — two weeks, zero long-lived branches
──────────────────────────────────────────────────────────────────────────────

  time     action on trunk                         flag state
  ─────    ─────────────────────────────────────   ──────────
  day 1    dev1: new page skeleton, merge          OFF
           CI: 412 tests pass, staging deploy
  day 1    dev2: cart widget, merge                OFF
           CI: 418 tests pass
  day 2    dev3: payment form, merge               OFF
           CI: 420 tests pass
  ─────    ─────────────────────────────────────   ──────────
  day 6    team review on staging, found 3 bugs    OFF
           dev4 fixes each bug in one merge
  ─────    ─────────────────────────────────────   ──────────
  day 8    enable flag for 5% of users             ON 5%
           watch: error rate flat, conversion flat
  day 9    raise to 50%                            ON 50%
  day 10   raise to 100%                           ON 100%
  ─────    ─────────────────────────────────────   ──────────
  day 12   delete the flag and the old page        (removed)
           dead code leaves the codebase

Compare the alternative. In a branch model, the same two weeks look like
this:

  main     ●───────────────────────────────────────────────────────●
           │ ╲                                                     │
           │  ╲                                                    │
           │   ●═══════════════════════════════════════════════════●
           │      all conflicts and hotfixes land on day 14

In the trunk model the team sees the change every day. The risky merge
disappears. The risky part becomes the flag rollout, and that part has an
OFF switch. That is the whole point: merge small, ship dark, turn on
slowly, remove the flag fast.
