---
title: "io_uring (Linux Asynchronous I/O Interface)"
termSlug: "io-uring-linux-asynchronous-i-o-interface"
year: 2026
month: 9
monthName: "September"
day: 23
order: 17
source: "2026/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/sept-term.md"
excerpt: "iouring is the asynchronous I/O interface of the Linux kernel. The application writes I/O requests into a ring buffer. The kernel reads them from that shared memory. The kernel writes the results i..."
---
### Definition:

**io_uring** is the asynchronous I/O interface of the Linux kernel. The application writes I/O requests into a ring buffer. The kernel reads them from that shared memory. The kernel writes the results into a second ring buffer. Both sides communicate through memory, so one system call can carry a whole batch of requests.

Jens Axboe added io_uring to Linux 5.1 in 2019. It replaces the older Linux AIO interface (`io_submit`). That older interface works only for direct I/O on a few file systems, and it still costs one system call per operation.

The problem it fixes is the price of a system call. A blocking `read()` must enter kernel mode, copy the arguments, wait for the device, and return to the application. On a fast NVMe drive, the device work is short. The system call then becomes a large part of the total cost. A thread pool hides the wait, but it costs threads, stacks, and context switches.

io_uring changes the direction of the control path. The kernel no longer receives one request per system call. The kernel takes requests from memory.

```text
ONE SYSCALL PER OPERATION              SHARED RINGS (io_uring)
═══════════════════════════════        ════════════════════════════════

  application thread                     application thread
        │                                      │
        │ read(fd, buf, 4096)                  │ add SQE    no syscall
        │                                      │ add SQE    no syscall
        │  ── kernel transition ──             │ add SQE    no syscall
        ▼                                      ▼
  ┌────────────────────────┐             ┌───────────────────────────┐
  │ syscall entry           │            │ SQ ring (in app memory)   │
  │ copy args, switch mode  │            └─────────────┬─────────────┘
  └───────────┬────────────┘                          │
              │                        io_uring_enter(count = 3)
              │                        ── ONE kernel transition ──
              ▼                                      ▼
        [ kernel ] ──► [ NVMe ]               [ kernel ] ──► [ NVMe ]
              │                                      │
              │ wait for this one device             │ 3 requests in
              │ to finish                            │ flight at once
              ▼                                      ▼
        return to the application            ┌───────────────────────────┐
              │                              │ CQ ring (kernel writes)   │
              ▼                              └─────────────┬─────────────┘
  one request in flight per thread                        │
  one waiting thread per request             reap CQE, no syscall
                                                        ▼
                                             application continues

  COST     1 transition per request       1 transition per BATCH
  THREADS  1 blocked thread per request   a few threads drive all I/O
  OPS      1 request in flight            ring depth requests in flight
```

Both rings live in memory that the application maps with `io_uring_setup()` and `mmap()`. Kernel 5.4 and later map the submission queue and the completion queue with one `mmap()` call. The feature flag for this is `IORING_FEAT_SINGLE_MMAP`. Older kernels need more mapping calls.

Every request is a **submission queue entry (SQE)** of 64 bytes. Every result is a **completion queue entry (CQE)** of 16 bytes. An SQE holds the opcode, the file descriptor, the offset, the buffer, the flags, and a `user_data` field. The kernel copies that same `user_data` into the CQE. That field is how the application knows which request finished. A build can opt into 128-byte SQEs and 32-byte CQEs.

