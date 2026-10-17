---
title: "ASPA (Autonomous System Provider Authorization)"
termSlug: "aspa-autonomous-system-provider-authorization"
year: 2026
month: 3
monthName: "March"
day: 16
order: 11
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "ASPA (Autonomous System Provider Authorization) is a cryptographic security mechanism for BGP (Border Gateway Protocol) that allows an Autonomous System (AS) to publicly declare which upstream prov..."
---
### Definition:

ASPA (Autonomous System Provider Authorization) is a cryptographic security mechanism for BGP (Border Gateway Protocol) that allows an Autonomous System (AS) to publicly declare which upstream providers are authorized to advertise its routes — preventing route hijacking and path manipulation attacks in internet routing.

ASPA is a signed declaration that says: "These and only these are my legitimate upstream providers — don't trust anyone else claiming to route traffic on my behalf."

Key Concepts First
| Term | Meaning |
|------|---------|
| AS (Autonomous System) | A network under a single organization's control (e.g. Google = AS15169) |
| BGP | The protocol that routers use to share routing information across the internet |
| Upstream Provider | An ISP or network that carries your traffic toward the internet |
| Route Hijack | An attacker falsely announces they can route traffic to your IP addresses |
| RPKI | Resource Public Key Infrastructure — the cryptographic foundation ASPA builds on |

Simple Analogy
📦 Imagine you run a small shipping business and you only use FedEx and UPS as your authorized carriers. ASPA is like a notarized public declaration:
"Only FedEx and UPS are authorized to carry packages on my behalf."

If a stranger shows up claiming to deliver your packages through a back-alley courier — other businesses can verify your declaration and reject the unauthorized carrier immediately.

### Example:

Imagine SmallCorp (AS64496) is a company with internet connectivity through two ISPs:

SmallCorp's network setup:

- Primary ISP: FastNet (AS64497)
- Backup ISP: ReliNet (AS64498)

```
# ASPA Record (simplified representation)
{
  "customer-as": 64496,
  "provider-set": [
    64497,   # FastNet — authorized ✅
    64498    # ReliNet — authorized ✅
  ],
  "signature": "RPKI-signed-by-AS64496-private-key"
}

Published to RPKI → globally visible to all routers

BGP path: SmallCorp(64496) → FastNet(64497) → Tier1(64500)

Validation:
  Is FastNet(64497) in SmallCorp(64496)'s ASPA? ✅ YES
  Path is VALID ✅

Result: Traffic flows normally 🟢

Malicious network BadAS (AS99999) announces:
"I have a route to SmallCorp (AS64496)!"

BGP path seen by internet routers:
SmallCorp(64496) → BadAS(99999) → ...

Validation:
  Is BadAS(99999) in SmallCorp(64496)'s ASPA? ❌ NO
  Authorized providers are ONLY [64497, 64498]

Result: Path marked INVALID ❌
        Route REJECTED 🚫
        SmallCorp's traffic NOT hijacked ✅
```
