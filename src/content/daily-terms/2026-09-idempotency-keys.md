---
title: "Idempotency Keys"
termSlug: "idempotency-keys"
year: 2026
month: 9
monthName: "September"
day: 8
order: 6
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "An idempotency key is a client-generated unique identifier sent with a mutating HTTP request (typically as an Idempotency-Key header on POST/PATCH) that lets the server recognize retries of the sam..."
---
### Definition:

An **idempotency key** is a client-generated unique identifier sent with a mutating HTTP request (typically as an `Idempotency-Key` header on `POST`/`PATCH`) that lets the server recognize retries of the *same logical operation* and answer them with the stored result — instead of executing the side effect again.

It exists because of a brutal asymmetry in networks: **a lost response does not mean the request never arrived.** HTTP gives you safe methods (`GET`, `PUT`, `DELETE` are idempotent by spec — repeating them is harmless) but `POST` is a "fire once" verb with no such guarantee. When a client times out, it cannot know whether the server committed the charge, booked the seat, or sent the email. So it retries — and "retry" is where duplicates are born. At-least-once delivery is the default of the real world; idempotency keys are how you survive it.

The name comes from algebra: an operation is *idempotent* when doing it twice equals doing it once (`f(f(x)) = f(x)`). The pattern does not literally make the operation run once — it makes the **system converge on one visible result**, no matter how many times the request arrives. That distinction ("deterministic convergence", not "exactly-once") is the whole game in distributed systems.

```text
NON-IDEMPOTENT POST — same request sent twice = side effect twice:
════════════════════════════════════════════════════════════════════

  CLIENT                          SERVER
    │ 1. POST /charge $50          │
    │────────────────────────────► │
    │                              │  charge $50    ┌───────────────┐
    │                              │───────────────►│ bank: -$50    │
    │ 2. response LOST             │                └───────────────┘
    │◄───────── network ✂ ──────── │  (client times out)
    │                              │
    │ 3. retry POST /charge $50    │
    │    (no key — looks identical)│
    │────────────────────────────► │
    │                              │  charge $50 AGAIN  ┌───────────────┐
    │                              │───────────────────►│ bank: -$50    │
    │◄──────────────────────────── │  200 OK            │ TOTAL: -$100  │
    │                              │                    └───────────────┘
    RESULT: one intent, two charges. The retry was "safe" from the
    client's view — it never saw a response — but the server could
    not tell the two requests apart.

IDEMPOTENT POST — same key = same logical operation:
════════════════════════════════════════════════════════════════════

  CLIENT                          SERVER
    │ 1. POST /charge $50          │
    │    Idempotency-Key: K-3f9a   │
    │────────────────────────────► │
    │                              │  key K-3f9a seen before?
    │                              │      │ NO
    │                              │      ▼
    │                              │  charge $50   ┌──────────────────────┐
    │                              │  save:        │ IDEMPOTENCY STORE    │
    │                              │  K-3f9a → 200 │ K-3f9a │ 200 {charge} │
    │ 2. response LOST             │               └──────────────────────┘
    │◄───────── network ✂ ──────── │  (client times out)
    │                              │
    │ 3. retry POST /charge $50    │
    │    SAME Idempotency-Key      │
    │────────────────────────────► │
    │                              │  key K-3f9a seen before?
    │                              │      │ YES ──► replay saved response
    │◄──────────────────────────── │  NO second charge!
    │  200 OK (replayed)           │
    RESULT: one intent, one charge, retries are free.

  ┌──────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: the server remembers the OUTCOME of a key, so a       │
  │  retry with that key is answered from memory, never re-executed. │
  └──────────────────────────────────────────────────────────────────┘
```

How it works in practice:

- **One key per intent.** The client mints a fresh key for each new logical operation (each checkout, each booking) and reuses *that same key* for every retry of it. A UUIDv4 is the convention; never use PII or predictable counters (guessing keys would let callers collide with — and replay — other people's operations).
- **The server stores key → result.** First request with a key executes and records the outcome (status code + response body) in a dedupe store. Any later request carrying the same key short-circuits and gets the stored outcome back — Stripe even replays stored `500`s, so retries after failures behave exactly like the original failure did.
- **Key + different payload = conflict.** If a client reuses a key but sends a different body, the server must reject with `409 Conflict` — that is a bug in the client (new intent needs a new key), not a retry.
- **Keys expire.** Stripe prunes keys after ≥24 hours; a key reused after pruning starts a *new* operation, which is safe only because the original is long settled. TTL is your garbage collector — the store otherwise grows forever.
- **Standardization:** the `Idempotency-Key` header is an IETF draft (`draft-ietf-httpapi-idempotency-key-header`) and a de-facto convention that payment APIs (Stripe, Adyen, PayPal) have shipped for over a decade.

The subtle part — where naive implementations leak duplicates:

```
THE CRASH WINDOW — the store alone is not enough
════════════════════════════════════════════════
  1. business commit        2. write dedupe record    3. reply 200
  ┌──────────────────┐        ┌──────────────────┐      ┌────────┐
  │ charge $50       │        │  K-3f9a → 200    │      │  200   │
  │ tx COMMITS       │  crash │  (never written) │      └────────┘
  └──────────────────┘ ────►  └──────────────────┘
        ▲                        ▲
        └─ if the process dies between these two steps, the retry
           arrives, the key is unknown, and the charge runs again.

  Fixes (defense in depth):
  1. Write the dedupe row in the SAME database transaction as the
     business commit → both happen or neither.
  2. Backstop: a UNIQUE constraint on the natural business key
     (e.g. payment_ref = order-4711). A duplicate insert then
     collides → return the existing row instead of charging twice.
  3. Concurrency: two same-key requests in flight (double-tap).
     The store's primary key on the idempotency key is the lock —
     one insert wins, the other waits or gets a 409.
```

### Example:

Kyomel's fasting-bot launches a paid "Pro" tier. Users pay through a checkout API, and the payment service is written in Go behind a load balancer. It is 11 PM, and a user on a flaky mobile connection taps "Upgrade to Pro" on a slow bus — the request reaches the server, the charge commits, but the response dies somewhere in the tunnel before coming back. The phone retries.

```text
RETRY-SAFE CHECKOUT — idempotency middleware + DB backstop
═══════════════════════════════════════════════════════════

  CLIENT (fasting-bot app)                PAYMENT SERVICE (Go)
  ┌──────────────────────────────┐
  │ POST /v1/subscriptions       │
  │ { plan: "pro" }              │
  │ Idempotency-Key:             │
  │   550e8400-e29b-41d4-a716-…  │   ← new UUID minted per checkout
  └──────────────┬───────────────┘
                 │  attempt #1
                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ IDEMPOTENCY MIDDLEWARE (dedupe gate, runs before handler)   │
  │                                                             │
  │   key "550e84…" in store?                                   │
  │      │ NO                                                   │
  │      ▼                                                      │
  │   run handler ──► charge $49 ──► INSERT subscription        │
  │                      │              │                       │
  │                      └── SAME TX ──┴─► INSERT dedupe row    │
  │                          (fix #1: commit together)          │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ DB                      │
                    │ subscriptions            │
                    │   UNIQUE (client_ref)   │ ← fix #2: natural-key
                    │ idempotency_keys        │   backstop
                    │   PK (key), TTL 24h     │
                    └─────────────────────────┘

  ── the 200 response is lost in the tunnel; client times out ──

  CLIENT                               PAYMENT SERVICE
    │  attempt #2 (auto-retry, SAME key, SAME body)
    │────────────────────────────────►
    │                                 key "550e84…" in store?
    │                                       │ YES
    │                                       ▼
    │                                 replay stored 200 + sub id
    │◄──────────────────────────────── no handler, no new charge

  RESULT: user sees one successful upgrade. Bank shows one $49
  charge. Even if the server had crashed inside the crash window,
  the second attempt's INSERT would hit the UNIQUE(client_ref)
  backstop and return the existing subscription instead of
  creating a duplicate.
```

Three small details make this production-grade rather than demo-grade. First, the dedupe gate must be **atomic**: two retries arriving at the same millisecond (double-tap on the pay button) both check the store, both see "unknown", and both run the handler — so the store's primary key on the idempotency key is what serializes them: one INSERT wins, the other blocks and then replays. Second, the middleware should hash the request body and store it next to the key, so a same-key-different-payload retry is caught with a `409` instead of silently returning someone else's result. Third, idempotency keys are for *your* retries — a background worker, a webhook redelivery, a user mashing the button — all of them must agree on one key per intent or the pattern quietly stops working.

The punchline: idempotency keys move the burden of duplicate-safety from "hope the network behaves" to "design for the network misbehaving." They don't eliminate duplicate execution — nothing can, once a process can die between two side effects — but they guarantee that no matter how many times a request arrives, the user is charged once, the seat is booked once, and the system's answer never changes. That single property is why no serious payment, booking, or messaging API ships without them, and why the pattern is quietly becoming the default answer to every "what if the retry double-fires?" question in distributed systems.
