---
title: "Service Discovery"
termSlug: "service-discovery"
year: 2026
month: 11
monthName: "November"
day: 13
order: 10
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Service discovery keeps a live list of service instances. An instance is one running process that serves traffic. Instances change address often. A restart gives a pod a new IP. A scale event adds..."
---
### Definition:

**Service discovery** keeps a live list of service instances. An instance is one
running process that serves traffic. Instances change address often. A restart
gives a pod a new IP. A scale event adds ten addresses. No developer can
hardcode those addresses. The system records each address, checks that it works,
and answers the client.

One name hides three jobs.

```text
THE THREE JOBS — one name, three separate problems
────────────────────────────────────────────────────────────────────────────────

  1 REGISTER   an instance joins the list when it starts,
               and leaves the list when it fails or stops

  2 RESOLVE    a client asks: "where is billing?"

  3 SELECT     someone picks one live instance from the answer:
               the client, the node, or a proxy

  the design decision is simple: WHERE does each job run?
```

```text
WITHOUT DISCOVERY                             WITH DISCOVERY
a hand-typed address                          a live list, checked
┌──────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│ config: ORDERS_URL=http://10.0.1.7:8080  │  │ client asks: "where is orders?"          │
│ 10 replicas, IP changes on every restart │  │ registry answers: 4 live addresses       │
└─────────────────┬────────────────────────┘  └─────────────────┬────────────────────────┘
                  ▼                                             ▼
┌──────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│ the config now points at a dead address  │  │ pick one: round-robin or least-loaded    │
└─────────────────┬────────────────────────┘  └─────────────────┬────────────────────────┘
                  ▼                                             ▼
   connection refused after the third deploy     the dead instance was already removed
   nobody knows which config file is wrong       the request reaches a live instance
```

Three models exist. Each one runs the three jobs in a different place.

```text
THREE MODELS — each one answers WHERE and WHO differently
────────────────────────────────────────────────────────────────────────────────

  A  DNS + ClusterIP            the Kubernetes default
     source of truth            Kubernetes API: Services + EndpointSlices
     selection happens          the node dataplane (kube-proxy, iptables/IPVS,
                                or an eBPF dataplane)
     granularity                one choice per connection
     scope                      one cluster

  B  registry + client library  Consul, etcd, ZooKeeper
     source of truth            the registry catalog, behind health checks
     selection happens          a library inside the calling process
     granularity                one choice per request
     scope                      any workload that embeds the library:
                                VMs, other clusters, other datacenters

  C  proxy / service mesh       Istio, Linkerd, Cilium
     source of truth            registry plus workload identity (SPIFFE ID)
     selection happens          a sidecar proxy next to each pod
     granularity                one choice per request, layer-7 aware
     scope                      every language in the cluster
```

**The Kubernetes path needs no discovery code.** A Service gets a stable
virtual IP (ClusterIP). No network interface owns that IP. kube-proxy on every
node programs packet rules that rewrite a connection to that IP toward one
backend pod. CoreDNS resolves the name to the virtual IP. The virtual IP never
changes, so DNS caching never serves a dead pod address. The real list lives in
EndpointSlices. A pod enters the list when its readiness probe passes. It leaves
the list when the probe fails or the pod stops.

A headless Service (`clusterIP: None`) skips the virtual IP. DNS returns the IPs
of all ready pods. The client picks one. This fits client-side balancing,
StatefulSets, and gRPC.

```text
LIFECYCLE — how an instance enters and leaves the list
────────────────────────────────────────────────────────────────────────────────

  start
    │ register, bound to a lease or an ephemeral node
    ▼
  readiness probe passes ─────────► LISTED: clients can find it
                                       │
                                       │ an active check or a heartbeat
                                       │ keeps it in the list
                                       │
                                       │ when the check fails N times,
                                       │ or the lease expires:
                                       ▼
                                   REMOVED: the answer skips it

  stop
    │ deregister, or fail the readiness probe first
    ▼
  wait P + C        P = the longest request, C = the client retry delay
    │
    ▼
  drain connection pools, then close
```

**The check decides what the list means.** A registry entry proves that a
process is alive. It does not prove that the process can serve. The check type
sets that boundary.

```text
CHECK TYPES — what each one can and cannot prove
════════════════════════════════════════════════════════════════════════════════

  type       runs where      proves                      does not prove
  ─────────  ──────────────  ──────────────────────────  ───────────────────────
  TCP        the agent       the port accepts            the app logic works
  HTTP       the agent,      the real request path       dependencies are alive
             through the     returns 2xx through the
             real path       handler
  TTL        the instance    the instance can send       the request path works:
  (push)     itself          a message                   a blocked handler can
                                                         still heartbeat
  script     the agent       a custom condition          the check is cheap
                                                         enough to run often

  rule: keep liveness checks shallow. They restart pods.
        deep checks (database, downstream services) belong on
        readiness, and a deep liveness check turns "the database
        is slow" into "restart every pod at once".
```

