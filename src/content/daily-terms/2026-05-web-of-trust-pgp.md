---
title: "Web of Trust (PGP)"
termSlug: "web-of-trust-pgp"
year: 2026
month: 5
monthName: "May"
day: 7
order: 5
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "The Web of Trust is a decentralized model for verifying the authenticity of public keys in PGP (Pretty Good Privacy) and OpenPGP systems. Instead of relying on a single central authority—like a tra..."
---
### Definition:

The Web of Trust is a decentralized model for verifying the authenticity of public keys in PGP (Pretty Good Privacy) and OpenPGP systems. Instead of relying on a single central authority—like a traditional Certificate Authority (CA) that vouches for every website—trust is established by individuals who personally verify each other’s identities and then cryptographically sign each other’s public keys. These one-to-one attestations link together into a mesh, or “web,” where trust can flow transitively: if Alice trusts Bob, and Bob has signed Carol’s key, Alice can decide whether to trust Carol.

Simple Analogy
Imagine a social network of handshakes and introductions.

In a centralized system (like a government ID bureau), one office confirms everyone’s identity.
In the Web of Trust, you walk into a room full of professionals. You check Bob’s passport yourself and give him your business card that says, “I vouch for Bob.” Later, Bob meets Carol and gives her his card saying, “I vouch for Carol.” When you later receive an email from Carol, you see Bob’s vouching card attached to her name, so you feel confident she is who she claims to be—even though you never met her yourself.

### Example:

The Developer Meetup
Alice runs an open-source project and uses PGP to sign its software releases. At a conference, she meets three other developers:

```
Person	Action
Alice	Verifies Bob's government ID face-to-face and signs his public key with her own.
Bob	Later meets Carol over video call, verifies her identity, and signs her public key.
Carol	Publishes a patch to Alice's project.
How the web works in practice:

Direct Trust: Alice has Bob’s signed key in her keyring. She knows 0xBob1234 belongs to the real Bob because she verified it personally.
Transitive Trust: Bob has signed Carol’s key. Alice’s PGP client sees that Carol’s key carries Bob’s signature.
Alice’s Decision: Because Alice has marked Bob as a trusted introducer, her software calculates: “I trust Bob, and Bob vouches for Carol → I will accept Carol’s key as valid.”
When Carol emails Alice a patch signed with her private key, Alice’s client verifies it against Carol’s public key, sees Bob’s chain of trust, and flags the message as authentic—without Alice ever needing to meet Carol or rely on a central server.

Why It Matters
Resilience: There is no single point of failure. If one key is compromised, the rest of the web remains intact.
Privacy & Freedom: Anyone can participate without paying a corporation or yielding control to a government-run ID system.
Trade-off: It demands personal responsibility. If you blindly trust signatures from strangers, the “web” becomes a house of cards.
```
