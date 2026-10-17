---
title: "Forward Deployed Engineer(FDE)"
termSlug: "forward-deployed-engineer-fde"
year: 2026
month: 3
monthName: "March"
day: 23
order: 17
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "A Forward Deployed Engineer (FDE) is a highly technical software engineer embedded directly with customers — working on-site or closely alongside a client's team to solve complex, real-world proble..."
---
### Definition:

A Forward Deployed Engineer (FDE) is a highly technical software engineer embedded directly with customers — working on-site or closely alongside a client's team to solve complex, real-world problems using the company's product — sitting at the intersection of engineering, consulting, and sales to deliver working solutions, not just advice.

An FDE is not a salesperson who understands technology, nor a support engineer who fixes bugs — they are a full engineer who happens to work inside the customer's world, building real things that make the product indispensable to that customer.

The Term's Origin
The term "Forward Deployed" comes from military terminology — referring to troops stationed close to the front lines rather than safely behind headquarters. Applied to engineering:

| Traditional Engineer         | Forward Deployed Engineer             |
| ---------------------------- | ------------------------------------- |
| Headquartered at company     | Embedded at customer site             |
| Builds for general users     | Builds for THIS customer's needs      |
| Works from requirements docs | Works from real-world problems        |
| Separated from end users     | Sits next to end users daily          |
| Measures success by features | Measures success by customer outcomes |

Popularized heavily by Palantir Technologies, which built its entire early growth model around FDEs embedded at government agencies, banks, and large enterprises. palantir.com

### Example:

FDE at a Data Analytics Company
Imagine DataFlow Inc. sells a data analytics platform. A major bank (MegaBank) signs a $2M contract but is struggling to get value from it after 3 months.

```
Common backgrounds:
  → Software engineer who enjoys customer interaction
  → Solutions engineer who wants to write more real code
  → Consultant who wants to work with a single product deeply

Compensation (typically):
  → Base salary: Senior SWE level (not reduced for "sales" role)
  → Variable: Tied to customer outcomes / expansion revenue
  → Often higher OTE than pure engineering roles

Career paths after FDE:
  ┌─────────────────────────────────────────────┐
  │              FDE Experience                  │
  └──────────┬──────────────┬───────────────────┘
             │              │              │
             ▼              ▼              ▼
      Product Manager  Engineering     Solutions
      (deep customer   Lead/Architect  Engineering
       empathy)        (real-world     Director
                        patterns)
```

### Kubernetes Event-Driven Autoscaling (KEDA)

### Definition:
KEDA (Kubernetes Event-Driven Autoscaling) is an open-source Kubernetes component — originally created by Microsoft and Red Hat, now a CNCF Graduated project — that enables fine-grained, event-driven autoscaling of any container workload in Kubernetes based on external metrics and event sources such as message queue length, HTTP request rate, database query count, or any custom metric — including scaling all the way down to zero pods when there is no work to process.

KEDA extends Kubernetes' built-in autoscaling with one critical superpower — it can scale based on what's happening outside the cluster, not just CPU and memory inside it.

Background — Why KEDA Exists
Kubernetes has built-in autoscaling, but it has significant limitations:

Built-in Kubernetes Autoscaling (HPA):
  ✅ Scales based on CPU usage
  ✅ Scales based on memory usage
  ❌ Cannot scale to ZERO (minimum 1 pod always running)
  ❌ Cannot natively read external metrics (queue depth, etc.)
  ❌ Polling interval too slow for bursty event workloads
  ❌ No concept of "idle" — pods run even with no messages

Real-world workloads need:
  → "Scale up when queue has 100+ messages"
  → "Scale to ZERO at 3am when no orders are coming in"
  → "Scale based on Kafka lag, not CPU"
  → "Run 0 pods on weekends, spin up Monday morning"

KEDA solves all of this ✅
keda.sh

### Example:
E-Commerce Order Processing
An e-commerce company uses KEDA to handle wildly variable order volumes — from near-zero at 3am to massive spikes during flash sales.

```
# Main order processor — scales with queue depth
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: order-processor-scaler
  namespace: ecommerce
spec:
  scaleTargetRef:
    name: order-processor

  minReplicaCount: 0     # zero pods at 3am ✅
  maxReplicaCount: 100   # up to 100 pods during flash sale

  pollingInterval: 5     # check queue every 5 seconds
  cooldownPeriod:  120   # scale down slowly (120s) to drain queue

  triggers:
  - type: rabbitmq
    metadata:
      host:        "amqp://rabbitmq.ecommerce:5672"
      queueName:   "orders"
      queueLength: "10"    # 1 pod per 10 queued orders

# Email notification jobs — scales with notification queue
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: email-sender-scaler
  namespace: ecommerce
spec:
  scaleTargetRef:
    name: email-sender

  minReplicaCount: 0
  maxReplicaCount: 30

  triggers:
  - type: rabbitmq
    metadata:
      host:        "amqp://rabbitmq.ecommerce:5672"
      queueName:   "email-notifications"
      queueLength: "20"    # 1 pod per 20 emails queued

# Cron-based pre-scaling for known traffic patterns
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: api-gateway-scaler
  namespace: ecommerce
spec:
  scaleTargetRef:
    name: api-gateway

  minReplicaCount: 2    # always at least 2 for availability
  maxReplicaCount: 200

  triggers:
  # Scale up BEFORE Black Friday (proactive)
  - type: cron
    metadata:
      timezone:        "America/New_York"
      start:           "0 6 * * 5"    # 6am every Friday
      end:             "0 23 * * 0"   # 11pm Sunday
      desiredReplicas: "50"           # pre-scale to 50

  # Also scale based on actual HTTP traffic
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring:9090
      metricName:    http_requests_per_second
      query:         |
        sum(rate(nginx_http_requests_total[1m]))
      threshold:     "100"  # 1 pod per 100 req/sec
```
