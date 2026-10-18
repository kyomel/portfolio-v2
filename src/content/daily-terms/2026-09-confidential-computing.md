---
title: "Confidential Computing"
termSlug: "confidential-computing"
year: 2026
month: 9
monthName: "September"
day: 10
order: 8
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Confidential Computing is a hardware-enforced runtime isolation model: a workload runs inside a Trusted Execution Environment (TEE) — a cryptographically sealed region of CPU and GPU memory whose e..."
---
### Definition:

Confidential Computing is a **hardware-enforced runtime isolation** model: a workload runs inside a *Trusted Execution Environment (TEE)* — a cryptographically sealed region of CPU and GPU memory whose encryption keys are generated **inside the silicon and never leave it**. The consequence is the whole point of the pattern: everyone who *operates* the machine — the hypervisor, the host kernel, the cloud provider's privileged staff, a fully root-compromised host OS — sees only ciphertext where your model weights, your prompts, and your patient records used to be.

The framing that makes it click. Security has covered **two states of data** for thirty years, and quietly skipped the third:

- **at rest** → disk / object-storage encryption
- **in transit** → TLS
- **in use** → …nothing, by design

To compute on data, a CPU *must* decrypt it into DRAM — and DRAM belongs to whoever owns the host. Disk encryption ends at the bootloader; TLS ends at the socket. The moment the bytes have to be understood, they are plaintext owned by the operator. That is why every cloud workload has always carried an unstated assumption: **trust the operator**.

Confidential computing moves that assumption down into the silicon. Instead of trusting the operator, you trust the chip vendor's hardware — plus a cryptographic proof that the right code is running. That proof is **remote attestation**, and it is the second half of the pattern:

1. **Runtime isolation** — the TEE's memory is encrypted in place; the host cannot read it, and (in 2026 silicon) cannot silently re-map, replay, or roll it back either.
2. **Attestation** — the TEE can produce a hardware-signed *Evidence* artifact (an SEV-SNP report / TDX Quote / NVIDIA GPU attestation report) proving exactly which firmware, kernel, and application measurements were loaded, and that debug mode is off.