```text
ANATOMY OF THE SHARED MEMORY
═══════════════════════════════════════════════════════════════════

  USER SPACE                                KERNEL SIDE
  ──────────                                ───────────
  ┌──────────────────────────────────┐
  │ SQ ring  (application writes)    │
  │                                  │
  │   tail ──► [SQE][SQE][SQE] ──►   │──► kernel takes from head
  │   app appends here               │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │ CQ ring  (kernel writes)         │
  │                                  │
  │   tail ──► [CQE][CQE][CQE] ──►   │◄── kernel appends here
  │   app reaps from head            │
  └──────────────────────────────────┘

  SQE, 64 bytes                      CQE, 16 bytes
  ┌────────────────────────────┐     ┌────────────────────────────┐
  │ opcode  READ WRITE ACCEPT  │     │ user_data  (echoed back)   │
  │         FSYNC SEND ...     │     │ res        bytes or -errno │
  │ fd, off, addr, len         │     │ flags                      │
  │ user_data  ──► identity    │     └────────────────────────────┘
  │ flags      IOSQE_*         │
  └────────────────────────────┘
      │                                    one CQE per SQE
      │  no argument copy over a           user_data links the pair
      │  syscall boundary
      ▼
  the kernel also runs the op through an internal worker pool (io-wq)
  when the operation cannot complete inline
```

The interface has modes and features. Each one trades CPU for latency:

- **Default mode.** The application submits a batch with `io_uring_enter()`. One call covers many requests.
- **SQPOLL (`IORING_SETUP_SQPOLL`).** A kernel thread polls the SQ ring. The application then submits with no system call at all. The price is one busy CPU core.
- **Registered buffers and files.** The application pins buffers and file descriptors once. The kernel then skips the per-request page pinning and the per-request file lookup. The kernel can also move device data straight into the user buffer.
- **Linked requests.** A chain such as open, read, close runs as one unit from one submission.
- **Multishot operations.** One `ACCEPT` or `RECV` submission produces many completions. The application does not rearm the request after each event.
- **Completion on the submitting thread.** `IORING_SETUP_COOP_TASKRUN` and `IORING_SETUP_DEFER_TASKRUN` (Linux 6.1) remove inter-processor interrupts. `IORING_SETUP_SINGLE_ISSUER` (Linux 6.2) allows submission from one thread only.
- **IOPOLL.** The kernel polls the device for completions. This mode fits fast direct-I/O devices. A ring in IOPOLL mode cannot issue `fsync()`.

```
THE PERFORMANCE LADDER — WHAT EACH STEP BUYS AND COSTS
═══════════════════════════════════════════════════════════════════
  STEP                     GAIN                     COST
  ────────────────────────────────────────────────────────────────
  1 batch submissions      fewer kernel transitions needs a queue of
                           per request              ready work

  2 register buffers       no per-request pinning   buffers stay pinned,
                           no kernel-user copy      memory is not free

  3 linked requests        one submission for a     harder error paths
                           whole open/read/close    (partial chains)

  4 multishot accept       no rearm per event       lifecycle rules:
     or recv                                        cancel and drain

  5 SQPOLL                 no submission syscall    one dedicated core
                           at all                   runs hot

  6 IOPOLL                 no interrupt per         one core polls the
                           completion               device, fsync must
                                                    use another ring
  ────────────────────────────────────────────────────────────────
  Measure before you climb. Rings cut overhead only when many
  operations are in flight. A single request followed by a wait gains
  nothing, and it adds code.
```

io_uring is not the only interface with a similar goal. Each interface answers a different question:

```
epoll vs io_uring vs KERNEL-BYPASS I/O
═══════════════════════════════════════════════════════════════════
              SIGNAL          WHO MOVES THE      IS THE KERNEL
                              DATA               IN THE PATH?
  ─────────────────────────────────────────────────────────────
  epoll       readiness       kernel             yes
              "fd is ready"

  Linux AIO   completion      kernel             yes
  io_submit   "op is done"    direct I/O only,
                              few file systems

  io_uring    completion      kernel, or         yes
              "op is done"    directly into a
                              registered buffer

  SPDK/DPDK   completion      the application    NO
  user space                  owns the device    kernel bypass
  ─────────────────────────────────────────────────────────────
  epoll tells you when to call read(). io_uring performs the read and
  tells you when it is done. That difference removes one system call
  per operation. Kernel-bypass frameworks remove the kernel. io_uring
  keeps it. That is why io_uring works with files, sockets, and normal
  security policy, and it is also why it stays slower than bypass.
```

Seven design rules carry the pattern:

- Size the rings for peak in-flight work, not for average load. A full SQ ring blocks submission. A full CQ ring blocks the kernel.
- Reap the CQ often. A slow consumer stops the whole pipeline.
- Keep the rings mapped for the life of the process. A setup and a map per request remove the gain.
- Batch related operations. A submit-and-wait loop for each request gives the system call cost back.
- Start in default mode. Add SQPOLL, IOPOLL, or linked requests only after a measurement asks for them.
- Treat a failed operation as data. One `-EIO` CQE does not break the ring. Handle that entry and continue.
- Plan for the worker fallback. Operations that cannot complete inline move to kernel worker threads (`io-wq`). A measured case: with `O_DIRECT`, workers appear once a batch passes `nr_requests` (1023 on bare metal, 127 in one cloud VM), and also when the block size passes 512 KiB. Your fast path can leave the fast path.
- Pick predictable read patterns. Sequential scans, bitmap heap scans, and vacuum know their next pages. A random read followed by a compute step does not.

What it is not, and what it costs:

- **Linux only.** macOS, Windows, and BSD have no io_uring. Portable code needs a second path.
- **Support depends on the kernel, the file system, and the driver.** The interface needs Linux 5.1 or later. A reported PostgreSQL bug notes that io_uring does not work on kernels between 5.1 and 5.6. Most advanced features arrived much later than 5.1.
- **Security policy fights it.** io_uring often runs work on `io-wq` kernel threads, outside the system call path. seccomp filters, ptrace sandboxes, and syscall audit rules then see nothing. SQPOLL removes even the submit call. Chrome OS blocks `io_uring_setup` in renderer and GPU sandboxes. Android 12 and later blocks it for app processes. gVisor returns `ENOSYS`. Docker 25.0 and later block the io_uring syscalls in the default seccomp profile. Google removed io_uring from its production servers in 2023 after a run of exploitable kernel bugs, and its kernel security team reported that about 60% of one set of kernel CTF submissions attacked io_uring.
- **The CVE history is long, and the shape repeats.** A lifetime, refcount, or size calculation fails in the asynchronous teardown path. Two examples: CVE-2022-29582, a use-after-free in the file table handling (CVSS 7.8, fixed in 5.17.3 and 5.15.34), and CVE-2023-2598, an integer overflow in fixed buffer registration (fixed in 6.3).
- **A ring is a wide object by default.** Sandbox authors can lock one ring with `IORING_REGISTER_RESTRICTIONS`, which whitelists opcodes and register calls for that ring. SELinux and AppArmor can deny `sqpoll` and credential override through the `io_uring` object class. These tools exist because the default grants a lot.
- **Asynchronous I/O hides timing.** A backend that never blocks on a read shows little time in an I/O wait event. Profiles then read wrong. PostgreSQL needed the `pg_aios` view for this exact reason, and `EXPLAIN ANALYZE` no longer shows the full I/O cost.
- **It is harder to reason about than a thread pool.** Cancellation, multishot lifecycles, and completion ordering add states that a blocking design does not have. Use it for the hot path, not for every call.

### Example:

A platform team runs PostgreSQL 18 on Kubernetes. The storage is network-attached SSD with about 1 ms of read latency. A nightly report scans a 120 GB table, so the query reads many pages that are not in cache.

PostgreSQL 17 issued one blocking read at a time from the backend. PostgreSQL 18 (GA, 25 September 2025) added an asynchronous I/O subsystem for reads. The `io_method` setting selects the path, and it needs a server restart.

