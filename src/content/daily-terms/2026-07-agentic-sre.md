---
title: "Agentic SRE"
termSlug: "agentic-sre"
year: 2026
month: 7
monthName: "July"
day: 27
order: 18
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "Agentic SRE (Site Reliability Engineering) is the evolution of traditional SRE practices to manage systems where AI agents autonomously operate, deploy, and troubleshoot infrastructure alongside hu..."
---
### Definition:

Agentic SRE (Site Reliability Engineering) is the evolution of traditional SRE practices to manage systems where AI agents autonomously operate, deploy, and troubleshoot infrastructure alongside humans. It's not about using AI to help SRE teams — it's about the SRE team treating AI agents as independent actors that need their own reliability guarantees, blast radius limits, observability, incident response protocols, and SLAs.

The fundamental shift: In traditional SRE, humans operate systems and occasionally make mistakes. In Agentic SRE, both humans AND AI agents operate systems — and agents operate at machine speed, at massive scale, and with unpredictable behavior patterns. The SRE team must now be reliable for the agents (the platform they depend on) and reliable despite the agents (the mistakes they make).

═══════════════════════════════════════════════════════════════
  THE SRE EVOLUTION
═══════════════════════════════════════════════════════════════

  SRE 1.0 (2000s)           SRE 2.0 (2010s)           AGENTIC SRE (2025+)
  ───────────────           ───────────────           ─────────────────
                                                                 
  Manual operations         Automated operations      Autonomous operations
  ─────────────────         ──────────────────        ─────────────────────
                                                                 
  Humans SSH into           Humans write scripts       Humans set policies.
  servers to:               and tools to:              AI agents execute:
  • Deploy code             • Auto-scale                 • Auto-diagnose
  • Restart services        • Self-heal                    incidents
  • Rotate logs             • Automated rollback         • Deploy fixes
  • Page on-call            • Canary deployments        • Optimize infra
  • Run runbooks            • Runbook automation        • Triage alerts
                                                         • Self-remediate
  Key principle:            Key principle:              Key principle:
  "Everything manual"       "Automate everything"       "Govern everything
                                                         autonomous"
                          
  Error budget:             Error budget:               Error budget:
  Human error               Automation bugs             Agent misbehavior
  is expected.              are expected.               is expected AND
                                                         harder to predict.

### Example:

A visual comparison of how Traditional SRE vs. Agentic SRE handles the same scenario — a production incident where a new deployment causes increased error rates.

```
A canary deployment of "payment-service v2.3" causes a 5% increase in 500 errors. The system must respond within 3 minutes to stay within the error budget.

═══════════════════════════════════════════════════════════════
  TRADITIONAL SRE (Humans + Scripted Automation)
═══════════════════════════════════════════════════════════════

  Timeline:
  ─────────

  14:00  ──>  Canary deployment starts (5% traffic)

  14:02  ──>  Prometheus detects: error_rate > threshold
              → Alert fires
              → PagerDuty pages on-call SRE
  
  14:04  ──>  SRE wakes up, acknowledges alert
              → Opens Grafana dashboard
              → Checks: "Is it the canary or the stable?"

  14:06  ──>  Identifies canary as the culprit
              → Checks if automated rollback is safe
              → Verifies database schema hasn't changed

  14:08  ──>  Executes rollback script:
              `kubectl rollout undo
              deployment/payment-service`
              
                14:10  ──>  Rollback completes
                            → Error rate returns to baseline
                            → SRE starts postmortem notes
              
                Total time to resolution: ~10 minutes
                Blast radius: 5% of traffic affected (10,000+ failed requests)
                Engineer hours consumed: 2 (SRE + follow-up)
              
                Key properties:
                ✅ Human-in-the-loop for all decisions
                ❌ Slow response (10 minutes vs. sub-minute agent speed)
                ❌ Wakes humans up at 2 AM for routine rollbacks
                ❌ Error budget consumed: 5% × 10 min = significant
                ═══════════════════════════════════════════════════════════════
                  AGENTIC SRE (Humans Set Policy, Agents Execute)
                ═══════════════════════════════════════════════════════════════
                
                  The SRE team defines these policies IN ADVANCE:
                
                  ┌─────────────────────────────────────────────────────────┐
                  │                                                         │
                  │  Policy: "Automated Canary Management"                  │
                  │  ─────────────────────────────────────                   │
                  │                                                         │
                  │  1. Canary gets 5% traffic for 5 minutes                │
                  │  2. Monitor: error_rate, p95_latency, success_rate      │
                  │  3. IF error_rate increases >3%  → AUTO-ROLLBACK       │
                  │  4. IF p95 latency increases >200ms → AUTO-ROLLBACK     │
                  │  5. ROLLBACK = revert to previous stable version        │
                  │  6. AFTER rollback → notify humans (Slack/PagerDuty)    │
                  │  7. ALWAYS log the agent's reasoning + actions          │
                  │  8. NEVER rollback more than 1 version without human    │
                  │                                                         │
                  └─────────────────────────────────────────────────────────┘
                
                  Timeline:
                  ─────────
                
                  14:00  ──>  Canary deployment starts (5% traffic)
                
                  14:02  ──>  Observability agent detects: error_rate 5% ↑
                              → Evaluates against policy
                              → Policy condition met (error > 3%)
                              → Decision: initiate rollback
                
                  14:02:15 ─> Rollback agent executes:
                              → Verifies the previous version is healthy
                              → Executes `kubectl rollout
                              undo`
                                            → Confirms rollback completed successfully
                              
                                14:02:30 ─> Notifications agent sends:
                                            → Slack: "payment-service v2.3 auto-rolled back.
                                                      Reason: 5% error rate increase.
                                                      Incident: INC-2026-0727-001"
                                            → PagerDuty: LOW urgency notification
                                              (not a page — just a notification)
                              
                                Total time to resolution: ~30 seconds
                                Blast radius: 5% of traffic for 2.5 minutes (~500 failed requests)
                                Engineer hours consumed: 0 (agent handled everything)
                              
                                Key properties:
                                ✅ Sub-minute response (30s vs. 10 min)
                                ✅ No human woken up for routine rollback
                                ✅ Full audit trail of agent's reasoning
                                ✅ Error budget impact: negligible
```
