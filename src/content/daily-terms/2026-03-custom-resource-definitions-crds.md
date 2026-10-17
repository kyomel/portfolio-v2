---
title: "Custom Resource Definitions (CRDs)"
termSlug: "custom-resource-definitions-crds"
year: 2026
month: 3
monthName: "March"
day: 27
order: 20
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Custom Resource Definitions (CRDs) are a Kubernetes extension mechanism that allows you to define your own custom resource types — beyond the built-in Kubernetes objects like Pods, Deployments, and..."
---
### Definition:
Custom Resource Definitions (CRDs) are a Kubernetes extension mechanism that allows you to define your own custom resource types — beyond the built-in Kubernetes objects like Pods, Deployments, and Services — effectively teaching Kubernetes new vocabulary so it can manage any kind of resource, not just the ones it ships with.

CRDs turn Kubernetes from a container orchestration platform into a universal control plane — capable of managing databases, certificates, message queues, cloud infrastructure, ML pipelines, or literally anything you define.

— kubernetes.io

Background — Why CRDs Exist
Kubernetes ships with built-in resource types, but real-world systems need more:

Built-in Kubernetes Resources:
  ✅ Pod           — run containers
  ✅ Deployment    — manage pod replicas
  ✅ Service       — expose pods via network
  ✅ ConfigMap     — store configuration
  ✅ PersistentVolumeClaim — request storage

Real-world needs that don't fit:
  ❌ "I want Kubernetes to manage my PostgreSQL database"
  ❌ "I want Kubernetes to renew my TLS certificates"
  ❌ "I want Kubernetes to provision AWS infrastructure"
  ❌ "I want Kubernetes to manage my Kafka topics"
  ❌ "I want Kubernetes to orchestrate my ML training jobs"

CRDs solve this:
  ✅ Define a "PostgresCluster" resource
  ✅ Define a "Certificate" resource
  ✅ Define a "S3Bucket" resource
  ✅ Define a "KafkaTopic" resource
  ✅ Define a "TrainingJob" resource
kubernetes.io

### Example:
cert-manager CRD
cert-manager is a popular, production-grade Kubernetes operator that uses CRDs to manage TLS certificates. It's a perfect real-world example of CRDs in action.

```
User applies Certificate CR
        │
        ▼
cert-manager controller detects new Certificate object
        │
        ▼
Controller reads spec:
  "Need cert for api.example.com via letsencrypt-prod"
        │
        ▼
Controller creates CertificateRequest CR (automatically)
        │
        ▼
Controller calls Let's Encrypt ACME API
        │
        ▼
Creates Challenge CR → proves domain ownership
        │
        ▼
Let's Encrypt issues certificate
        │
        ▼
Controller stores cert in Kubernetes Secret "api-tls-secret"
        │
        ▼
Controller updates Certificate status:

kubectl get certificate api-tls-cert -n production

# NAME           READY   SECRET           AGE
# api-tls-cert   True    api-tls-secret   2m

# 75 days later — cert-manager auto-renews, zero human intervention ✅

# The user just wrote 20 lines of YAML
# cert-manager handled ALL the ACME protocol complexity
# TLS certs managed like any other Kubernetes resource ✅
```
