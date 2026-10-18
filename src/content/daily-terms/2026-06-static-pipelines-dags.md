---
title: "Static Pipelines (DAGs)"
termSlug: "static-pipelines-dags"
year: 2026
month: 6
monthName: "June"
day: 12
order: 10
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "A Static Pipeline is a workflow structured as a Directed Acyclic Graph (DAG) where each node is a task and each edge is a dependency (A → B means \"A must finish before B starts\"). Directed means ev..."
---
### Definition:

A Static Pipeline is a workflow structured as a Directed Acyclic Graph (DAG) where each node is a task and each edge is a dependency (A → B means "A must finish before B starts"). Directed means every edge has a clear direction — data or control flows one way. Acyclic means there are no loops — the pipeline cannot circle back to an earlier stage, guaranteeing it will always terminate. Static means the graph structure is fixed at definition time, not dynamically rewired during execution.

In one sentence: A pre-planned, loop-free dependency graph that guarantees tasks run in the correct order, every time.

Analogy — The Assembly Line Kitchen 🏭

Imagine a high-end sushi restaurant with a conveyor belt. The kitchen is split into stations:

Rice Cooker → Fish Prep → Rolling → Plating → Customer

Directed: Rice must be cooked before rolling. You can't roll sushi without rice.
Acyclic: There's no "send the plated sushi back to the rice cooker" — the belt only moves forward.
Static: The manager designed this layout Monday morning and it stays the same all week. Every order follows the exact same path.

If a customer orders miso soup too, the pipeline forks:
```text
┌→ Rolling → Plating → Customer
Rice Cooker ──┤
└→ Soup Pot → Plating → Customer
```

The soup and sushi prep can happen in parallel (they're independent), but both must hit "Plating" before reaching the customer. The DAG captures this without any manual coordination.

### Example:

ETL Data Pipeline with Airflow-style DAG

```
from datetime import datetime

# Imagine a simple DAG scheduler checks dependencies
# before running each step.

tasks = {}

def task(name, depends_on=None):
    """Register a pipeline task."""
    tasks[name] = {"depends_on": depends_on or [], "done": False}

def run(name):
    """Run a task if all its dependencies are satisfied."""
    t = tasks[name]
    for dep in t["depends_on"]:
        if not tasks[dep]["done"]:
            print(f"  ⏳ {name} waiting for {dep}...")
            return False
    print(f"  ✅ Running {name}...")
    t["done"] = True
    return True

# ─── Define the static DAG ───
task("extract_csv", depends_on=[])        # Root node: no deps
task("extract_api", depends_on=[])        # Root node: no deps
task("validate",    depends_on=["extract_csv", "extract_api"])
task("transform",   depends_on=["validate"])
task("load",        depends_on=["transform"])

print("🚀 Pipeline Execution:\n")

# ─── Execute in topological order ───
# (In a real DAG scheduler, this is automatic)
while not tasks["load"]["done"]:
    run("extract_csv")
    run("extract_api")
    run("validate")
    run("transform")
    run("load")

print("\n📊 Pipeline: COMPLETE")

Output:
🚀 Pipeline Execution:

  ✅ Running extract_csv...
  ✅ Running extract_api...
  ✅ Running validate...
  ✅ Running transform...
  ✅ Running load...

📊 Pipeline: COMPLETE
```

### Key Concepts:

1. **DAG (Directed Acyclic Graph)**: A graph with nodes (tasks) and edges (dependencies) that has no cycles.
2. **Topological Sort**: An ordering of nodes where every dependency comes before the dependent task.
3. **Idempotency**: Tasks should be able to run multiple times without changing the final result.
4. **State Tracking**: Each task tracks its completion status to avoid redundant work.

### Real-world Analogy:

Imagine a construction project where:
- Tasks are like building steps (foundation, framing, plumbing, etc.)
- Dependencies are like "must be done before" relationships
- The DAG scheduler is like a foreman ensuring steps happen in theß correct order

This pattern is used in:
- Data pipelines (Apache Airflow, Luigi)
- Build systems (Make, Bazel)
- Workflow engines (AWS Step Functions, Prefect)
