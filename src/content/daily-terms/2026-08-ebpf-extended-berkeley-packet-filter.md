---
title: "eBPF (Extended Berkeley Packet Filter)"
termSlug: "ebpf-extended-berkeley-packet-filter"
year: 2026
month: 8
monthName: "August"
day: 12
order: 8
source: "2026/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/august-term.md"
excerpt: "eBPF is a Linux kernel technology that lets you run sandboxed programs inside the kernel without changing kernel source code or loading kernel modules — safely, at native speed, and on live systems..."
---
### Definition:

eBPF is a Linux kernel technology that lets you run sandboxed programs inside the kernel without changing kernel source code or loading kernel modules — safely, at native speed, and on live systems. It effectively turns the Linux kernel into a programmable platform, allowing developers and operators to add custom observation, filtering, security, and networking logic to the kernel on the fly.

The name is historical (it evolved from the original BPF packet filter used for network packet filtering). But modern eBPF is far broader: it's a safe, general-purpose execution environment inside the kernel, used for observability, performance tracing, network monitoring, security enforcement, and more.

```text
WHAT eBPF DOES — THE CORE IDEA:
═══════════════════════════════════════════════════════════════

  THE PROBLEM: Inspecting and controlling the kernel is hard.

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  TO CHANGE KERNEL BEHAVIOR, you used to have to:        │
  │                                                         │
  │  Option A: Modify kernel source code                    │
  │    • Edit Linux source → compile → reboot               │
  │    • Slow, dangerous, and you must maintain a           │
  │      custom kernel fork                                 │
  │                                                         │
  │  Option B: Load a kernel module (like device drivers)   │
  │    • Can crash the kernel if buggy (no safety)          │
  │    • Requires root, risky, version-specific             │
  │                                                         │
  │  Option C: Use built-in tools only (top, tcpdump, etc.) │
  │    • Only see what the kernel exposes to userspace      │
  │    • Limited, can't see deep internals                  │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  THE eBPF SOLUTION: Run safe programs INSIDE the kernel.

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  You write a small program → it runs inside the kernel  │
  │  at specific "hook points" → observes or acts on        │
  │  kernel events → sends results to userspace.            │
  │                                                         │
  │  • NO kernel source changes                             │
  │  • NO rebooting                                         │
  │  • NO risky kernel modules (eBPF is SANDBOXED)          │
  │  • Can attach/remove programs on a LIVE running system  │
  │                                                         │
    └─────────────────────────────────────────────────────────┘
```

### Example:

A visual walkthrough of how eBPF is used for three major applications — observability, networking, and security.

```text
═══════════════════════════════════════════════════════════════
  THE GOAL: See every HTTP request a container makes,
  with latency, without modifying the app.
═══════════════════════════════════════════════════════════════

  BEFORE eBPF (invisible):
  ─────────────────────────
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  [App] ──HTTP──► [Kernel network stack] ──► [server]    │
  │                  ▲                                      │
  │                  │ (the app uses a library like libcurl │
  │                  │  — you can't see inside it without   │
  │                  │  modifying the app)                  │
  │                                                         │
  │  To trace HTTP, you'd need to:                          │
  │  • Add logging code to the app (modify source, redeploy)│
  │  • Or use a proxy that captures traffic (adds latency)  │
  │  • Fragile, invasive, slow                              │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  WITH eBPF (attach to the kernel socket hook):
  ──────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  [App] ──HTTP──► [Kernel network stack] ──► [server]    │
  │                    ▲      │                             │
  │                    │      └──► eBPF program attaches     │
  │                    │          at the socket write/read  │
  │                    │          hook                       │
  │                    │                                    │
  │                    └── captures:                        │
    │                        • method (GET/POST)              │
    │                        • URL path                       │
    │                        • latency (start→end)            │
    │                        • bytes sent/received            │
    │                        • status code                    │
    │                                                         │
    │  eBPF program → writes to eBPF map →                   │
    │  userspace tool (like Pixie, Hubble) reads the map      │
    │  and displays it.                                       │
    │                                                         │
    │  ✅ No app code changes                                 │
    │  ✅ No redeployment                                     │
    │  ✅ Near-zero overhead                                  │
    │  ✅ Works on ANY app (C, Go, Java, Python — doesn't     │
    │     matter, it hooks the kernel, not the app)           │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```