**Traps, in the order teams meet them.**

```text
TRAP LEDGER — what actually breaks
════════════════════════════════════════════════════════════════════════════════

  1  ALIVE, NOT SERVING
     the heartbeat comes from a background thread. the request path
     is blocked. the registry keeps listing the instance.
     fix: check through the real path, and eject on caller-side
     error rates (Envoy outlier detection: 5 consecutive 5xx,
     eject for 30 s, at most 10% of the pool ejected at once)

  2  THE GOOD-CITIZEN PROBE
     the readiness probe calls a shared database. the database
     slows down. every pod fails at once. every instance leaves
     every list. the platform returns 503 while every instance
     still serves cache reads.
     fix: readiness checks the instance itself (socket bound,
     config loaded, cache warm). dependency checks become a
     separate signal: alert on them, never remove endpoints
     on them alone.

  3  FLAPPING
     an instance near its limit passes and fails in turns. every
     watcher receives churn, and every client re-resolves.
     fix: hysteresis. Kubernetes uses failureThreshold 3 and
     successThreshold 1. Consul uses failures_before_critical.

  4  THREE STALE CACHES
     the resolver cache, the client library cache, and a pooled
     connection that never re-resolves. all three hold a dead
     address after the registry has moved on.
     fix: short TTL, deregister before shutdown, drain pools.
     Consul DNS ships TTL 0 by default for this reason.

  5  THE REGISTRATION GAP
     a new instance registers before it warms up. a stopping
     instance stays listed while in-flight requests drain.
     fix: register only after readiness. deregister before
     shutdown. then wait, then stop.

  6  IP REUSE
     a new pod receives the IP of a dead pod. a stale entry
     then reaches the wrong service.
     fix: verify identity, not the address. Use mTLS with a
     workload ID, or check the service name on the reply.
```

**The registry is a distributed system too.** It also picks a position on CAP.

```text
CP REGISTRY vs AP REGISTRY — a choice of failure, not a ranking
────────────────────────────────────────────────────────────────────────────────

  CP (etcd, ZooKeeper)                 AP (Eureka)
  ───────────────────────              ───────────────────────
  one linearizable list                both partitions keep writing
  a minority cannot register           stale endpoints can be served
  or renew a lease                     for minutes after a heal
  lose quorum: new registrations
  stop, leases expire, entries         self-preservation keeps the
  vanish from discovery                last known list up on purpose
  ────────────────────────────────────────────────────────────────────────────
  neither one is stronger. each chooses which failure it prefers:
  "no new registrations" or "stale addresses for a while".
```

```text
THE REGISTRY FAILS TOO — a 3-node etcd cluster, quorum = 2
════════════════════════════════════════════════════════════════════════════════

  one bad plan replaces 2 of 3 replicas at the same time
        │
        ▼
  quorum lost ──► no new registrations
              ──► no lease renewals
              ──► existing leases expire
              ──► services disappear from discovery
        │
        │  minutes pass
        ▼
  quorum returns, the list rebuilds, clients recover
  the cascade costs longer than the outage itself

  rules that come out of it:
    replicas in distinct availability zones
    upgrades one node at a time, with a quorum check between each
    quota headroom, so compaction never blocks consensus
    alert on quorum health, not only on "cluster: healthy"
    under heavy churn, watch a small prefix: 5,000 clients on one
    prefix plus a deploy that recycles 200 pods is a watch storm
```

**Defaults and figures worth knowing.** These come from vendor docs and public
benchmarks. Your traffic and hardware move them.

```text
DEFAULTS — published values, not guarantees
────────────────────────────────────────────────────────────────────────────────

  ZooKeeper session   tickTime 2,000 ms, negotiated 4 to 40 s
                      heartbeats at sessionTimeout / 3
                      the session owns the ephemeral nodes:
                      no heartbeat → session expires → nodes deleted
  etcd lease          TTL 5 to 30 s, keep-alive stream,
                      a background sweep every 500 ms
                      a key can outlive its lease by a sub-second window
  Consul DNS          TTL 0 by default, so downstream caches cannot go stale
                      a critical check removes the instance at once.
                      deregister_critical_service_after has a 1 min floor
  Envoy ejection      5 consecutive 5xx → eject for 30 s,
                      at most 10% of the pool ejected together
  sidecar cost        about 0.1 vCPU and 128 MB per pod,
                      about 1.5 to 3 ms added per hop
```

**What discovery does not replace.**

```text
DISCOVERY GIVES YOU                 IT DOES NOT GIVE YOU
─────────────────────────────────   ────────────────────────────────────────────
a live list of addresses            correct answers from those addresses
a health signal at the              application-level correctness: a registry
registration layer                  entry is proof of life, not proof of service
a selection point                   retries, timeouts, retry budgets
                                    (discovery does not retry for you)
one view inside one cluster         cross-cluster identity and failover
                                    (a mesh or locality settings add this)
```

### Example:

