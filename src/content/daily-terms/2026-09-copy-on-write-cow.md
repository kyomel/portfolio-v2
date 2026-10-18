---
title: "Copy-on-Write (COW)"
termSlug: "copy-on-write-cow"
year: 2026
month: 9
monthName: "September"
day: 17
order: 13
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "Copy-on-Write (COW) is a memory-sharing rule. Two owners point to the same physical page. The kernel marks that page read-only for both owners. The first write makes a private copy for the writer o..."
---
### Definition:

**Copy-on-Write (COW)** is a memory-sharing rule. Two owners point to the *same* physical page. The kernel marks that page read-only for both owners. The first write makes a private copy for the writer only. The other owner keeps the original page.

The rule does not remove a copy. It moves the copy in time. A clone becomes cheap now and expensive at the first write.

- **Eager copy** pays once, up front: O(memory). The clone waits for a full duplicate of RAM.
- **Copy-on-Write** pays O(metadata) at clone time, then O(pages written) over the lifetime.

```text
EAGER COPY  vs  COPY-ON-WRITE — one 400 MB parent, one clone
══════════════════════════════════════════════════════════════════════

EAGER COPY — the clone waits, the memory is committed at once
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  parent 400 MB ──► [ read all 400 MB ] ──► [ write all 400 MB ]    │
│                                                     │              │
│                                                     ▼              │
│                                          child 400 MB (private)    │
│                                                                    │
│  clone runs after      ~1.5 s      page that nobody touches:       │
│  memory now            800 MB      still copied, still paid        │
└────────────────────────────────────────────────────────────────────┘

COPY-ON-WRITE — the clone starts at once, the pages stay shared
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  parent 400 MB ──► [ copy PAGE TABLES only ] ──► clone starts now  │
│        ▲                        │                                  │
│        │                        ▼                                  │
│        │             ┌───────────────────────┐                     │
│        └─────────────┤ ONE physical set of   │◄── child points to  │
│                      │ 400 MB pages          │    the SAME pages   │
│                      │ PTE bit: read-only    │                     │
│                      └───────────────────────┘                     │
│                                                                    │
│  clone runs after   ~1–10 ms     memory now   400 MB shared        │
│                                                                    │
│  then the writes arrive, one page at a time:                       │
│    parent writes page 12   ──► fault ──► copy 4 KB ──► parent own  │
│    child  writes page 12   ──► fault ──► copy 4 KB ──► child  own  │
│    page 99 nobody writes   ──► nothing copied, nothing paid        │
└────────────────────────────────────────────────────────────────────┘
```

Every first write runs the same four steps in the kernel:

```text
ONE COPY-ON-WRITE FAULT — what a single first write costs
═══════════════════════════════════════════════════════════════════════

  ① store instruction hits a page marked read-only
        │                          (protection fault, not a slow disk)
        ▼
  ② kernel allocates one free physical page
        │
        ▼
  ③ kernel copies the page content into the new page
        │
        ▼
  ④ kernel flips the PTE to read-write for this process, then sends a
     TLB shootdown to every other core that maps the same page

  4 KB copy + one fault + one IPI  →  in the critical path of the write
```

COW is not a fork feature. It is a general sharing rule, and it carries these systems:

- **`fork()`** — Redis background saves and AOF rewrite, gunicorn/uWSGI prefork workers, shell pipelines, CRIU checkpoints.
- **MicroVM snapshots** — Firecracker and similar sandboxes restore a machine from a memory file with COW. Clone cost stays O(metadata) instead of O(RAM).
- **Container image layers** — `overlayfs` holds lower layers read-only. The first write to a lower-layer file triggers **copy-up**: the whole file moves into the container layer.
- **Filesystem snapshots** — Btrfs and ZFS snapshots copy block references, not blocks.
- **`mmap(MAP_PRIVATE)`** — a file mapped private onto memory. The page cache stays shared until the mapping is written.

The unit of the copy is the page. That one fact controls the size of the bill.

```text
PAGE SIZE IS THE UNIT OF THE COPY — the setting that decides how big the bill gets
═════════════════════════════════════════════════════════════════════════════════

  page size   who sets it                  one first write copies
  ─────────────────────────────────────────────────────────────────────────────
  4 KB        default, THP = madvise/never      4 KB   (the small page)
  2 MB        THP = always (default on many distros)  2 MB (the whole huge page)
  ─────────────────────────────────────────────────────────────────────────────

  one byte written inside a 2 MB huge page copies the full 2 MB
  → on a write-heavy box, THP turns a 2x memory spike into 4x or worse
```

Four properties of COW are easy to miss, and each one has produced an outage:

- **Page tables are still copied.** `fork()` writes out the paging metadata for the whole mapped address space. A multi-GB process pays milliseconds at fork time, even when it writes nothing. Kernel work (shared last-level page tables) exists to cut this cost.
- **Sharing is coarse.** Two owners that write two different variables inside the *same* 4 KB page pay two copies. A shared allocator header or a hot lock in a shared page defeats the sharing fast.
- **Memory accounting lies.** A container limit is enforced on RSS, not on logical data size. Shared pages are charged to the first writer, so a snapshot can push RSS far above the data size and invite the OOM killer.
- **Reference counting breaks the sharing.** CPython bumps a reference count inside the object header, so even a *read* of a shared object writes to its page. Prefork Python workers therefore share less memory than the theory promises. Runtimes without per-object counters share more.

