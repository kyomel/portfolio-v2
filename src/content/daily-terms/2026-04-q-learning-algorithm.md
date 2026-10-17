---
title: "Q-Learning Algorithm"
termSlug: "q-learning-algorithm"
year: 2026
month: 4
monthName: "April"
day: 23
order: 15
source: "2026/apr-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/apr-term.md"
excerpt: "Q-Learning is a model-free, off-policy reinforcement learning algorithm that teaches an agent to make optimal decisions in an environment by learning a Q-value function — a table or approximation t..."
---
### Definition:

Q-Learning is a model-free, off-policy reinforcement learning algorithm that teaches an agent to make optimal decisions in an environment by learning a Q-value function — a table or approximation that assigns a numerical score to every possible (state, action) pair — representing "how much total future reward can I expect if I take this action in this state and then act optimally from that point forward?" — where the agent explores the environment, receives rewards and penalties, and iteratively updates these scores using the Bellman Equation until the Q-values converge to their true optimal values, at which point the agent always knows the best action to take in any situation without ever needing a model of how the environment works.

Q-Learning does not plan ahead by simulating the future — it learns from experience, updating its estimates of action quality every time it takes a step, receives a reward, and observes where it ends up — gradually building a complete map of "what is the best thing I can do from here?" for every possible situation it might encounter.

Background — Why Q-Learning Exists

The Core Reinforcement Learning Problem:

  An agent exists in an environment:
    → It observes its current STATE
    → It chooses an ACTION
    → The environment gives it a REWARD (+ or -)
    → It moves to a new STATE
    → Repeat — forever

  Goal: learn to choose actions that MAXIMIZE
        total accumulated reward over time

  The challenge:
    Agent doesn't know the rules of the environment
    Agent doesn't know which actions lead where
    Agent doesn't know which actions give rewards
    Agent must DISCOVER all of this by trying things

  Why not just try everything and memorize results?
    States can be infinite (chess: 10^47 possible positions)
    Cannot try every state-action pair in a lifetime
    Need to GENERALIZE from limited experience

  Why not just follow a hardcoded strategy?
    Environment may change
    Optimal strategy may not be obvious to a human
    Agent needs to DISCOVER strategies humans didn't think of

  Q-Learning solution:
    Maintain a score for every (state, action) pair
    Update scores based on actual experience
    Always pick the action with the highest score
    Scores gradually converge to optimal values ✅

### Example:

Teaching an Agent to Navigate a Maze
A robot must learn to navigate a grid maze from start to goal, avoiding walls and traps, using only experience — no map, no instructions.

```
# Inspecting what the agent learned

# ── Q-Table After Training ───────────────────────────────────
print("\nQ-Table (rounded to 2 decimal places):")
print(f"{'State':<10} {'UP':>8} {'DOWN':>8} {'LEFT':>8} {'RIGHT':>8} {'Best':>8}")
print("-" * 55)

action_names = {0:"UP", 1:"DOWN", 2:"LEFT", 3:"RIGHT"}

for r in range(5):
    for c in range(5):
        state_idx  = r * 5 + c
        q_vals     = agent.q_table[state_idx]
        best_action= action_names[np.argmax(q_vals)]
        print(
            f"({r},{c})     "
            f"{q_vals[0]:>8.2f}"
            f"{q_vals[1]:>8.2f}"
            f"{q_vals[2]:>8.2f}"
            f"{q_vals[3]:>8.2f}"
            f"  → {best_action}"
        )

# Output (approximate — varies by run):
# State         UP    DOWN    LEFT   RIGHT    Best
# ───────────────────────────────────────────────────────
# (0,0)       1.23    3.45    0.82    8.91  → RIGHT
# (0,1)       2.11    4.23    1.95   12.43  → RIGHT
# (0,2)       1.88   15.67    3.21    0.00  → DOWN
# (0,3) [WALL — low values across all actions]
# (0,4)       0.45   18.92    0.31    0.11  → DOWN
# (1,0)       3.12    5.44    0.94    9.87  → RIGHT
# (1,1) [WALL]
# (1,2)       4.55   22.31    8.12    6.23  → DOWN
# (1,3)       6.78   19.44   11.23    8.91  → DOWN
# (1,4)       5.12   28.54    4.33    0.22  → DOWN
# (2,0)       7.23    0.12    0.55   12.44  → RIGHT
# (2,1)      12.34   -8.44    2.11   18.92  → RIGHT
# (2,2) [TRAP — negative values: agent learned to avoid]
# (2,3) [WALL]
# (2,4)      15.67   38.91    9.23    0.11  → DOWN
# (3,0)      11.23    0.34    0.78   19.44  → RIGHT
# (3,1) [WALL]
# (3,2)      22.31    0.22   15.44   28.54  → RIGHT
# (3,3)      28.54    0.11   19.44   38.91  → RIGHT
# (3,4)      32.44   55.23   22.31    0.12  → DOWN
# (4,0)       0.00    0.00    0.00   28.54  → RIGHT
# (4,1)       0.00    0.00   22.31   38.91  → RIGHT
# (4,2)       0.00    0.00   32.44   55.23  → RIGHT
# (4,3) [WALL]
# (4,4) [GOAL — all zeros, terminal state]

# ── Learned Optimal Policy ───────────────────────────────────
print("\nOptimal Policy (best action per cell):")
print("  0     1     2     3     4")
policy = agent.get_policy(action_names)

policy_symbols = {"UP":"↑","DOWN":"↓","LEFT":"←","RIGHT":"→"}
for r in range(5):
    row_str = f"{r} "
    for c in range(5):
        pos = (r, c)
        if pos == (4,4):       row_str += "  G  "
        elif pos in env.walls: row_str += "  W  "
        elif pos in env.traps: row_str += "  T  "
        else:
            action = policy.get(pos, "?")
            row_str += f"  {policy_symbols.get(action,'?')}  "
    print(row_str)

# Output:
#   0     1     2     3     4
# 0  →     →     ↓     W     ↓
# 1  →     W     ↓     ↓     ↓
# 2  →     →     T     W     ↓
# 3  →     W     →     →     ↓
# 4  →     →     →     W     G

# Optimal path: (0,0)→→→(0,2)↓(1,2)↓(2,2) — WAIT!
# Agent learned to GO AROUND the trap ✅
# Path: (0,0)→(0,1)→(0,2)↓(1,2)↓(1,3)↓(1,4)↓(2,4)↓(3,4)↓(4,4)
# Trap at (2,2) avoided entirely — agent discovered this ✅
```
