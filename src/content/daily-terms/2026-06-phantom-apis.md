---
title: "Phantom APIs"
termSlug: "phantom-apis"
year: 2026
month: 6
monthName: "June"
day: 24
order: 18
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "Phantom APIs are undocumented, unapproved, and often unknown API endpoints that exist in production but were never formally reviewed, spec'd, or added to the service catalog. They are \"phantom\" bec..."
---
### Definition:

Phantom APIs are undocumented, unapproved, and often unknown API endpoints that exist in production but were never formally reviewed, spec'd, or added to the service catalog. They are "phantom" because they serve real traffic and handle real data, yet they live outside any governance boundary — no OpenAPI spec, no design review, no security audit, no entry in the API inventory.

How they're born (the AI multiplier):

The primary driver of phantom APIs in 2025–2026 is AI-generated code. A developer asks an AI assistant (Copilot, Cursor, Claude, etc.) to "add an endpoint that lets support staff look up account status." The model, trained on millions of real-world codebases, generates:

The requested endpoint (with auth) ✅
An undocumented debug variant (raw ID, no scope check, maybe a ?debug=true flag) 👻

The PR is reviewed for logic bugs — not for the existence of extra endpoints. The debug route looks plausible. It compiles. It passes smoke tests (which check the happy path). It ships. The spec is never updated. The gateway doesn't know about it. The route inherits default framework permissions.

Now there's an endpoint in production that nobody knows about, serving data — and it's findable via automated recon tools in minutes.

Why it's dangerous:

| Factor | Impact |
|--------|--------|
| Invisible | Not in your API inventory → no monitoring, no rate limiting, no auth audit |
| AI-generated | AI models often default to broad object access, wildcard scopes, and debug patterns from training data |
| GraphQL multiplier | One deeply nested GraphQL query can hit multiple resolvers with missing auth — "one bug wearing one URL" becomes "a dozen bugs wearing one URL" |
| Speed of exploitation | Average breakout time fell to 29 minutes in 2025 (from 98 min in 2021). Fastest observed: 27 seconds | (1/8)
| Post-auth blind spot | 95% of API attacks originate from authenticated sessions — the "front door" isn't the problem, lateral movement after auth is |

### Example:

A CI/CD pipeline that detects and blocks phantom APIs before they reach production.

