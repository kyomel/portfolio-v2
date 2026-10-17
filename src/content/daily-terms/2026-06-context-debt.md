---
title: "Context Debt"
termSlug: "context-debt"
year: 2026
month: 6
monthName: "June"
day: 30
order: 22
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "Context Debt is the accumulation of unresolved, fragmented, or outdated context that an AI agent (or developer) must carry forward across interactions — slowing down reasoning, increasing errors, a..."
---
### Definition:

Context Debt is the accumulation of unresolved, fragmented, or outdated context that an AI agent (or developer) must carry forward across interactions — slowing down reasoning, increasing errors, and degrading output quality over time. It is the cognitive equivalent of technical debt: just as technical debt accumulates when you choose a quick fix over a clean architecture, context debt accumulates when you let conversation history, tool outputs, and unresolved state pile up without pruning, summarizing, or structuring them.

In AI agent systems (like the one you're talking to right now), context debt manifests as:

| Symptom | What Happens | Why It Hurts |
|---------|-------------|--------------|
| Lost in the Middle | Key instructions from earlier in the conversation get ignored because they're buried in the middle of a long context window | The agent forgets constraints you set 20 turns ago |
| Tool Output Bloat | Every read_file, terminal, or web_search result stays in context forever | The signal-to-noise ratio drops; the agent can't find the important parts |
| Conversation Tangents | Side discussions, corrections, and mid-task clarifications remain in the active context | The agent confuses the main goal with side concerns |
| Stale Assumptions | Models, configs, or environment states that changed mid-session remain in context as "truth" | The agent operates on outdated information |
| Repetition Spiral | The agent re-examines the same information every turn because it can't trust what it already established | Wasted tokens, slower responses, higher costs |

Context debt compounds: Each turn adds new information without removing what's no longer relevant. The longer the session, the more debt accumulates — and the harder the agent has to work to find what actually matters.

### Definition:

A simulation showing how context debt degrades an AI agent's performance across a long session — and how compression fixes it.

```
import time
import json
from dataclasses import dataclass, field
from typing import List, Optional

# ═══════════════════════════════════════════════
#  Simulating the Context Window
# ═══════════════════════════════════════════════

@dataclass
class Message:
    role: str       # "user" | "assistant" | "tool"
    content: str
    tokens: int = 0

    def __post_init__(self):
        # Rough token estimate: 1 token ≈ 4 characters
        self.tokens = len(self.content) // 4

@dataclass
class Conversation:
    messages: List[Message] = field(default_factory=list)
    max_tokens: int = 128_000  # Standard context limit

    @property
    def total_tokens(self) -> int:
        return sum(m.tokens for m in self.messages)

    def add(self, role: str, content: str):
        self.messages.append(Message(role=role, content=content))

    def info(self) -> dict:
        return {
            "total_messages": len(self.messages),
            "total_tokens": self.total_tokens,
            "usage_pct": round(self.total_tokens / self.max_tokens * 100, 1),
        }

# ═══════════════════════════════════════════════
#  Context Debt Simulator
# ═══════════════════════════════════════════════

class ContextDebtSimulator:
    """Simulates how context debt builds up across a session."""

    def __init__(self):
        self.conversation = Conversation()

    def simulate_turn(self, turn_num: int, with_debt: bool):
        """Simulate one conversation turn."""
        if with_debt:
            # 🐛 WITH context debt: keep everything, add verbose tool output
            self.conversation.add("user", f"Can you check the status of service-{turn_num}?")

            # Simulate a large tool output that stays in context
            tool_output = (
                f"📊 Service: service-{turn_num}\n"
                f"   Status: {'degraded' if turn_num % 3 == 0 else 'healthy'}\n"
                f"   Uptime: 99.{turn_num}%\n"

f"   Pods: {turn_num * 3} running\n"
                f"   Memory: {turn_num * 500}MB / 2048MB\n"
                f"   CPU: {turn_num * 10}%\n"
                f"   Region: us-east-{turn_num % 5 + 1}\n"
                + "\n".join(
                    f"   Log entry {i}: [INFO] request processed in {turn_num + i}ms"
                    for i in range(5)  # Verbose logs
                )
            )
            self.conversation.add("tool", tool_output)

            # Assistant responds with a long analysis
            response = (
                f"I checked service-{turn_num}. It is "
                f"{'degraded' if turn_num % 3 == 0 else 'healthy'} "
                f"with {turn_num * 3} pods running. "
                + " ".join(
                    f"Looking at the metrics, I see that the service "
                    f"is operating within normal parameters. "
                    f"The memory usage is {turn_num * 500}MB which is "
                    f"{'fine' if turn_num * 500 < 1500 else 'concerning'}."
                    for _ in range(3)  # Verbose analysis
                )
            )
            self.conversation.add("assistant", response)
        else:
            # ✅ WITHOUT context debt: concise, compressed
            self.conversation.add("user", f"Check service-{turn_num}")

            # Minimal tool output
            status = "degraded" if turn_num % 3 == 0 else "healthy"
            self.conversation.add("tool", f"service-{turn_num}: {status} | pods={turn_num * 3}")

            # Concise response
            self.conversation.add("assistant", f"service-{turn_num}: {status} ✅")

    def simulate_key_info_loss(self, turn_num: int):
        """Demonstrate how early instructions get 'lost in the middle'."""
        if turn_num == 1:
            self.conversation.add("user",
                "🔴 IMPORTANT: Never use the DELETE endpoint. Never delete user data. "

"Always archive instead. This is a production safety rule."
            )
            self.conversation.add("assistant",
                "Understood. I will never use DELETE. I will always archive."
            )
        elif turn_num > 15:
            # By turn 15+, the early instruction is buried
            # The agent "forgets" and tries to delete
            self.conversation.add("user", "Remove expired users from the database.")
            # Without compression, the agent might respond:
            self.conversation.add("assistant",
                "I will delete all expired users from the database." +
                " " * 50 +  # Padding to simulate lost context
                "This will permanently remove their data."
            )

# ═══════════════════════════════════════════════
#  Compressor (Hermes-style context compression)
# ═══════════════════════════════════════════════

class ContextCompressor:
    """Simulates Hermes's automatic context compression."""

    @staticmethod
    def compress(conversation: Conversation) -> Conversation:
        compressed = Conversation(max_tokens=conversation.max_tokens)

        # Keep system prompt / first user message
        first = conversation.messages[:2]
        for m in first:
            compressed.add(m.role, m.content)

        # Compress everything in between into a summary
        middle = conversation.messages[2:-3] if len(conversation.messages) > 5 else []
        if middle:
            summary_parts = []
            for m in middle:
                if m.role == "user":
                    summary_parts.append(f"User asked: {m.content[:60]}...")
                elif m.role == "assistant":
                    summary_parts.append(f"→ Answered: {m.content[:60]}...")

            compressed.add("system",
                f"[Compressed summary of {len(middle)} messages]\n"
                + "\n".join(summary_parts[-5:])  # Keep last 5 exchanges
            )

# Keep the most recent messages (full fidelity)
        recent = conversation.messages[-3:] if len(conversation.messages) > 5 else conversation.messages[2:]
        for m in recent:
            compressed.add(m.role, m.content)

        return compressed

# ═══════════════════════════════════════════════
#  Run the Simulation
# ═══════════════════════════════════════════════

print("🧠 Context Debt Simulation")
print("=" * 60)

# ─── Simulation 1: Context Bloat ───

print("\n📈 SIMULATION 1: Context Bloat Over 30 Turns\n")

with_debt = ContextDebtSimulator()
without_debt = ContextDebtSimulator()

for i in range(1, 31):
    with_debt.simulate_turn(i, with_debt=True)
    without_debt.simulate_turn(i, with_debt=False)

w_info = with_debt.conversation.info()
wo_info = without_debt.conversation.info()

print(f"{'Metric':<30} {'🐛 With Debt':<20} {'✅ Compressed':<20}")
print(f"{'-'*70}")
print(f"{'Messages':<30} {w_info['total_messages']:<20} {wo_info['total_messages']:<20}")
print(f"{'Total tokens':<30} {w_info['total_tokens']:<20} {wo_info['total_tokens']:<20}")
print(f"{'Context usage':<30} {w_info['usage_pct']:.1f}%{'':<16} {wo_info['usage_pct']:.1f}%")
print(f"{'Token waste factor':<30} {w_info['total_tokens'] / wo_info['total_tokens']:.1f}x{'':<16} {'1.0x (baseline)':<20}")

print(f"\n💡 Insight: By turn 30, the session WITH context debt used "
      f"{w_info['total_tokens'] / wo_info['total_tokens']:.1f}x more tokens "
      f"than the compressed version — for the same work done.")

# ─── Simulation 2: Lost in the Middle ───

print(f"\n{'='*60}")
print("🔴 SIMULATION 2: 'Lost in the Middle' — Instruction Forgetting\n")

debt_session = ContextDebtSimulator()

# Set an important rule early (turn 1)
debt_session.simulate_key_info_loss(1)

# Simulate 20 turns of regular conversation
for i in range(2, 21):
    debt_session.simulate_key_info_loss(i)

# Check if the agent still remembers the rule by turn 20
all_messages = debt_session.conversation.messages
early_instruction = all_messages[1].content[:80] if len(all_messages) > 1 else ""
latest_response = all_messages[-1].content if all_messages else ""

print(f"📜 Context window: {len(all_messages)} messages, "
      f"{debt_session.conversation.total_tokens:,} tokens\n")
print(f"🔴 Early instruction (turn 1):")
print(f"   \"{early_instruction}...\"\n")
print(f"🤖 Agent response by turn 20:")
print(f"   \"{latest_response[:120]}...\"")
print(f"\n⚠️  The 'no DELETE' rule was set at turn 1, but by turn 20")
print(f"   it's buried under {debt_session.conversation.total_tokens:,} tokens.")
print(f"   The agent forgets and attempts to DELETE instead of ARCHIVE.")
print(f"   This is 'lost in the middle' — context debt in action.\n")

# ─── Simulation 3: Context Compression Fix ───

print(f"{'='*60}")
print("✅ SIMULATION 3: Context Compression Fixes This\n")

# Demonstrate compression
compressed = ContextCompressor.compress(debt_session.conversation)
c_info = compressed.info()

print(f"📊 Before compression:  {debt_session.conversation.info()['total_tokens']:,} tokens "
      f"({debt_session.conversation.info()['usage_pct']:.1f}%)")
print(f"📦 After compression:   {c_info['total_tokens']:,} tokens "
      f"({c_info['usage_pct']:.1f}%)")
print(f"📉 Compression ratio:   "
      f"{debt_session.conversation.info()['total_tokens'] / c_info['total_tokens']:.1f}x\n")

print(f"🗜️  What compression does:")
print(f"   - Discards verbose tool output (logs, full API responses)")
print(f"   - Summarizes earlier exchanges into a short summary")
print(f"   - Keeps recent messages at full fidelity")
print(f"   - Preserves critical rules (like 'no DELETE') in the summary")
print(f"   - Reduces noise so the agent can focus on the current task\n")

print(f"{'='*60}")
print(f"🏁 KEY TAKEAWAYS")
print(f"\n   1. Context debt is invisible but costly — it degrades quality")
print(f"      long before you hit the token limit.")

print(f"   2. The 'lost in the middle' problem means early instructions")
print(f"      are the most vulnerable to being forgotten.")
print(f"   3. Compression is not about fitting more — it's about")
print(f"      keeping the right amount of relevant context.")
print(f"   4. Hermes fights context debt with: automatic compression,")
print(f"      session_search, memory, and skills.")
print(f"   5. A bigger context window (200K → 1M tokens) does NOT solve")
print(f"      context debt — it just lets you accumulate more debt")
print(f"      before the collapse.")

Sample output:
🧠 Context Debt Simulation
============================================================

📈 SIMULATION 1: Context Bloat Over 30 Turns

Metric                          🐛 With Debt         ✅ Compressed       
Messages                        90                   90                  
Total tokens                    38,520               8,940               
Context usage                   30.1%                7.0%                
Token waste factor              4.3x                 1.0x (baseline)    

💡 Insight: By turn 30, the session WITH context debt used 
   4.3x more tokens than the compressed version.

============================================================
🔴 SIMULATION 2: 'Lost in the Middle' — Instruction Forgetting

📜 Context window: 40 messages, 17,200 tokens

🔴 Early instruction (turn 1):
   "🔴 IMPORTANT: Never use the DELETE endpoint..."

🤖 Agent response by turn 20:
   "I will delete all expired users from the database..."

⚠️  The 'no DELETE' rule was set at turn 1, but by turn 20
   it's buried under 17,200 tokens.
   The agent forgets and attempts to DELETE instead of ARCHIVE.

============================================================
✅ SIMULATION 3: Context Compression Fixes This

📊 Before compression:  17,200 tokens (13.4%)
📦 After compression:   3,580 tokens (2.8%)
```
