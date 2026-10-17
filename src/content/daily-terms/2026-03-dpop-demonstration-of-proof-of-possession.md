---
title: "DPoP (Demonstration of Proof-of-Possession)"
termSlug: "dpop-demonstration-of-proof-of-possession"
year: 2026
month: 3
monthName: "March"
day: 12
order: 9
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "DPoP (Demonstrating Proof-of-Possession) is an OAuth 2.0 security extension defined in RFC 9449 that cryptographically binds access tokens to a specific client using a public/private key pair — so..."
---
### Definition:

DPoP (Demonstrating Proof-of-Possession) is an OAuth 2.0 security extension defined in RFC 9449 that cryptographically binds access tokens to a specific client using a public/private key pair — so that even if a token is stolen, it's useless without the matching private key.

Traditional bearer tokens are like hotel key cards — anyone who finds one can open the door. DPoP adds a fingerprint scanner — the key card only works if you are the one holding it.

The Problem DPoP Solves
Standard Bearer Tokens have a fundamental flaw:

Bearer Token philosophy:
"Whoever HOLDS the token IS authorized"

Attacker steals token from network/logs/storage
↓
Attacker replays token to your API
↓
API accepts it — no way to tell it's stolen ❌
A bearer token is like cash — whoever has it can spend it, no questions asked.

### Example:

Token Theft Prevented

```
1. User logs in with DPoP:
   → Generates key pair (public + private)
   → Receives access_token BOUND to their public key

2. Attacker steals the access_token "abc123xyz"

3. Attacker tries to use it:
   GET /api/user/profile
   Authorization: DPoP abc123xyz
   DPoP: ??? ← attacker has NO private key to sign this!

4. API server checks:
   → Is token valid? ✅ Yes
   → Is DPoP proof present? ❌ No valid proof!
   → Access DENIED ✅

Stolen token is completely USELESS without the private key. 🔐
```
