---
title: "Service Mesh"
termSlug: "service-mesh"
year: 2026
month: 11
monthName: "November"
day: 3
order: 2
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "A service mesh is a dedicated layer that carries service-to-service traffic. It does four jobs for every call between workloads: Identity. Each workload gets a cryptographic ID. In Kubernetes this..."
---
### Definition:

A **service mesh** is a dedicated layer that carries service-to-service traffic. It does four jobs for every call between workloads:

1. **Identity.** Each workload gets a cryptographic ID. In Kubernetes this is usually a SPIFFE ID derived from the service account.
2. **Encryption.** Proxies use that ID for mutual TLS. Both sides prove who they are before a byte of payload moves.
3. **Policy.** The mesh allows or denies a call by identity, not by IP address. A pod that restarts with a new IP keeps the same identity.
4. **Traffic control and telemetry.** Retries, timeouts, weighted splits, and one metric set for every hop.

The mesh adds no new feature to your application. It moves existing features out of the application. Before the mesh, `orders` (Go) and `billing` (Java) each carry a retry loop, a TLS client, a timeout setting, and a metrics SDK. Two teams write those four things twice. The two versions disagree, and nobody knows which one is correct.

After the mesh, both apps speak plain HTTP. A proxy next to each pod does the rest. The application code shrinks. The behaviour becomes the same for every language in the cluster.

```text
WITHOUT A MESH — each app owns its networking      WITH A MESH — one proxy layer owns it
═══════════════════════════════════════════════    ═══════════════════════════════════════════════

   orders (Go)          billing (Java)                 orders           billing
   ┌────────────────┐   ┌────────────────┐             ┌─────────┐      ┌─────────┐
   │ retry loop     │   │ retry loop     │             │  app    │      │  app    │
   │ TLS client     │   │ TLS client     │             │  only   │      │  only   │
   │ metrics SDK    │   │ metrics SDK    │             └────┬────┘      └────┬────┘
   │ timeout config │   │ timeout config │             ┌────▼────┐      ┌────▼────┐
   └───────┬────────┘   └───────┬────────┘             │ proxy   │      │ proxy   │
           │                    │                      └────┬────┘      └────┬────┘
           └─────────┬──────────┘                           └──────┬───────┘
                     ▼                                             ▼
      plain TCP · no identity · 2 retry policies        mTLS · SPIFFE identity · 1 policy
      "who called me?" = an IP address                  "who called me?" = a workload ID
      new language = new library to wire                new language = no work at all
```

**Two halves, two failure modes.** The **data plane** moves the packets: the proxies. The **control plane** (`istiod`, Linkerd's destination controller, Cilium's operator) watches the Kubernetes API and pushes configuration to those proxies. When the control plane dies, existing connections keep working and new routes stop. When the data plane dies, requests fail. Keep the two failure modes separate in your runbooks, because the fixes are different.

**Where the proxy sits is the main design choice in 2026.** Three shapes exist:

- **Sidecar per pod.** Istio classic mode and Linkerd. One proxy container in every pod. Inbound and outbound traffic pass through it. L7 features work everywhere, with no extra hop.
- **Per-node L4 proxy plus L7 waypoints.** Istio ambient. A `ztunnel` on each node handles mTLS and L4 policy. An Envoy **waypoint** runs only for the namespaces or services that need HTTP-level routing. Cilium does L4 in eBPF and runs a per-node Envoy for L7.
- **Native sidecars.** Kubernetes made sidecar containers stable in v1.33. This fixes startup order and Job termination. It does not reduce cost, because there is still one proxy per pod.

The cost follows a multiplier. Sidecars scale with **pods**. ztunnels scale with **nodes**. Waypoints scale with the **namespaces that need L7**.

```text
THE MULTIPLIER — cost depends on where the proxy sits
══════════════════════════════════════════════════════════════════════════════

 SIDECAR                              AMBIENT / eBPF
 ──────────────────────────────       ─────────────────────────────────────────
 node  (40 pods)                      node  (40 pods)
 ┌────────────────────────────┐       ┌───────────────────────────────────────┐
 │ ┌──┐┌──┐┌──┐┌──┐┌──┐       │       │ ┌───────────────────────────────────┐ │
 │ │p ││p ││p ││p ││p │  ...  │       │ │ ztunnel  (1 per node, L4 + mTLS)  │ │
 │ └──┘└──┘└──┘└──┘└──┘       │       │ └───────────────────────────────────┘ │
 │  40 proxies per node       │       │   1 proxy per node                    │
 └────────────────────────────┘       └───────────────────────────────────────┘
   600 pods -> 600 proxies              600 pods on 40 nodes -> 40 ztunnels
   L7 everywhere, in-path               L7 only where a waypoint exists

 MEASURED P99 COST — one GCP cluster, mTLS on, 3,200 RPS, baseline 0.22 s
 (Tel Aviv University + Red Hat, Nov 2024)
 ─────────────────────────────────────────────────────────────────────────────
   no mesh          baseline
   Istio ambient    +8%
   Linkerd          +33%
   Cilium           +99%
   Istio sidecar    +166%
```

The numbers do not rank the products. They show the shape: **every proxy in the request path costs something, and the count of proxies is a design decision.** Read the benchmark with its own caveat. The study ran one workload on one cluster, and a different traffic mix moves the numbers.

