---
title: "Blue-Green Deployment"
termSlug: "blue-green-deployment"
year: 2026
month: 10
monthName: "October"
day: 12
order: 8
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "A blue-green deployment runs two identical production environments. At any moment, one environment serves all user traffic. The other environment holds the next release. You test the new release in..."
---
### Definition:

A **blue-green deployment** runs two identical production environments. At any moment, one environment serves all user traffic. The other environment holds the next release. You test the new release in the idle environment. Then you switch the traffic to it in one step. The switch is the release.

The two environments are named **blue** and **green**. The names carry no meaning. Only the pointer matters. Before the switch, blue serves traffic. After the switch, green serves traffic.

The core idea is one split: **deploy** is not **release**. Deploy puts the new code on hardware. Release sends user traffic to that code. Blue-green inserts a gap between the two steps. The gap is where you test the new version.

The naive path has no gap. You stop the old version. You start the new version on the same hosts. During the swap, no host serves traffic.

```
NAIVE SWAP (one environment)              BLUE-GREEN (two environments)
══════════════════════════════════        ══════════════════════════════════════

  ┌─────────────────────────┐             ┌─────────────────────────┐
  │ pool: 4 hosts, v2.4.0   │             │ BLUE   4 hosts v2.4.0   │◀── 100% traffic
  └─────────────────────────┘             └─────────────────────────┘
        │ stop hosts, one by one          ┌─────────────────────────┐
        ▼                                 │ GREEN  4 hosts v2.5.0   │◀── 0% traffic
  ┌─────────┐                                   smoke test, load test,
  │  DOWN   │  no host serves traffic            and migration check
  └─────────┘  during the swap                 │
        │ start v2.5.0                         ▼
        ▼                                 switch the pointer (1 step)
  ┌─────────────────────────┐             ┌─────────────────────────┐
  │ pool: 4 hosts, v2.5.0   │             │ BLUE   4 hosts v2.4.0   │◀── 0% traffic
  └─────────────────────────┘             └─────────────────────────┘
                                          ┌─────────────────────────┐
   the user sees errors and timeouts      │ GREEN  4 hosts v2.5.0   │◀── 100% traffic
   while the pool is empty                └─────────────────────────┘

                                          rollback = switch the pointer back
                                          (the old pool is still warm)
```

Blue-green is one of four standard release patterns. The patterns differ in one question: how does traffic move?

```
FOUR RELEASE PATTERNS — HOW TRAFFIC MOVES
════════════════════════════════════════════════════════════════════════════════
  PATTERN      TRAFFIC SHIFT          ROLLBACK        EXTRA FLEET   BLAST RADIUS
                                                      COST?         ON A BAD BUILD
 ──────────────────────────────────────────────────────────────────────────────
  Recreate     all down, then all up  slow: redeploy  no            100%
                                      the old build
  Rolling      pod by pod, 2 of 4     slow: roll the  no            0% → 100%
               alive at all times     whole pool back                (slow rise)
  Blue-green   one atomic flip        fast: flip the  yes: 2x       100%
               0% → 100%              pointer back     fleet
  Canary       small slice first,     fast: send all  yes: small    1% → 100%
               then ramp up           traffic back     canary slice  (slow rise)
 ──────────────────────────────────────────────────────────────────────────────
  Rule of thumb: blue-green buys a one-step rollback, and you pay for it with a
  second full fleet and a hard cut for every user at the same moment.
```

The cost is honest. Blue-green doubles the running fleet for the length of the window. A canary costs less and limits the damage of a bad build. A canary is slower and needs metric-driven traffic control. So blue-green suits a stateful upgrade with a clear, testable result. Canary suits a risky change on a high-traffic path.

**In Kubernetes.** The standard tool in 2026 is Argo Rollouts. It replaces the `Deployment` kind with a `Rollout` kind. Two `Service` objects point the traffic:

```
KUBERNETES MECHANICS (Argo Rollouts blueGreen strategy)
═══════════════════════════════════════════════════════════════════════════

  Ingress / Gateway ──▶ Service "payment-active"  ──selector──▶ ReplicaSet v2.4.0
                                                                  (blue, live)

  test client        ──▶ Service "payment-preview" ──selector──▶ ReplicaSet v2.5.0
                                                                  (green, idle)

  the controller injects pod-template-hash into both Service selectors.

  PROMOTION
  ┌─────────────────────────────────────────────────────────────────────┐
  │ 1. active selector  : hash(v2.4.0)  →  hash(v2.5.0)   (atomic flip) │
  │ 2. old ReplicaSet   : stays alive for scaleDownDelaySeconds         │
  │                       (default 30 s) so in-flight requests drain    │
  │ 3. after the delay  : old ReplicaSet scales down to 0               │
  └─────────────────────────────────────────────────────────────────────┘
```

Three details from the tool set the real behavior:

