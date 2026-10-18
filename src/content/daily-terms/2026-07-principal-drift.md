---
title: "Principal Drift"
termSlug: "principal-drift"
year: 2026
month: 7
monthName: "July"
day: 16
order: 11
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "Principal Drift is the gradual separation between a human authority who authorized an action and the machine process that actually carried it out, in systems where AI agents operate autonomously or..."
---
### Definition:

Principal Drift is the gradual separation between a human authority who authorized an action and the machine process that actually carried it out, in systems where AI agents operate autonomously or semi-autonomously. The "principal" is the person or entity ultimately responsible for an action. "Drift" describes what happens when that responsibility becomes模糊 — stretched across a chain of agent calls, delegated tokens, and automated decisions until nobody can definitively answer the question: "Who is actually responsible for this?"

In traditional systems, the chain is simple: a human logs in, performs an action, and the audit log records "User X did Y at time Z." In agentic systems, the chain looks like this:

```text
TRADITIONAL SYSTEM:
───────────────────

  👤 Alice (human) ──🔑──> "Approve refund #1042"
                           │
                           ▼
                     ┌──────────┐
                     │ Audit    │
                     │ Log      │
                     │          │
                     │ Alice    │
                     │ approved │
                     │ refund   │
                     │ 1042     │
                     └──────────┘

  ✅ Clear accountability: Alice did it.

AGENTIC SYSTEM (WITH PRINCIPAL DRIFT):
───────────────────────────────────────

  👤 Alice (human)
      │
      │ "Process refund for customer Bob"
      ▼
  🤖 Refund Agent
      │
      │ (needs to check customer history)
      ▼
  🤖 CRM Agent
      │
      │ (needs access to billing system)
      ▼
  🤖 Billing Agent ──🔑──> Service Principal "billing-svc-v3"
                            │
                            ▼
                      ┌──────────┐
                      │ Audit    │
                      │ Log      │
                      │          │
                      │ billing- │
                      │ svc-v3   │
                      │ executed │
                      │ charge   │
                      │ $500     │
                      └──────────┘

  ❌ Audit says: "billing-svc-v3 charged $500"
  ❌ WHO actually authorized this? Alice? The Refund Agent?
     The CRM Agent? No one knows.
  ❌ The "principal" (Alice) and the "executor" (billing-svc-v3)
     have DRIFTED apart.
```

### Example:

A flow comparison of a customer refund processed without and with principal drift safeguards.

SCENARIO: A customer service rep (Alice) needs to process a $50 refund for Customer Bob. Her company uses an agentic AI system.