**What a mesh gives you, and what it does not:**

```text
MESH REPLACES                          MESH DOES NOT REPLACE
────────────────────────────────────   ──────────────────────────────────────────
per-app TLS client libraries           NetworkPolicy at the CNI layer
per-app retry and timeout code         a retry budget you never tuned
per-app metrics instrumentation        application-level idempotency
IP allowlists between services         secret management
manual cert rotation                   someone who can read the data path at 3 a.m.
```

### Example:

A payments platform runs 140 services and 600 pods on 40 nodes. Three languages: Go, Java, and Python. Compliance needs encrypted service-to-service traffic, and each service must prove its identity. The platform team starts with Istio sidecars.

The first month works. The second month brings the bill. Each pod reserves a proxy. At a planning figure of about 50 MB per sidecar, 600 pods reserve roughly 30 GB of memory for proxies alone, spread across the cluster. Every hop adds latency. Pod startup slows, because the proxy must be ready before the app receives traffic.

The team moves to ambient mode. The result is one ztunnel per node, so 40 proxies instead of 600. Six namespaces need HTTP routing, so six waypoints cover them. The other 134 services keep L4 mTLS and identity policy with no L7 proxy at all.

```text
MIGRATION — same cluster, same 600 pods
══════════════════════════════════════════════════════════════════════════════

 BEFORE  sidecar mode                     AFTER  ambient mode
 ────────────────────────────────────     ──────────────────────────────────────
 600 proxies   (one per pod)              40 ztunnels  (one per node)
 ~30 GB reserved for proxies              6 waypoints  (L7 namespaces only)
 every hop in-path for L7                 L4 path stays in the node
 p99 added: +2 to +5 ms per hop           p99 added: +0.5 to +1 ms (L4 only)
 pod start: proxy gates the app           no proxy in the pod
 cert rotation: 600 identities            node agents + waypoints

 rollout order that worked
 ────────────────────────────────────────
 1. install control plane, ambient profile      (no traffic change)
 2. label one non-critical namespace            (ztunnel takes over its traffic)
 3. verify mTLS: istioctl x describe pod        (peer identity = SPIFFE)
 4. move namespaces one at a time, watch p99    (rollback = remove the label)
 5. delete the sidecar injection webhook        (last step, not first)
```

Step 5 comes last for a reason. Two data planes can run at the same time. Removing the injection webhook first strands every pod that still expects its sidecar.

Then the failure that teaches the most. The team writes an `AuthorizationPolicy` that allows `POST /v1/charge` only for the `checkout` identity. The object applies without error. `kubectl get` shows it as accepted. The traffic test passes, and the policy is wrong: the `billing` service still reaches `/v1/charge`.

```text
THE QUIET FAILURE — L7 policy with no L7 proxy
══════════════════════════════════════════════════════════════════════════════

  AuthorizationPolicy  rules: method POST, path /v1/charge, from checkout
        │
        ▼
  applied to namespace "payments"   ──►  accepted, status: no error
        │
        ▼
  does this namespace have a waypoint?
        │
        ├── YES ──► Envoy waypoint evaluates method + path      policy enforced
        │
        └── NO  ──► ztunnel sees L4 only: src identity, dst port
                    method and path are not visible at L4
                    ─────────────────────────────────────────
                    result: connection ALLOWED, rule silently skipped
```

The ztunnel cannot read an HTTP method. It works on connections. A policy with HTTP fields needs an L7 proxy to evaluate it. The fix is one label on the namespace:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    istio.io/use-waypoint: waypoint
```

A waypoint pod starts, the policy takes effect, and `billing` now receives a 403 on `/v1/charge`. The lesson is general: **a policy object that applies is not a policy that runs.** After every ambient migration, test one call that must be denied. Do not test only the calls that must pass.

The last piece is portability. The team writes the canary split as a Gateway API `HTTPRoute` bound to a Service, not as an Istio `VirtualService`. Istio, Cilium, and Linkerd all read this API family. The next mesh change becomes a data plane migration, not a rewrite of every route.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: checkout-canary
  namespace: payments
spec:
  parentRefs:
  - group: ""          # parent is a Service, not a Gateway (GAMMA)
    kind: Service
    name: checkout
    port: 8080
  rules:
  - backendRefs:
    - name: checkout-v1
      port: 8080
      weight: 95
    - name: checkout-v2
      port: 8080
      weight: 5
```

The honest part. The mesh did not fix the retry storm that hit them in week three. Each app still had its own retry count, and the mesh added its own retries on top. Three retries at two layers is nine requests for one user click. They set a retry budget in the mesh and cut the app-level retries to zero for meshed calls. The mesh also does not replace `NetworkPolicy`, and it does not remove the need for idempotent handlers. And at 20 services with one team, a mesh is usually the wrong trade: a gateway, OpenTelemetry, and sane client timeouts cover most of the value at a fraction of the surface.

The punchline: a service mesh is a platform decision, not a library. You pay one more component in the request path. In return, every pod in every language gets the same identity, the same encryption, the same policy, and the same telemetry. That trade is good at 140 services and 40 nodes. It is bad at 12 services and one team. Measure your pod count before you measure the vendor's feature list.