- **`autoPromotionEnabled: false`** pauses the rollout before the flip. A human or a CI gate then runs `kubectl argo rollouts promote`. Use this on regulated paths.
- **`scaleDownDelaySeconds`** keeps the old ReplicaSet warm after the flip. kube-proxy updates its iptables rules on every node with a delay. A shorter value can send a packet to a node that already killed the old pod.
- **`previewReplicaCount`** runs fewer green pods during the test. The controller scales green to the full `spec.replicas` before the flip.

One tool caveat is documented and not fixable in the controller. The AWS ALB Ingress Controller does not update target groups in an atomic way. It can drain the stable target group before it registers the new pods. The Argo Rollouts docs then state that ALB Ingress with the blue-green strategy is not supported without a chance of downtime. Use NGINX, Istio, or the Gateway API if you need a clean cut.

**The hard part is state, not traffic.** A stateless HTTP service switches in one step. Everything else needs care:

- **Session state.** In-memory sessions die with the old pool. Move sessions to Redis or to signed cookies before you adopt blue-green.
- **Database schema.** Both versions read the same database during the window. So the schema must satisfy both. The fix is the **expand-contract** pattern: add the new column (expand), deploy code that writes both and reads the new one (migrate), then drop the old column (contract) in a later release.
- **Queues and cron jobs.** Two versions can consume the same queue. A green consumer can take a message that only blue understands. Namespace the queues, or keep consumers single-version.
- **StatefulSets.** Data must move between the two stacks. Blue-green is a poor fit here. Most teams prefer rolling updates for stateful workloads.
- **Long-lived connections.** WebSockets and gRPC streams do not move on a pointer flip. Drain them with a deadline, or accept one reconnect.

**The security trap.** The idle environment is easy to forget. It runs old code with old CVEs, and it stays in the network. The 2026 Kubernetes guidance is plain: apply the same patches, image scans, and network policies to both stacks until you decommission the other one. Otherwise you keep a second, quiet attack surface for no benefit.

Two more costs stay on the table:

- The second fleet is a real bill. Two full stacks for a 30-minute window is fine. Two full stacks as a permanent shape is not.
- A hard cut moves 100% of users to the new build in one second. That is the point of the pattern and also its main risk. Add a canary stage in front if the build is risky.

### Example:

A payments team ships `payment-api v2.5.0`. The service is stateless. The database is PostgreSQL. The team runs four replicas per stack.

```
CUTOVER TIMELINE (T+mm:ss) — payment-api v2.4.0 → v2.5.0
════════════════════════════════════════════════════════════════════════════════

  BLUE  ████████████████████████████████████████████ 100% ..............
  GREEN ..................... 0% ▏smoke ▏▏ 100% ████████████████████████

  T+00:00  BLUE 100%   GREEN 0%    schema migration step 1 (expand):
                                   ADD COLUMN risk_score int NULL
                                   (old code ignores it, so both versions work)

  T+02:00  BLUE 100%   GREEN 0%    deploy v2.5.0 to GREEN, 4 replicas
                                   GREEN writes risk_score and reads it

  T+05:00  BLUE 100%   GREEN 0%    tests against Service payment-preview
                                   ┌────────────────────────────────────┐
                                   │ replay 5,000 live requests          │
                                   │ 5xx rate   0.00%   (SLO: < 0.1%)    │
                                   │ p99      142 ms    (SLO: < 300 ms)  │
                                   │ refund parity vs BLUE: 100%         │
                                   └────────────────────────────────────┘

  T+06:00  BLUE 0%     GREEN 100%  PROMOTE: active selector flips to the
                                   green ReplicaSet. 3,400 in-flight
                                   requests finish on BLUE (drain window)

  T+06:30  BLUE 0%     GREEN 100%  scaleDownDelaySeconds expires.
                                   BLUE scales down. Cost halves.

  T+2 days BLUE archived           migration step 3 (contract):
                                   DROP COLUMN legacy_risk_flag
                                   (only after v2.5.0 is the only version)

  ── failure path ──────────────────────────────────────────────────────────
  T+06:00  BLUE 0%     GREEN 100%  if 5xx climbs above 0.5% in the first
                                   60 seconds: flip the selector back.
                                   BLUE is still warm, so recovery is
                                   one step, not one redeploy.
```

The rollout manifest that produces this timeline:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-api
spec:
  replicas: 4
  revisionHistoryLimit: 3
  selector:
    matchLabels: { app: payment-api }
  template:
    metadata:
      labels: { app: payment-api }
    spec:
      containers:
      - name: payment-api
        image: registry.example.com/payment-api:v2.5.0
        ports: [{ containerPort: 8080 }]
  strategy:
    blueGreen:
      activeService: payment-active     # mandatory: serves live traffic
      previewService: payment-preview   # optional: serves test traffic
      autoPromotionEnabled: false       # stop before the flip
      scaleDownDelaySeconds: 300        # drain in-flight requests
      abortScaleDownDelaySeconds: 60    # fast abort keeps old just in case
```

The promotion step is one command, and the abort is one command:

```
kubectl argo rollouts promote payment-api     # flip active to green
kubectl argo rollouts abort   payment-api     # flip active back to blue
```

That pair is the whole value of the pattern. Deploy and release are separate events. Rollback is a pointer change, and the old stack is already warm.