Correct use comes down to measurement and one setting:

- **Measure the copy, do not guess it.** Redis reports `rdb_last_cow_size` and `aof_last_cow_size`. A value above roughly 50% of `used_memory` means the box is copying enough pages to threaten itself.
- **Size memory for RSS, not for the dataset.** A dataset that forks for a snapshot needs headroom near 1.5x, on top of the data itself.
- **Turn THP off for fork-heavy workloads** (Redis, forked database backups). Set both `transparent_hugepage/enabled` and `transparent_hugepage/defrag` to `never`, and make the change survive reboot.
- **Set `vm.overcommit_memory=1`** when a fork must reserve address space for the eventual copy. Caution: this trades a clean failure for a possible OOM kill.
- **Keep image layers immutable** in containers, so copy-up runs once per file instead of in a loop.

### Example:

Kyomel's **fasting-bot** runs on one VPS with **1 vCPU and 1 GB RAM**. A small Redis on the same box holds the leaderboard, the streak counters, and the reminder queue. Redis keeps RDB snapshots on, so the data survives a restart.

The numbers below are the shape of this failure class, not a measurement of that box. The commands at the end let Kyomel check his own instance.

```text
THE SAVE THAT KILLS THE BOX — one snapshot, one fork, one OOM
═══════════════════════════════════════════════════════════════════════

  dataset = 300 MB (used_memory 300 MB)      cgroup limit = 512 MB

  03:58  cron fires SAVE ──► Redis calls fork()
         │
         ├── parent  ──┐
         └── child   ──┴──► SAME 300 MB of pages, PTE read-only
                            extra memory at fork time: ~2 MB of page tables

  04:00  the sahur burst starts
         │   reminder jobs fan out, every streak update writes a counter
         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ parent writes → the child needs a stable view of the data    │
  │ → every dirty page is copied for the PARENT and charged      │
  │   to the parent RSS                                          │
  └──────────────────────────────────────────────────────────────┘
         │
         ▼
  04:07  rdb_last_cow_size = 205 MB   (68% of used_memory — past the
         safe line, the workload copied two thirds of the dataset)
         parent RSS  300 MB ──► 505 MB
         cgroup used 470 MB ──► 505 MB   > 512 MB limit
         │
         ▼
  ┌────────────────────────────────────┐
  │ OOM killer kills Redis             │
  │ child dies with it — the snapshot  │
  │ never lands on disk                │
  │ bot restarts with a COLD cache     │
  └────────────────────────────────────┘
  ─────────────────────────────────────────────────────────────────────
  used_memory during the whole event: flat at 300 MB
  → the dashboard that watches the dataset shows nothing wrong
  → the dashboard that watches RSS shows the whole event
```

The failure needs three ingredients at the same time: a forked child, a write-heavy window, and memory sized from the data instead of from RSS. Remove any one of them and the box survives.

The fix list is short and each item maps to one cause:

- **THP off** on that VPS. With 2 MB pages, one byte written inside a huge page copies 2 MB. This is the single largest multiplier.
- **Memory sized for RSS**: 300 MB dataset → at least 450 MB of headroom, or a bigger cgroup limit.
- **The snapshot moved out of the burst window** (the burst is 04:00–05:00 WIB, so the save runs in the quiet afternoon).
- **An alarm on `rdb_last_cow_size`** above 150 MB, so the next write storm pages Kyomel instead of surprising him.
- **`vm.overcommit_memory=1`**, or an explicit `maxmemory` policy, so the fork cannot be refused halfway.

```
VERIFY ON THE BOX — three commands, no guessing
═══════════════════════════════════════════════════════════════════════

  $ cat /sys/kernel/mm/transparent_hugepage/enabled
    [always] madvise never        ← must read "never" for a forking store

  $ redis-cli info persistence | grep cow_size
    rdb_last_cow_size:205000000   ← compare with used_memory from
                                    "info memory"

  $ redis-cli info stats | grep latest_fork
    latest_fork_usec:...          ← 3-digit microseconds = healthy,
                                    six digits = page-table copy pain
```

Three lessons generalise. **COW moves the copy into the write path**, so the writer pays at fault time instead of the cloner paying at clone time — latency moves with the bill. **Any system that promises a fast clone ships a copy that arrives later**, so the correct question is always "who writes, and how much?" And **the page is the atomic unit of the trade**, which is why one kernel setting (THP) can turn a survivable 2x spike into a fatal 4x one.

The punchline: `fork()`, container start, microVM snapshot, and filesystem snapshot all promise the same thing — an instant copy. None of them makes a copy. They postpone it to the first write, and they hand the cost to whoever writes first. Read that contract before sizing the box, because the box gets OOM-killed by RSS, and RSS counts the pages that COW copied.