A payments platform runs 60 services on one Kubernetes cluster. Two traffic
shapes: short HTTP calls, and one gRPC path from checkout to the fraud
service. The team learns the model in three incidents.

```text
BEFORE — three attempts at finding instances
════════════════════════════════════════════════════════════════════════════════

  week 1   hardcoded IPs in config files
           deploy #7 changes the billing IP
           → 4 hours of connection refused, no alert points at the cause

  week 2   a script writes an endpoint file every 5 minutes
           the script misses two pods
           → uneven load, found during a latency review

  week 3   Kubernetes Services, the platform default
           register: automatic, gated by the readiness probe
           resolve:  CoreDNS returns the ClusterIP
           select:   kube-proxy, one choice per connection
           result:   the HTTP path needs no discovery code at all
```

The gRPC path still breaks.

```text
INCIDENT 1 — one long-lived connection, nine idle pods
────────────────────────────────────────────────────────────────────────────────

  checkout pod                               billing pods
  ┌──────────────────────────┐               ┌───────────────────────────┐
  │ one HTTP/2 channel,      │               │ pod A    92% CPU          │
  │ kept open for minutes,   │──────────────►│ pod B     3% CPU          │
  │ retries inside it        │   1 channel   │ pod C     2% CPU          │
  │ one connection only      │               │ ...                       │
  │ held for its lifetime    │               │ pod J     1% CPU          │
  └──────────────────────────┘               └───────────────────────────┘

  per-connection balancing makes ONE choice at connect time,
  for the whole life of the channel
        → one pod carries the whole gRPC path
```

The fix keeps the platform default and changes only who selects.

```text
FIX — a headless Service, the client selects per request
────────────────────────────────────────────────────────────────────────────────

  billing-headless   (clusterIP: None)
        │  DNS returns every ready pod IP
        ▼
  client holds [10.0.1.7, 10.0.1.8, ... 10.0.1.16]
        │  round-robin per request (gRPC dns + round_robin policy)
        ├──► pod A    11% CPU
        ├──► pod B    10% CPU
        └──► pod J    11% CPU
                       even load, no proxy in the path

  the other option is a sidecar that balances per request:
  about 0.1 vCPU and 1.5 to 3 ms per hop.
  the team takes the headless route for gRPC, and keeps
  ClusterIP for the HTTP path.
```

The second incident comes from the health checker, not from discovery.

```text
INCIDENT 2 — the health checker causes the outage
════════════════════════════════════════════════════════════════════════════════

  readiness probe:   GET /ready  →  SELECT count(*) FROM orders
        │
        ▼  02:00  database maintenance, 20 s stall
        │
        ▼  every pod fails the probe at the same moment
        │
        ▼  every endpoint leaves every EndpointSlice
        │
        ▼  platform-wide 503, while every instance still serves
           cache reads and static responses

  the registry did its job. the probe asked the wrong question.
        │
        ▼  fix
  readiness   → instance-local state only: socket bound, config
                loaded, cache warm
  deep checks → a separate signal: alert on them, never let them
                remove endpoints by themselves
```

The third incident appears in every deploy.

```text
INCIDENT 3 — every deploy looked like a crash
────────────────────────────────────────────────────────────────────────────────

  wrong order                      correct order
  ───────────────────────          ──────────────────────────────────────
  SIGTERM                          1  fail readiness, leave the list
    ▼                              2  keep serving: wait P + C
  process exits                       P = the longest request
    ▼                                 C = the client retry delay
  in-flight requests reset         3  drain connection pools
  clients see 502                  4  exit
```

Day 30 state:

```text
END STATE — what the platform runs on day 30
────────────────────────────────────────────────────────────────────────────────

  register    automatic: readiness gate, register only when warm
  resolve     CoreDNS for HTTP (ClusterIP), headless DNS for gRPC
  select      kube-proxy per connection,
              client-side per request
  health      shallow liveness, instance-local readiness,
              dependency checks as alert-only signals
  shutdown    deregister → wait P + C → drain → exit
  identity    mTLS with workload IDs, so an IP address never
              proves who called
  alerts      healthy fraction per service, ejection rate,
              re-resolution rate, endpoint count deltas
```

The honest part. Discovery proves that an address exists and that a check
passed. It does not prove that the instance gives correct answers. Keep
caller-side error rates per instance, and eject on them. The list itself is a
distributed system: quorum loss, watch storms, and a slow leader all hit the
registry, so replicas go into distinct zones and upgrades run one node at a
time. Caches fight you at three layers. The rule is bounded staleness: serve
the cached list for a fixed number of seconds after the watch breaks, then
refuse. Most client code implements only the "keep serving" half. And the
default wins first: at 60 services in one cluster, plain ClusterIP covered
everything except the gRPC path. Add a registry, a mesh, or a client library
only when a concrete signal appears.

The punchline: discovery moves the address out of the config file and into a
checked, live list. Two choices decide its quality: who selects the instance,
and what the probe asks. Get both right, and an IP address stops being data
your team has to remember.
