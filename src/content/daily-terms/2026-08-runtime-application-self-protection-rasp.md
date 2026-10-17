---
title: "Runtime Application Self-Protection(RASP)"
termSlug: "runtime-application-self-protection-rasp"
year: 2026
month: 8
monthName: "August"
day: 20
order: 14
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "RASP (Runtime Application Self-Protection) is a security technology that is embedded directly into an application and monitors its runtime behavior in real-time to detect and block attacks from ins..."
---
### Definition:

RASP (Runtime Application Self-Protection) is a security technology that is embedded directly into an application and monitors its runtime behavior in real-time to detect and block attacks from inside the application itself. Instead of standing outside the app (like a firewall or WAF that inspects traffic before it reaches the app), RASP lives inside the application, watching how it executes, and can stop attacks at the exact moment they happen.

The key difference from traditional security tools: RASP has context. A firewall sees requests and patterns; RASP sees what the application is actually doing with those requests — which functions it calls, what data it accesses, whether input is being used in a dangerous way. This lets RASP catch attacks that signature-based tools miss, with far fewer false positives.

RASP vs. TRADITIONAL SECURITY:
═══════════════════════════════════════════════════════════════

  TRADITIONAL SECURITY (Outside the app):

  ┌───────────────┐        ┌──────────────────┐       ┌──────────┐
  │   Attacker    │ ─────► │  FIREWALL / WAF  │ ────► │   APP    │
  └───────────────┘        └──────────────────┘       └──────────┘
                             ▲                          
                             │  inspects traffic      
                             │  at the network edge   
                             │  (blocked or passed)   
                             │                         
                             │  Problem: the WAF      
                             │  can't see what the    
                             │  app does INSIDE with  
                             │  the traffic it passes 
                             │                        
                             └──────────────────────── 

  RASP (Inside the app):

  ┌───────────────┐        ┌──────────────────────────────┐
  │   Attacker    │ ─────► │  APP with RASP EMBEDDED      │
  └───────────────┘        │  ┌────────────────────────┐  │
                           │  │  [Business logic]      │  │
                           │  │  [Database queries]    │  │
                           │  │  [File access]         │  │
                           │  │  [Input handling]      │  │
                           │  │      ▲                 │  │
                           │  └──────┼─────────────────┘  │
                           │         │ RASP monitors the  │
                           │         │ app's runtime      │
                           │         │ behavior and can   │
                           │         │ BLOCK attacks live │
                           │         └────────────────────│
                           └──────────────────────────────┘

### Example:

A visual comparison of how a WAF vs. RASP handles two real attacks.

```
SQL Injection Attack
═══════════════════════════════════════════════════════════════
  THE ATTACK: A user submits: username = "' OR '1'='1"
  (designed to bypass the login and dump the database)
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  THE REQUEST REACHES THE APP:                           │
  │  login(username: "' OR '1'='1", password: "x")         │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  WAF (Outside the app):
  ─────────────────────
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  WAF sees: "' OR '1'='1" — matches a known SQL          │
  │  injection signature → BLOCKS it at the edge.           │
  │                                                         │
  │  ✅ Good IF the signature matches (common case)         │
  │  ❌ But if the attacker OBFUSCATES it (e.g. "' OR       │
  │     '1'='1' /*" or encoding tricks), the WAF may miss   │
  │     it — signatures can be bypassed.                    │
  │  ❌ WAF also generates false positives (blocks legit     │
  │     input that LOOKS like an attack)                    │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  RASP (Inside the app):
  ─────────────────────
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  RASP watches the app BUILD the SQL query:              │
  │  SELECT * FROM users WHERE username = "' OR '1'='1"    │
  │                                                         │
  │  RASP detects: "The query's WHERE clause was changed    │
  │  by user input — this is a SQL injection ATTEMPT."      │
  │                                                         │
    │  RASP ACTION: BLOCKS the query and the request.         │
    │  It doesn't rely on a signature — it sees the actual    │
    │  dangerous query being constructed and stops it.        │
    │                                                         │
    │  ✅ Catches obfuscated attacks (doesn't need signature) │
    │  ✅ Far fewer false positives (has full context)        │
    │  ✅ Blocks at the exact moment of the attack             │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```
