---
title: "Dynamic Resource Allocation (DRA)"
termSlug: "dynamic-resource-allocation-dra"
year: 2026
month: 3
monthName: "March"
day: 20
order: 15
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Dynamic Resource Allocation (DRA) is a Kubernetes API and framework introduced in Kubernetes 1.26 (as alpha) that provides a flexible, extensible mechanism for requesting, scheduling, and sharing s..."
---
### Definition:

Dynamic Resource Allocation (DRA) is a Kubernetes API and framework introduced in Kubernetes 1.26 (as alpha) that provides a flexible, extensible mechanism for requesting, scheduling, and sharing specialized hardware resources — such as GPUs, FPGAs, network adapters, and other devices — beyond what the traditional requests/limits model can handle.

DRA replaces the rigid, one-size-fits-all device plugin model with a programmable, driver-driven approach where resource vendors define exactly how their hardware is discovered, allocated, and configured — giving workloads fine-grained control over the hardware they need.

### Example:

AI/ML Training Platform
Imagine a machine learning platform that runs training jobs on a Kubernetes cluster with mixed GPU hardware.

```
Cluster has 3 GPU nodes:

Node gpu-node-01:
  ├── GPU 0: NVIDIA A100 80GB (CUDA 11.8)
  ├── GPU 1: NVIDIA A100 80GB (CUDA 11.8)
  ├── GPU 2: NVIDIA A100 40GB (CUDA 11.8)
  └── GPU 3: NVIDIA A100 40GB (CUDA 11.8)

Node gpu-node-02:
  ├── GPU 0: NVIDIA H100 80GB (CUDA 12.0)
  ├── GPU 1: NVIDIA H100 80GB (CUDA 12.0)
  └── GPU 2: NVIDIA H100 80GB (CUDA 12.0)

Node gpu-node-03:
  ├── GPU 0: NVIDIA T4 16GB (CUDA 11.4)
  ├── GPU 1: NVIDIA T4 16GB (CUDA 11.4)
  ├── GPU 2: NVIDIA T4 16GB (CUDA 11.4)
  └── GPU 3: NVIDIA T4 16GB (CUDA 11.4)

Old model: pods just asked for "1 GPU" — might get any of above
DRA model: pods declare exactly what they need

# Large model training — MUST have 80GB VRAM
# Old model couldn't express this requirement!

apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaim
metadata:
  name: large-model-gpu-claim
spec:
  devices:
    requests:
    - name: training-gpu
      deviceClassName: gpu.nvidia.com
      selectors:
      - cel:
          expression: |
            device.attributes["gpu.nvidia.com"].memory >= 85899345920
            && device.attributes["gpu.nvidia.com"].cudaMajor >= 11
      # Requires: 80GB VRAM minimum, CUDA 11+

apiVersion: batch/v1
kind: Job
metadata:
  name: llm-training-80gb
spec:
  template:
    spec:
      containers:
      - name: trainer
        image: pytorch/pytorch:2.1.0-cuda11.8
        command: ["python", "train_llm.py", "--model", "llama-70b"]
        resources:
          claims:
          - name: gpu-resource
      resourceClaims:
      - name: gpu-resource
        source:
          resourceClaimName: large-model-gpu-claim

Scheduler outcome:
  ❌ gpu-node-03: T4 16GB — too small, REJECTED
  ❌ gpu-node-01 GPU 2/3: A100 40GB — too small, REJECTED
  ✅ gpu-node-01 GPU 0/1: A100 80GB — matches! SCHEDULED
  ✅ gpu-node-02: H100 80GB — also matches

→ Pod lands on correct node with correct GPU automatically

# DRA supports structured sharing of a single GPU
# between multiple pods (time-slicing / MIG partitioning)

apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaim
metadata:
  name: shared-gpu-claim
spec:
  devices:
    requests:
    - name: gpu-slice
      deviceClassName: gpu.nvidia.com
      selectors:
      - cel:
          expression: |
            device.attributes["gpu.nvidia.com"].memory >= 10737418240
      # Just need 10GB slice of a larger GPU

# Pod A and Pod B can SHARE the same physical GPU
# Old device plugin model couldn't do this!

# Pod A
apiVersion: v1
kind: Pod
metadata:
  name: inference-pod-a
spec:
  containers:
  - name: inference
    image: triton-inference:latest
    resources:
      claims:
      - name: gpu
  resourceClaims:
  - name: gpu
    source:
      resourceClaimName: shared-gpu-claim   # shares claim with Pod B

Result:
  Physical GPU (A100 80GB) shared between:
    → inference-pod-a: uses 10GB slice ✅
    → inference-pod-b: uses 10GB slice ✅
    → 60GB remaining available for other workloads

  Old model: entire GPU locked to one pod ❌
  DRA model: GPU shared efficiently ✅

# DRA can request MULTIPLE resources as a unit
# e.g. GPU must be on SAME NUMA node as high-speed NIC

apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaim
metadata:
  name: gpu-plus-nic-claim
spec:
  devices:
    requests:
    - name: training-gpu
      deviceClassName: gpu.nvidia.com
      selectors:
      - cel:
          expression: |
            device.attributes["gpu.nvidia.com"].memory >= 85899345920
    - name: fast-nic
      deviceClassName: nic.mellanox.com
      selectors:
      - cel:
          expression: |
            device.attributes["nic.mellanox.com"].speed >= 400
            && device.attributes["nic.mellanox.com"].rdmaCapable == true

    constraints:
    - matchAttribute: "numa-node"    # GPU and NIC must be on same NUMA node
      requests: ["training-gpu", "fast-nic"]

apiVersion: v1
kind: Pod
metadata:
  name: distributed-training-pod
spec:
  containers:
  - name: trainer
    image: pytorch/pytorch:2.1.0-cuda11.8
    resources:
      claims:
      - name: compound-resource
  resourceClaims:
  - name: compound-resource
    source:
      resourceClaimName: gpu-plus-nic-claim

Result:
  Scheduler finds a node where:
    ✅ A100 80GB GPU available
    ✅ Mellanox 400Gb RDMA NIC available
    ✅ BOTH on the same NUMA node (no cross-NUMA overhead)

  Training pod gets peak performance:
    GPU ↔ NIC on same NUMA = lowest latency data transfer
    Critical for distributed training across multiple nodes
```