Neither half works alone. Isolation without attestation is unverifiable (you cannot tell a genuine TEE from a simulator, or from a legitimate TEE running the attacker's image). Attestation without isolation is a notarized promise that nobody enforces. Together they are the product: **"prove what is running, then hand it secrets that even its own host cannot read."**

```text
WITHOUT CONFIDENTIAL COMPUTING — a standard VM: the host reads everything
════════════════════════════════════════════════════════════════════════════

                    ┌─────────────────────────────────────────────┐
   patient data ───►│  CLOUD PROVIDER'S PHYSICAL MACHINE          │
   model weights    │                                             │
   (TLS in transit) │   ┌─────────────────────────────────────┐   │
                    │   │  YOUR VM / CONTAINER                │   │
                    │   │   ┌───────────────────────────────┐ │   │
                    │   │   │  DRAM  —  PLAINTEXT           │ │   │
                    │   │   │   • prompt: "pasien Budi, …"  │ │   │
                    │   │   │   • weights: 7B fp16          │ │   │
                    │   │   │   • KV-cache: full reasoning  │ │   │
                    │   │   └───────────────────────────────┘ │   │
                    │   └─────────────────────────────────────┘   │
                    │        ▲              ▲              ▲      │
                    │   hypervisor     host kernel   provider ops │
                    │   ═════════ ALL OF THEM CAN READ ═════════► │
                    └─────────────────────────────────────────────┘

   Disk encryption and TLS BOTH END HERE — at the doorstep of the
   machine. The instant the CPU needs the bytes to compute on them,
   they are plaintext, and the operator owns the plaintext.

WITH CONFIDENTIAL COMPUTING — a Confidential VM (CVM) + GPU TEE
════════════════════════════════════════════════════════════════════════════

                    ┌─────────────────────────────────────────────┐
   patient data ───►│  CLOUD PROVIDER'S PHYSICAL MACHINE          │
   model weights    │  (operator: untrusted, and now irrelevant)  │
                    │   ┌─────────────────────────────────────┐   │
                    │   │  CONFIDENTIAL VM  ── TEE ──         │   │
                    │   │   ┌───────────────────────────────┐ │   │
                    │   │   │  DRAM — ENCRYPTED (per-page)  │ │   │
                    │   │   │  0x9f3a…  0x41bc…  0x77de…    │ │   │
                    │   │   └───────────────────────────────┘ │   │
                    │   │            ▲ decrypts ONLY here     │   │
                    │   └────────────┼────────────────────────┘   │
                    │        ┌───────┴────────┐                   │
                    │        │  CPU / GPU     │ keys are born in  │
                    │        │  SILICON       │ silicon, never    │
                    │        └───────┬────────┘ handed to the host│
                    │   AMD SEV-SNP · Intel TDX · ARM CCA ·       │
                    │   NVIDIA C-CAP (H100 / H200 / B200)         │
                    │                                             │
                    │  hypervisor ─┐                              │
                    │  host kernel ┼─► see CIPHERTEXT + MEASURE-  │
                    │  provider ops┘   MENTS, never the contents  │
                    └─────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────┐
  │  KEY IDEA: the trust boundary moves from "the party running    │
  │  the hardware" to "the chip vendor's silicon + a signed proof  │
  │  of what is loaded." You stop asking the operator to be good   │
  │  and start verifying, cryptographically, that they can't peek. │
  └────────────────────────────────────────────────────────────────┘
```

The four pillars (as the Confidential Computing Consortium frames them) are a checklist you can audit against:

- **Hardware root of trust** — encryption keys are fused into the chip; the host cannot derive them.
- **Attestation** — signed Evidence of identity, initial state, and TCB (firmware microcode) version.
- **Sealed storage** — data encrypted to the TEE's *identity*, so it can only be unsealed by a TEE matching the same measurement. This is "encryption at rest" rebound to *code* instead of to a machine.
- **Secure channels** — a session key negotiated *after* attestation, so the wire is pinned to the verified enclave rather than to a hostname.

The 2026 hardware landscape, and why "the TEE" is usually several TEEs stitched together:

```text
PROTECTING A FULL AI INFERENCE STACK — isolation at both ends of the bus
════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────── CONFIDENTIAL VM ──────────────────────────┐
  │                                                                       │
  │  AMD SEV-SNP / Intel TDX / ARM CCA                                    │
  │  ┌───────────────────────────────────────┐                            │
  │  │ CPU TEE: guest DRAM encrypted,        │   · whole-VM isolation     │
  │  │ pinned launch measurement,            │   · 3–6% overhead on       │
  │  │ REVERSE MAP TABLE blocks remap/replay │     inference in 2026       │
  │  └───────────────┬───────────────────────┘                            │
  │                  │ PCIe — bus traffic encrypted by the CPU             │
  │  ┌───────────────▼───────────────────────┐                            │
  │  │ NVIDIA C-CAP GPU TEE (H100/H200/B200) │   · VRAM encrypted in HBM3e│
  │  │ weights + activations + KV-CACHE      │   · ~7% throughput cost    │
  │  │ live encrypted in VRAM                │   · has its OWN attestation│
  │  └───────────────────────────────────────┘     report, bound to the   │
  │                                                 CPU's — "composite    │
  │  AWS Nitro Enclaves: no persistent storage, no  attestation"          │
  │  networking by default — you must proxy every                         │
  │  byte through the parent, by design.                                  │
  └───────────────────────────────────────────────────────────────────────┘

  Rule of thumb: encrypt the CPU side only and your weights still sit in
  plaintext VRAM. Confidential inference means a CVM PLUS a CC-capable
  accelerator, with an attestation that covers BOTH.
```

What changed by 2026 — this is the reason the term moved from "compliance checkbox" to "default":

- **Overhead collapsed.** First-generation TEEs cost 30–40% throughput. Current SEV-SNP/TDX silicon sits at **3–6%** on inference, and NVIDIA C-CAP at roughly **7%** now that the memory-encryption engines live inside the HBM3e controllers. Below the variance between two cloud regions, the cost stops being a business decision.
- **Frameworks caught up.** By 2026 vLLM, TGI, and Triton ship first-class confidential modes: pass a flag, weights load across an encrypted path into a CC GPU, the KV-cache stays sealed, tokens stream out over an attested channel. Before this, every team hand-instrumented its own inference server.
- **Consumer-scale confidential AI went mainstream.** Apple's Private Cloud Compute, Meta's Private Processing, and Azure Confidential VMs / Google Confidential Space made "the operator cannot read it" a consumer-visible claim, not a B2B SKU.
- **Procurement language hardened.** Compliance text now literally reads: *model weights and inference inputs must be protected against access by the infrastructure provider, attested at workload launch, and never appear in plaintext in host memory.* That sentence is a TEE requirement written as a purchase order.

Where it fits — and where it does not:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  GOOD FIT (a TEE is doing real work)                                 │
│  • Regulated data you cannot show the host: health, finance, gov     │
│  • Proprietary weights + untrusted/foreign infrastructure            │
│  • Multi-party data clean rooms (two banks, one model, no raw data   │
│    ever visible to either counterparty or the cloud)                 │
│  • Cloud bursting / colo where you do not own the rack               │
│  • Sovereignty rules that forbid foreign staff touching the data     │
│                                                                      │
│  NOT WORTH IT (the operational tax buys nothing)                     │
│  • Any workload you would happily run in your own datacenter         │
│  • Public data + public model: no secret exists to protect           │
│  • Teams that will not run attestation verification — a TEE with     │
│    no verifier is decoration                                         │
│  • Latency-hard budget with autoscaling churn (attestation is part   │
│    of cold start; budget it, and pre-warm)                           │
└──────────────────────────────────────────────────────────────────────┘
```

Being honest about the threat model is what separates the deployments that hold from the ones that get breached. A TEE does **not** defend against **side channels** (microarchitectural leakage is relocated, not eliminated), **output leakage** (memory isolation does not stop a jailbroken or poisoned model from exfiltrating through its own answers), **compromised supply chain** (a poisoned weight file loads perfectly — and privately), **a lazy verifier**, or a **debug/swap path left enabled** (SEV-SNP's `DEBUG` flag and TDX debug mode must be off; the host must not be able to core-dump guest memory).

One honest comparison worth pinning, because the two get blurred constantly — and because this journal already covered **Homomorphic Encryption (FHE)**:

```
TEE (CONFIDENTIAL COMPUTING)   vs   FHE (HOMOMORPHIC ENCRYPTION)
════════════════════════════════════════════════════════════════

  TRUST ANCHOR
    TEE  a hardware vendor's silicon (AMD / Intel / ARM / NVIDIA)
    FHE  nobody — the security is mathematical, not physical

  DATA IN USE
    TEE  plaintext, but only inside a sealed + attested box
    FHE  ciphertext end to end — never decrypted anywhere

  vs MALICIOUS ADMIN / HYPERVISOR
    TEE  ✓ blocked (host sees ciphertext)
    FHE  ✓ blocked (there is nothing to see)

  vs SIDE-CHANNEL ATTACK
    TEE  ⚠ residual risk — leakage is relocated, not removed
    FHE  ✓ structurally immune (no hardware is trusted)

  POST-QUANTUM
    TEE  ⚠ AES-based, breakable by a large quantum computer
    FHE  ✓ lattice-based, believed quantum-safe

  CODE CHANGE TO ADOPT
    TEE  ~none — deploy the same binary into a TEE
    FHE  full rewrite: arithmetic must become FHE arithmetic

  TIME TO PRODUCTION
    TEE  days to weeks
    FHE  months to years, with cryptography specialists

  COST
    TEE  ~1.0–1.1× baseline (3–7% overhead in 2026)
    FHE  ~100×–1,000×+ — usually fatal for interactive work
```

The pragmatic reading: **FHE is the stronger security claim, TEEs are the only one you can actually ship this year.** They are complements — and FHE is quietly useful in exactly the niches a TEE cannot serve, like when no one at all may hold a decryption key.

### Example:

"KlinikSehat", a Jakarta health-tech, wants to launch an LLM triage assistant that reads patient records. Its constraints are brutal but normal: the hospital contracts forbid the cloud provider from ever accessing patient data; Indonesian personal-data law requires demonstrable technical controls; and the model is a fine-tuned, million-dollar asset that must not leak to the provider either. They refuse to build a datacenter. So they deploy a **confidential inference stack** — and the shape of the system changes from an architecture diagram into a *handshake*.

```text
CONFIDENTIAL INFERENCE, END TO END — nothing readable until attestation passes
══════════════════════════════════════════════════════════════════════════════

   CLINIC (verifier side)                      CLOUD (untrusted operator)
  ┌───────────────────────┐
  │ client SDK / KMS      │  1. send a NONCE (freshness / anti-replay)
  │ reference values      │──────────────────────────────►  starts a CVM
  │  pinned image hash    │                               with the pinned
  │  min TCB version      │                               image hash
  │  debug = OFF          │
  └──────────┬────────────┘
             │                             2. TEE asks its HARDWARE for Evidence
             │                                ├─ SEV-SNP attestation report (VCEK-signed)
             │                                ├─ Intel TDX Quote
             │                                └─ NVIDIA GPU CC attestation report
             │                                …the GPU's report is bound to the CPU's
             │                                → the two are ONE verified composite
             │  ◄─────── signed Evidence ──────┘
             │
             ▼  3. VERIFY against policy (OPA/Rego, not a hard-coded ==):
                ├─ measurement == our image hash?             ✓
                ├─ TCB ≥ minimum microcode version?           ✓
                ├─ nonce matches the one we just sent?        ✓ (no replay)
                ├─ debug flag OFF, no core-dump path?         ✓
                └─ signature chains to AMD/Intel/NVIDIA root  ✓
                        │
                        │  ✗ ANY FAILURE → abort, release nothing.
                        │    That is the entire point of the pattern.
                        ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  4. UNSEAL — key release is GATED BY ATTESTATION                 │
  │                                                                  │
  │   KMS policy: kms:RecipientAttestation == <expected measurement> │
  │        │                                                         │
  │        │  KMS refuses to hand over the model-decryption key to   │
  │        │  anything that cannot prove what it is. A host that     │
  │        └─ steals the encrypted weights still gets 0x41bc…  ✓     │
  └──────────────────────────────────────────────────────────────────┘
                        │
                        ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  5–6. LOAD + SERVE, all inside the TEE                           │
  │                                                                  │
  │   prompt "pasien Budi, 54, diabetes, metformin…"                 │
  │        │                                                         │
  │        ▼  plaintext exists ONLY inside encrypted DRAM/VRAM       │
  │   [ CPU TEE: prompt + tokenizer ]──PCIe(encrypted)──►[ GPU TEE:  │
  │                                                        weights + │
  │                                                        KV-cache ]│
  │        │                                                         │
  │        ▼  response encrypted to the clinic's session key         │
  │   "Saran triage: …"  ──►  clinic decrypts                        │
  └──────────────────────────────────────────────────────────────────┘

  MEANWHILE, THE CLOUD ADMIN'S DASHBOARD SHOWS:
  ┌──────────────────────────────────────────────┐
  │  CVM-7f3a   ATTESTED  ✓   TCB 3.1.2          │
  │  DRAM  0x9f3a: 9d 41 bc 77 de 00 3a …        │
  │  VRAM  0x41bc: c0 ff ee 1a 9f 3a 44 …        │
  │  egress: 2.1 GB   cpu: 41%   net: ok         │
  │  ── no prompt, no weights, no records ──     │
  └──────────────────────────────────────────────┘
```

Two design decisions carry most of the weight here, and both are easy to get wrong:

**The verifier is not the cloud.** If KlinikSehat accepts the provider's own attestation service verdict, it has merely moved the trust, not removed it — the operator can lie about a quote it validates itself. The IETF RATS framework (RFC 9334) names the roles precisely: the **Attester** (the TEE) produces **Evidence**; the **Verifier** checks it against **Reference Values**; the **Relying Party** (KlinikSehat's KMS) decides whether to release the key. Two standard topologies fall out:

```text
BACKGROUND CHECK MODEL — every relying party verifies independently
────────────────────────────────────────────────────────────────────

   TEE ──Evidence──► Relying Party ──Evidence──► Verifier
                          ▲                          │
                          └───── Attestation Result ─┘
   decision: the RELYING PARTY releases the key, on a FRESH result
   cost:     every service that must decide needs verifier access

PASSPORT CHECK MODEL — verify once, then present a token
────────────────────────────────────────────────────────

   TEE ──Evidence──► Verifier ──► Attestation Result (signed token)
     │
     └──presents token──► Relying Party ──► validates the SIGNATURE only
   decision: any service can decide, with NO verifier access
   cost:     a reusable token exists — so bind it to a short TTL + audience

GOOD FOR:  few, high-stakes consumers     GOOD FOR:  many services / proxies
           key release to one KMS                      fleet-wide rollout gates
```

KlinikSehat self-hosts the verifier (Trustee-style) inside its own VPC for the high-stakes key release, and lets downstream proxies accept passport-style tokens so every microservice does not need to re-verify a hardware quote.

**Patching is an attestation event.** This is the operational trap nobody sees in the architecture diagram: every routine kernel update changes the launch measurement, so the *reference values* must be provisioned to the verifier **before** the updated guests boot — otherwise a fleet-wide patch at 02:00 becomes a fleet-wide attestation outage at 02:01. The mature pattern is policy, not equality: pin the measurement for the tight deployments, allow a *minimum TCB version* window during rollouts, and keep an explicit allow-list of hardware models and a hard rule that debug mode is off. "Measurement churn" is a first-class release-engineering concern the day you adopt confidential computing, not an afterthought.

Finally, the part KlinikSehat gets right by *not* trusting the TEE for everything. The TEE protects memory, not meaning. So the triage bot keeps three controls *outside* the enclave: output filtering and redaction on the response path (because a poisoned or jailbroken model exfiltrates happily through an attested channel — the pipe is private, the payload is not), rate limits and per-tenant quotas, and ECC memory plus disabled swap as a baseline, since memory corruption inside an enclave is far harder to recover from when the host is not allowed to intervene. And because attestation adds latency, they budget it into autoscaling — pre-warming confidentially, the same lesson as any cold start, with a verifier handshake stapled to the front.

The punchline: confidential computing is the first time the phrase *"trust no one"* became an actual machine instruction. For thirty years the cloud forced a trade — get scale and elasticity, and in exchange let the operator see your plaintext. TEEs plus attestation break that trade: the operator keeps the hardware, you keep the secrets, and a signed quote from the chip decides who is lying. It does not make a system safe — a TEE is a memory-isolation primitive, not a security programme, and teams that deploy one without a verifier, without output controls, and without a patch plan are buying a certificate rather than a control. But by 2026 the overhead has fallen below the noise floor and the frameworks ship it as a flag, which is why the honest framing is no longer "should we adopt confidential computing?" but "which of our workloads can we still afford to have the provider read?"