```text
═══════════════════════════════════════════════════════════════
  ❌ WITHOUT PRINCIPAL DRIFT GOVERNANCE
═══════════════════════════════════════════════════════════════

  Alice types in the agent chat:
  "Process a refund for Bob, order #1042"

  WHAT HAPPENS NEXT:

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  1. Alice's session is authenticated (good so far)      │
  │     ↓                                                   │
  │  2. Refund Agent receives the request                   │
  │     → It checks Bob's order history                     │
  │     → It calls CRM Agent for customer details           │
  │     ↓                                                   │
  │  3. CRM Agent queries the database                      │
  │     → Uses its own service account (crm-svc@company)    │
  │     → It calls Billing Agent to process refund          │
  │     ↓                                                   │
  │  4. Billing Agent executes the charge                   │
  │     → Uses its own API key (billing-svc-v3)             │
  │     → Charges $50 to Bob's credit card 💳               │
  │     ↓                                                   │
  │  5. Audit log records:                                  │
  │     "billing-svc-v3 charged $50 to order #1042"         │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  NOW ASK THE TOUGH QUESTIONS:

  Question                       Answer
  ──────────────────────────────────────────────────────────
  Who authorized the refund?     🤷 Audit says "billing-svc-v3"
                                 (a service account — not a person)

  What was the human's intent?   🤷 The agent system rephrased
                                 Alice's request — is "Process a
                                 refund" the same as "authorize"?
                                 ═══════════════════════════════════════════════════════════════
                                   ✅ WITH PRINCIPAL DRIFT GOVERNANCE (Flight Recorder)
                                 ═══════════════════════════════════════════════════════════════
                                 
                                   Alice types in the agent chat:
                                   "Process a refund for Bob, order #1042"
                                 
                                   WHAT HAPPENS — WITH FLIGHT RECORDER:
                                 
                                   ┌─────────────────────────────────────────────────────────┐
                                   │                                                         │
                                   │  Step 1: Identity Captured                               │
                                   │  ┌─────────────────────────────────────────────────┐    │
                                   │  │ 👤 Human Principal: Alice (alice@company.com)    │    │
                                   │  │ 🔑 Auth method: SAML/SSO session #8847          │    │
                                   │  │ 📋 Auth context: "Customer Service Agent —      │    │
                                   │  │    refund authority up to $100"                  │    │
                                   │  └─────────────────────────────────────────────────┘    │
                                   │                                                         │
                                   │  Step 2: Delegation Chain Preserved                     │
                                   │  ┌─────────────────────────────────────────────────┐    │
                                   │  │ Alice ──> Refund Agent (session #r-442)         │    │
                                   │  │   ├─ Intent: "Refund $50 for order #1042"       │    │
                                   │  │   ├─ Policy version: refund-policy-v3.2         │    │
                                   │  │   └─ Context: Bob reported damaged item         │    │
                                   │                                                         │
                                     └─────────────────────────────────────────────────────────┘
                                   
                                   
                                     NOW THE TOUGH QUESTIONS HAVE ANSWERS:
                                   
                                     Question                       Answer
                                     ──────────────────────────────────────────────────────────
                                     Who authorized the refund?     ✅ Alice — human principal
                                                                    recorded at the start.
                                   
                                     What was the human's intent?   ✅ "Refund $50 for damaged
                                                                    item" — preserved alongside
                                                                    the action.
                                   
                                     Was Alice authorized?          ✅ Yes — role-based policy
                                                                    check at delegation start:
                                                                    "refund authority up to $100"
                                   
                                     Can we prove Alice approved    ✅ Yes — intent + policy
                                     $50 and not $500?               snapshot captured before
                                                                    delegation.
                                   
                                     Can we reconstruct the         ✅ Full delegation chain
                                     full chain?                     recorded: Alice → Refund →
                                                                    CRM → Billing → execution.
                                                                    ═══════════════════════════════════════════════════════════════
                                                                      WHAT CAUSES PRINCIPAL DRIFT?
                                                                    ═══════════════════════════════════════════════════════════════
                                                                    
                                                                      1. STATELESS SESSION BOUNDARIES
                                                                      ─────────────────────────────
                                                                      Each new agent call creates a new session. The original
                                                                      user's identity is NOT automatically carried forward.
                                                                    
                                                                      Alice ──> Agent A ──> Agent B ──> Agent C
                                                                      👤        🤖          🤖          🤖
                                                                      (Alice)  (no Alice)  (no Alice)  (service principal)
                                                                    
                                                                      → The identity chain breaks at the first handoff.
                                                                    
                                                                    
                                                                      2. DELEGATED TOKENS WITHOUT CONTEXT
                                                                      ────────────────────────────────────
                                                                      Agent A gets a token from Alice's session. Agent A passes
                                                                      a NEW token to Agent B. Agent B passes ANOTHER token to
                                                                      Agent C.
                                                                    
                                                                      Each new token contains less context about the original
                                                                      human who started the chain.
                                                                    
                                                                      Token 1: "Alice, Customer Service, refund up to $100"
                                                                      Token 2: "session r-442, billing scope"
                                                                        Token 3: "billing-svc-v3"  ← Alice is GONE from the token
                                                                      
                                                                      
                                                                        3. PROMPTS AS DE FACTO POLICY
                                                                        ──────────────────────────────
                                                                        Limits on agent behavior are often encoded in system
                                                                        prompts, not in formal policy engines.
                                                                      
                                                                        "You are a billing agent. You can charge refunds up to $50."
                                                                      
                                                                        → This "policy" is invisible to auditors
                                                                        → It can be changed by editing a prompt, not a policy review
                                                                        → It's not captured in traditional IGA (Identity Governance
                                                                          and Administration) systems
                                                                      
                                                                      
                                                                        4. COMPOSED AGENT CHAINS
                                                                        ──────────────────────────
                                                                        Agents calling agents calling agents is the default
                                                                        architecture for complex agentic workflows. Each hop
                                                                        dilutes the original principal signal.
                                                                      
                                                                        Traditional IGA (Identity Governance) cannot represent
                                                                        a chain of agent calls at all — it only knows about
                                                                        the final service principal that touched the resource.
```
