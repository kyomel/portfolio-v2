---
title: "Admission Control"
termSlug: "admission-control"
year: 2026
month: 7
monthName: "July"
day: 20
order: 13
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "Admission Control is a gatekeeper that intercepts requests to a system before they are persisted or executed — and either allows, denies, or mutates them based on predefined policies. It is the las..."
---
### Definition:

Admission Control is a gatekeeper that intercepts requests to a system before they are persisted or executed — and either allows, denies, or mutates them based on predefined policies. It is the last line of defense before a change becomes permanent: the request has already been authenticated and authorized, but admission control checks whether it should actually happen based on operational rules, security constraints, or business logic.

The concept originated in Kubernetes (where Admission Controllers intercept API server requests before pod creation), but applies broadly to any system where you need to enforce "this must always be true" rules:

```text
WHERE ADMISSION CONTROL SITS:
═══════════════════════════════════════════════════════════════

  USER REQUEST
  (e.g., "Create a pod with privileged access")
       │
       ▼
  ┌──────────────────────┐
  │  1. Authentication   │  ← "Who are you?"
  │   ─────────────────   │
  │  Verifies identity   │
  │  (JWT token, cert)   │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │  2. Authorization    │  ← "Are you allowed to do this?"
  │   ─────────────────   │
  │  RBAC / IAM check    │
  │  (Can you create     │
  │   pods at all?)      │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │  3. ADMISSION CONTROL│  ← "SHOULD this happen?"
  │   ─────────────────   │
  │  Policy evaluation   │
  │  (Even though you    │
  │  CAN create pods,   │
  │  should this         │
  │  PARTICULAR pod      │
  │  be allowed?)        │
  └──────────┬───────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
  ALLOWED          DENIED
  (created with     (rejected with
   possible         explanation)
   mutations)

  KEY: At the admission control stage, the request passes
  through AUTHENTICATION (who) and AUTHORIZATION (can they)
  before reaching ADMISSION CONTROL (should they).
```

### Example:

A visual flow of how Admission Control works in Kubernetes — showing a pod creation request going through multiple admission controllers before being accepted or rejected.

A developer tries to deploy a pod. The organization has three policies:
- Every pod MUST have resource limits
- Every pod MUST have a sidecar proxy injected
- NO pod can run as root(3/11)

```text
═══════════════════════════════════════════════════════════════
  THE POD CREATION REQUEST
═══════════════════════════════════════════════════════════════

  Developer kubectl command:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  kubectl run web-app --image=nginx:latest               │
  │                                                         │
  │  (No resource limits specified.                         │
  │   Running as root by default.)                          │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
  THE ADMISSION CONTROL PIPELINE
═══════════════════════════════════════════════════════════════

  REQUEST ARRIVES AT KUBERNETES API SERVER
  ─────────────────────────────────────────
  │
  ▼
 ┌──────────────────────────────────────────────────────────┐
 │                                                          │
 │  STEP 1: Mutating Admission Controller                   │
 │  ───────────────────────────────────────                 │
 │                                                          │
 │  Controller: "Pod must have resource limits."            │
 │                                                          │
 │  Checks current request:                                  │
 │  ┌─────────────────────────────────────────────────┐    │
 │  │  containers:                                     │    │
 │  │  - name: web-app                                 │    │
 │  │    image: nginx:latest                           │    │
 │  │    resources: {}        ← EMPTY!                 │    │
 │  └─────────────────────────────────────────────────┘    │
 │                                                          │
 │  MUTATES the request — adds default limits:              │
 │  ┌─────────────────────────────────────────────────┐    │
  │  │  containers:                                     │    │
  │  │  - name: web-app                                 │    │
  │  │    image: nginx:latest                           │    │
  │  │    resources:                                    │    │
  │  │      limits:                                     │    │
  │  │        cpu: "500m"                               │    │
  │  │        memory: "512Mi"                           │    │
  │  │      requests:                                   │    │
  │  │        cpu: "100m"                               │    │
  │  │        memory: "128Mi"                           │    │
  │  └─────────────────────────────────────────────────┘    │
  │                                                          │
  │  ✅ Pod mutated — resource limits injected               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
   │
   ▼
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  STEP 2: Second Mutating Admission Controller             │
  │  ───────────────────────────────────────────────         │
  │                                                          │
  │  Controller: "Every pod gets a sidecar proxy."           │
  │                                                          │
  │  MUTATES the request — injects Envoy sidecar:            │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  containers:                                     │    │
  │  │  - name: web-app          ← original app         │    │
  │  │    ...                                           │    │
  │  │  - name: envoy-proxy      ← INJECTED!            │    │
  │  │    image: envoyproxy/envoy:v3                     │    │
  │  │    ports:                                         │    │
  │  │    - containerPort: 9901                          │    │
   │  └─────────────────────────────────────────────────┘    │
   │                                                          │
   │  ✅ Sidecar injected — all traffic now routes            │
   │     through the service mesh                             │
   │                                                          │
   └──────────────────────────────────────────────────────────┘
    │
    ▼
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   │  STEP 3: Validating Admission Controller                  │
   │  ──────────────────────────────────────────              │
   │                                                          │
   │  Controller: "No containers may run as root."            │
   │                                                          │
   │  Checks current request (after all mutations):            │
   │  ┌─────────────────────────────────────────────────┐    │
   │  │  containers:                                     │    │
   │  │  - name: web-app                                 │    │
   │  │    image: nginx:latest                           │    │
   │  │    securityContext:                               │    │
   │  │      runAsUser: 0        ← ROOT! (default)       │    │
   │  │  - name: envoy-proxy                             │    │
   │  │    image: envoyproxy/envoy:v3                     │    │
   │  │    securityContext:                               │    │
   │  │      runAsUser: 1000     ← OK (non-root)         │    │
   │  └─────────────────────────────────────────────────┘    │
   │                                                          │
   │  DENIES the request:                                     │
   │  ┌─────────────────────────────────────────────────┐    │
   │  │  ❌ REJECTED: Container "web-app" is running     │    │
   │  │     as root (securityContext.runAsUser: 0).      │    │
   │  │     Pods must not run as root.                   │    │
    │  │     Set runAsUser to non-zero.                   │    │
    │  └─────────────────────────────────────────────────┘    │
    │                                                          │
    └──────────────────────────────────────────────────────────┘
     │
     ▼
     POD IS NOT CREATED
     ───────────────────
     The developer sees:
     "Error: admission webhook 'no-root-pods.example.com'
      denied the request: Container 'web-app' is running
      as root."
   
     Developer fixes the deployment:
     ┌─────────────────────────────────────────────────────────┐
     │                                                         │
     │  securityContext:                                       │
     │    runAsUser: 1001         ← NON-ROOT user              │
     │    runAsGroup: 3000                                     │
     │    allowPrivilegeEscalation: false                      │
     │                                                         │
     └─────────────────────────────────────────────────────────┘
   
     Re-runs → passes ALL admission controllers → pod created ✅
```
