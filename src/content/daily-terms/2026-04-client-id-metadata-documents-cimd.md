---
title: "Client ID Metadata Documents (CIMD)"
termSlug: "client-id-metadata-documents-cimd"
year: 2026
month: 4
monthName: "April"
day: 28
order: 18
source: "2026/apr-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/apr-term.md"
excerpt: "Client ID Metadata Documents (CIMD) is an OAuth 2.0 identity mechanism — currently an IETF Internet-Draft (draft-ietf-oauth-client-id-metadata-document-01, by Aaron Parecki and Emelia Smith, adopte..."
---
### Definition:

Client ID Metadata Documents (CIMD) is an OAuth 2.0 identity mechanism — currently an IETF Internet-Draft (draft-ietf-oauth-client-id-metadata-document-01, by Aaron Parecki and Emelia Smith, adopted by the IETF OAuth Working Group in October 2025) — that fundamentally replaces pre-registration as the way OAuth clients identify themselves to authorization servers, by making the client_id itself a publicly-hosted HTTPS URL that resolves to a small, self-published JSON document containing the client's name, redirect URIs, grant types, and other metadata — so that any authorization server, anywhere, that has never seen this client before, can fetch that URL on demand and proceed directly into an OAuth flow without any prior registration, database entry, or coordination, anchoring trust not in a central registry but in DNS and TLS domain ownership — the same foundational trust mechanism the web has relied on for decades.

CIMD does not add a smarter registration system on top of OAuth — it eliminates the registration step entirely. Instead of an authorization server knowing about a client because someone filled out a form in a developer portal, it knows about a client because it can read a JSON file the client controls at its own domain. The trust comes not from a central authority saying "we know this client" — it comes from the fact that only the legitimate owner of my-agent.example.com can control what is served at that URL.

Background — Why CIMD Exists

The Core Problem: OAuth Client Identity at Scale

  Traditional OAuth requires clients to be KNOWN
  before they can participate in any flow:

  Old model:
    Client developer → logs into developer portal
                     → fills out registration form
                     → receives: client_id = "abc123xyz"
    Authorization server stores:
      client_id:     "abc123xyz"
      client_name:   "My App"
      redirect_uris: ["https://myapp.com/callback"]

    Every future auth request:
      client presents "abc123xyz"
      server looks up its own database
      finds the record → proceeds ✅

  This works when:
    ✅ You have ONE auth server (Google, GitHub)
    ✅ A human developer can fill out a form
    ✅ The ecosystem is small and controlled

  This FAILS completely when:
    ❌ An AI agent needs to connect to 100+ MCP servers
       each with a different authorization server
    ❌ A CLI tool needs OAuth without human setup
    ❌ An open federated ecosystem has thousands of clients
    ❌ No human is available to perform manual registration

### Example:

An AI Agent Connecting to Multiple MCP Servers
An AI coding agent needs to authenticate against dozens of different MCP servers — each with a different authorization server — without any pre-registration anywhere.

```
At scale: AI agent connecting to 100 MCP servers

                  Pre-Registration  DCR (RFC 7591)   CIMD
                  ────────────────────────────────────────────
Setup per server: Manual form       POST /register   NONE ✅
                  ❌ (impossible     (automated but
                  at scale)          creates problems)

Client_id per     Different per     Different per    ONE URL
auth server:      server ❌          server ❌         everywhere ✅

DB records        100 entries per   100 entries per  0 entries
created:          auth server ❌     auth server ❌    anywhere ✅

DoS surface:      None              Public write     None ✅
                                    endpoint ❌

Identity          By central        None — claimed   By DNS/TLS
verification:     registry          identity ❌       domain owner ✅

Client record     Manual deletion   No standard      N/A — no
cleanup:          required ❌        lifecycle ❌      records ✅

Scale to          ❌ Impossible      ⚠️ Operational   ✅ Works
100+ servers:                       chaos             natively

Enterprise        ✅ Works in       ❌ Barrier to     ✅ Preferred
adoption:         controlled env    adoption          default

Identity          Centralized       Centralized       Decentralized
trust model:      (auth server DB)  (auth server DB)  (DNS + TLS) ✅

Works without     ❌ Always needs   ❌ Needs runtime  ✅ Zero
prior contact:    pre-arrangement   POST handshake    prior contact ✅
```