```
import json
import hashlib
from pathlib import Path
from typing import Set, List, Dict, Optional

# ─── Phase 1: Live API Inventory from Code ───

def extract_routes_from_code(codebase_path: str) -> Set[str]:
    """Parse source to find all registered HTTP routes.
       In practice, this would use AST parsing for each framework
       (Django URLs, FastAPI routers, Express app.use, etc.).
    """
    routes = set()

    # Simulate extraction from a Python/FastAPI codebase
    # Real implementation: walk AST, find @app.get, @router.post, etc.
    known_routes = {
        # Approved routes (from spec)
        "GET /api/v2/users",
        "GET /api/v2/users/{id}",
        "POST /api/v2/users",
        "PUT /api/v2/users/{id}",
        "DELETE /api/v2/users/{id}",
        "GET /api/v2/orders",
        "GET /api/v2/orders/{id}",
        "POST /api/v2/orders",
        # 🚨 Phantom routes — found in code but NOT in approved spec
        "GET /api/v2/users/{id}/debug",       # AI-generated debug endpoint
        "GET /api/v2/users/export?format=csv", # Unticketed feature
        "POST /api/v2/admin/users/impersonate", # Admin route with no scope check
        "POST /api/v2/internal/user-lookup",   # Missing auth decorator
    }
    routes.update(known_routes)
    return routes

# ─── Phase 2: Approved Spec ───

def load_approved_spec(spec_path: str) -> Set[str]:
    """Load the last-approved OpenAPI spec as the source of truth."""
    # In real life: parse OpenAPI 3.x, extract path + method combinations
    approved = {
        "GET /api/v2/users",
        "GET /api/v2/users/{id}",
        "POST /api/v2/users",
        "PUT /api/v2/users/{id}",
        "DELETE /api/v2/users/{id}",
        "GET /api/v2/orders",
        "GET /api/v2/orders/{id}",
        "POST /api/v2/orders",
    }
    return approved

# ─── Phase 3: Live Traffic Fingerprint ───

def get_live_traffic_paths() -> Set[str]:

"""Query the API gateway / WAF for paths receiving real traffic
       in the last rolling window (e.g., last 24 hours).
    """
    # In real life: query Kong / AWS API Gateway / Envoy access logs
    live_paths = {
        "GET /api/v2/users",
        "GET /api/v2/users/{id}",
        "POST /api/v2/users",
        "PUT /api/v2/users/{id}",
        "DELETE /api/v2/users/{id}",
        "GET /api/v2/orders",
        "GET /api/v2/orders/{id}",
        "POST /api/v2/orders",
        # 🚨 This shouldn't exist but is being hit
        "GET /api/v2/users/{id}/debug",
        "POST /api/v2/internal/user-lookup",
    }
    return live_paths

# ─── Phase 4: Diff Engine ───

def detect_phantom_routes(
    code_routes: Set[str],
    approved_spec: Set[str],
    live_traffic: Set[str],
) -> Dict[str, List[str]]:
    """Find routes that exist but shouldn't."""

    # Phantom from code: in code but not in approved spec
    code_phantoms = code_routes - approved_spec

    # Phantom from traffic: serving traffic but not in approved spec
    traffic_phantoms = live_traffic - approved_spec

    return {
        "code_phantoms": sorted(code_phantoms),
        "traffic_phantoms": sorted(traffic_phantoms),
        "both": sorted(code_phantoms & traffic_phantoms),
    }

# ─── Phase 5: CI/CD Gate (Blocking) ───

class CIDCGate:
    """Runs in CI/CD — blocks PRs that introduce phantom routes."""

    BLOCKING_PATTERNS = [
        "debug", "admin", "internal", "test", "dev",
        "impersonate", "export", "bypass", "legacy",
        "raw", "noscope", "unsecured", "temp",
    ]

    def check_pr(self, pr_changes: List[Dict]) -> bool:
        """Return True if the PR passes (no phantoms detected)."""
        phantom_count = 0

        print("🔍 CI/CD Phantom API Scan\n")

        for change in pr_changes:
            route = f"{change['method']} {change['path']}"
            new = change.get('new', False)

            if not new:
                continue

# Check for suspicious patterns
            for pattern in self.BLOCKING_PATTERNS:
                if pattern in route.lower():
                    print(f"⚠️  [BLOCKED] Suspicious route pattern '{pattern}'")
                    print(f"    Route: {route}")
                    print(f"    File:  {change['file']}:{change['line']}")
                    phantom_count += 1
                    break

            # Check for missing auth decorators
            if not change.get('has_auth', True):
                print(f"⚠️  [BLOCKED] Missing auth decorator")
                print(f"    Route: {route}")
                print(f"    File:  {change['file']}:{change['line']}")
                phantom_count += 1

        if phantom_count > 0:
            print(f"\n❌ BLOCKED: {phantom_count} potential phantom route(s) detected.")
            print("   Each must be reviewed and approved before merge.")
            return False

        print("✅ PASS: No phantom routes detected.")
        return True

# ─── Run the Full Pipeline ───

print("👻 Phantom API Detection Pipeline")
print("=" * 55)

# Step 1: Extract routes from code
code_routes = extract_routes_from_code("./src")
print(f"\n📦 Routes found in codebase: {len(code_routes)}")
for r in sorted(code_routes):
    marker = " 👻" if r not in load_approved_spec("spec.yaml") else ""
    print(f"   {r}{marker}")

# Step 2: Diff against approved spec
approved = load_approved_spec("spec.yaml")
phantoms = code_routes - approved
print(f"\n📋 Approved routes in spec:   {len(approved)}")
print(f"👻 Phantom routes detected:    {len(phantoms)}")
for p in sorted(phantoms):
    print(f"   ⚠️  {p}")

# Step 3: Cross-reference with live traffic
live = get_live_traffic_paths()
live_phantoms = live - approved
print(f"\n📊 Live traffic routes:         {len(live)}")
print(f"👻 Live phantoms (not in spec): {len(live_phantoms)}")
for p in sorted(live_phantoms):
    print(f"   🔥 {p}")

# Step 4: Simulate CI/CD gate

print(f"\n{'='*55}")
print("🔒 CI/CD Gate Check")
PR_CHANGES = [
    {"method": "GET", "path": "/api/v2/users/{id}/debug",
     "file": "src/routers/users.py", "line": 142, "new": True, "has_auth": False},
    {"method": "GET", "path": "/api/v2/orders/{id}",
     "file": "src/routers/orders.py", "line": 89, "new": False, "has_auth": True},
]

gate = CIDCGate()
gate.check_pr(PR_CHANGES)

print(f"\n{'='*55}")
print("🏁 Summary")
print(f"   Approved spec routes:  {len(approved)}")
print(f"   Code phantom routes:   {len(phantoms)}")
print(f"   Live phantom routes:   {len(live_phantoms)}")
print(f"   CI/CD gate result:     {'✅ PASS' if gate.check_pr([]) else '❌ BLOCKED (see above)'}")
```