```text
THREE READ PATHS — SAME QUERY, DIFFERENT WAIT
═══════════════════════════════════════════════════════════════════

  io_method = sync           io_method = worker       io_method = io_uring
  ────────────────           ──────────────────       ───────────────────

  backend                    backend                  backend
    │                          │ request               │ SQE
    │ pread64() blocking       ▼                       ▼
    ▼                        postgres: io worker     kernel SQ ring
  [ kernel ] ──► [ disk ]      │ pread64()            │ io_uring_enter()
    │                          ▼                       ▼
    │ one read at a time     [ kernel ] ──► [ disk ] [ kernel ] ─► [ disk ]
    ▼                          │                       │ CQE
  backend waits in D state     │ one worker blocks     ▼
    │                          │ per read            backend reaps when
    ▼                          ▼                     it needs the data
  next page after this       backend waits for a      │
  read returns               free worker              ▼
    ≈ PostgreSQL 17                                  many reads already
                                                     in flight

  Measured on cold cache in a cloud environment: worker and io_uring
  gave a consistent 2x to 3x gain in read performance over sync.
  io_uring removes the io worker processes from the path entirely.
```

The team sets the value and restarts the server:

```
# postgresql.conf — PostgreSQL 18
io_method = 'worker'              # the default
# io_method = 'io_uring'          # needs a build with --with-liburing
effective_io_concurrency = 64     # now a real control, not advice
maintenance_io_concurrency = 16   # for vacuum and similar work
```

Then the deployment fails, and the reason is not the database:

```
THE TWO GATES THAT BLOCK THE io_uring PATH
═══════════════════════════════════════════════════════════════════

  GATE 1 — the binary has no liburing support
  ────────────────────────────────────────────────────────────────
  postgresql.conf:  io_method = 'io_uring'
        │
        ▼
  LOG:   invalid value for parameter "io_method": "io_uring"
  HINT:  Available values: sync, worker.
  FATAL: configuration file "postgresql.conf" contains errors
        │
        ▼
  RESULT: the server does not start.
  The PGDG packages build with --with-liburing. A distribution build
  or a custom image often does not.

  GATE 2 — liburing is present, but the sandbox blocks the call
  ────────────────────────────────────────────────────────────────
  backend ── io_uring_setup() ──► seccomp filter
                                        │
                                        ├── allow ──► ring starts
                                        │
                                        └── deny  ──► no ring, EPERM
                                                      (Docker 25.0+
                                                      blocks the
                                                      io_uring syscalls
                                                      by default)

  Check both gates before you write the value into a manifest:
    - the build flag: --with-liburing, or -Dliburing on meson
    - the kernel: io_uring needs Linux 5.1 or later
    - the sandbox: does the container profile allow io_uring_setup?
  Do not assume a silent fallback to worker. Read the log and the
  return code.
```

The team keeps `io_uring` in the hardened cluster off, and turns it on only where the threat model allows a relaxing seccomp profile. Inside the database, the change also moves the observability:

```
WHAT CHANGES AFTER THE SWITCH — OPERATIONS, NOT JUST SPEED
═══════════════════════════════════════════════════════════════════

  SIGNAL                  sync / worker            io_uring
  ─────────────────────────────────────────────────────────────
  io worker processes     visible in ps            gone from the path

  backend wait event      IO / AioIoCompletion,    backend looks idle
                          or DataFileRead          while I/O runs

  in-flight I/O view      not needed               SELECT * FROM pg_aios

  EXPLAIN ANALYZE         shows the read time      hides part of the
  I/O timing                                       I/O time

  effective_io_           almost advice            changes real
  concurrency                                      parallelism

  Key point: the switch removes processes and system calls from the
  read path. It does not remove the I/O wait. The wait moves out of
  view, so the team needs new signals.
```

The same technology now appears below the database layer. The authors of PostgreSQL 18 note that writes are still synchronous, and development builds for PostgreSQL 19 extend the io_uring path to buffered reads. Oracle published an architecture paper in September 2026 about io_uring in its storage layer, with per-process ring contexts. A December 2025 study measured io_uring for high-performance database engines and reported the same pattern: large gains when many operations stay in flight, and worker fallback when the batch or the block size grows too far.

The transferable habit is the lesson. Count the control-path cost for each operation, not only the device cost. Ask how many times the CPU must enter the kernel, how many threads wait, and how many operations stay in flight. io_uring is that count taken seriously, and it is also the reason the answer to "is it fast?" is a measurement and not a promise.
