---
title: "Ephemeral Runners"
termSlug: "ephemeral-runners"
year: 2026
month: 2
monthName: "February"
day: 25
order: 18
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Ephemeral Runners are short-lived compute instances (virtual machines or containers) that are created on-demand to execute a single CI/CD job or task, then immediately destroyed after completion. U..."
---
### Definition:

Ephemeral Runners are short-lived compute instances (virtual machines or containers) that are created on-demand to execute a single CI/CD job or task, then immediately destroyed after completion. Unlike persistent runners that stay running 24/7, ephemeral runners follow a create → execute → destroy lifecycle, ensuring every job runs in a completely fresh, isolated environment.

Simple analogy: Like using disposable plates at a party instead of washing dishes—each guest (job) gets a clean plate (runner), and you throw it away when done. No cross-contamination, no cleanup.

How Ephemeral Runners Work

```text
┌─────────────────────────────────────────────────────┐
│ Ephemeral Runner Lifecycle │
└─────────────────────────────────────────────────────┘

Step 1: Job Queued
┌──────────────────────┐
│ Developer pushes code│
│ Triggers CI pipeline │
│ Job enters queue │
└──────────┬───────────┘
│
▼
Step 2: Runner Creation (On-Demand)
┌─────────────────────────────────┐
│ Orchestrator detects queued job │
│ ├─ Provisions new VM/container │
│ ├─ Installs runner agent │
│ ├─ Registers with CI system │
│ └─ Ready in 20-60 seconds │
└──────────┬──────────────────────┘
│
▼
Step 3: Job Execution
┌─────────────────────────────────┐
│ Runner picks up job from queue │
│ ├─ Clones repository │
│ ├─ Installs dependencies │
│ ├─ Runs tests │
│ ├─ Builds artifacts │
│ └─ Uploads results │
└──────────┬──────────────────────┘
│
▼
Step 4: Cleanup & Destruction
┌─────────────────────────────────┐
│ Job completes (success or fail) │
│ ├─ Upload logs and artifacts │
│ ├─ Deregister runner │
│ ├─ Delete VM/container │
│ └─ Release all resources │
└─────────────────────────────────┘
│
▼
```
[Done] ✅

### Example:

GitHub Actions with Ephemeral Runners

```
Company: ShopFast Inc.
Setup:

GitHub repository with 50 developers
200+ pipeline runs per day
Need for isolated test environments
Security requirement: no data persistence
Traditional Setup (Persistent Runners) - Problems

# .github/workflows/ci.yml (OLD - with persistent runners)

name: CI Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: self-hosted  # ← Uses persistent runner
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build
        run: npm run build

# Problems encountered:
# Day 1: Works fine ✅
# Day 3: Disk space issues (node_modules accumulating) ❌
# Day 5: Test fails because old environment variables still set ❌
# Day 7: Security scan finds API key from previous job ❌
# Day 10: "It works on my laptop but fails in CI" (runner has wrong Node version) ❌
Modern Setup (Ephemeral Runners) - Solution
Architecture

┌────────────────────────────────────────────────────┐
│  Ephemeral Runner Infrastructure (AWS Example)    │
└────────────────────────────────────────────────────┘

GitHub Repository
       │
       │ (Webhook: workflow_job event)
       ▼
┌──────────────────────┐
│ AWS API Gateway      │
│ + Lambda Function    │ ← Receives GitHub webhook
└──────────┬───────────┘
           │
           │ (Trigger EC2 instance)
           ▼
┌──────────────────────────────────┐
│ AWS EC2 Auto Scaling Group       │
│                                   │
│  On-demand instance creation:    │
│  ┌─────────────────────────┐    │
│  │ EC2 Instance            │    │
│  │ ├─ Ubuntu 22.04         │    │
│  │ ├─ Docker pre-installed │    │
│  │ ├─ GitHub runner agent  │    │
│  │ └─ Ephemeral flag set   │    │
│  └─────────────────────────┘    │
└──────────┬───────────────────────┘
           │
           │ (Job complete → Terminate)
           ▼
       [Instance deleted]
Implementation Code
1. Lambda Function (Runner Provisioner)

// lambda/provision-runner.js
// Triggered by GitHub webhook when job is queued

const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();

exports.handler = async (event) => {
    // Parse GitHub webhook
    const payload = JSON.parse(event.body);

    // Only act on "queued" events
    if (payload.action !== 'queued') {
        return { statusCode: 200, body: 'Ignored' };
    }

    const jobId = payload.workflow_job.id;
    const repoName = payload.repository.full_name;

    console.log(`Provisioning runner for job ${jobId} in ${repoName}`);

    // User data script (runs on instance startup)
    const userData = `#!/bin/bash
set -e

# Update system
apt-get update
apt-get install -y docker.io jq curl

# Download GitHub runner
mkdir -p /actions-runner && cd /actions-runner
RUNNER_VERSION="2.311.0"
curl -o actions-runner.tar.gz -L \
  https://github.com/actions/runner/releases/download/v\${RUNNER_VERSION}/actions-runner-linux-x64-\${RUNNER_VERSION}.tar.gz
tar xzf actions-runner.tar.gz

# Get registration token from GitHub
RUNNER_TOKEN=$(curl -s -X POST \
  -H "Authorization: token \${GITHUB_TOKEN}" \
  https://api.github.com/repos/${repoName}/actions/runners/registration-token | jq -r .token)

# Configure runner as EPHEMERAL
./config.sh \
  --url https://github.com/${repoName} \
  --token \${RUNNER_TOKEN} \
  --name "ephemeral-runner-${jobId}" \
  --labels "ephemeral,aws,docker" \
  --ephemeral \
  --unattended

# Start runner (will exit after one job)
./run.sh

# Self-destruct after job completes
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d ' ' -f 2)
aws ec2 terminate-instances --instance-ids \${INSTANCE_ID} --region us-east-1
`;

    // Launch EC2 instance
    const params = {
        ImageId: 'ami-0c55b159cbfafe1f0', // Ubuntu 22.04
        InstanceType: 't3.medium',
        MinCount: 1,
        MaxCount: 1,
        UserData: Buffer.from(userData).toString('base64'),
        IamInstanceProfile: {
            Name: 'GitHubRunnerRole' // Has permissions to self-terminate
        },
        TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [
                { Key: 'Name', Value: `GH-Runner-${jobId}` },
                { Key: 'Purpose', Value: 'ephemeral-ci-runner' },
                { Key: 'JobId', Value: jobId.toString() }
            ]
        }],
        InstanceInitiatedShutdownBehavior: 'terminate'
    };

    try {
        const result = await ec2.runInstances(params).promise();
        const instanceId = result.Instances[0].InstanceId;

        console.log(`Created instance ${instanceId} for job ${jobId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Runner provisioned',
                instanceId,
                jobId
            })
        };
    } catch (error) {
        console.error('Failed to provision runner:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
2. GitHub Workflow (Using Ephemeral Runners)

# .github/workflows/ci.yml (NEW - with ephemeral runners)

name: CI Pipeline with Ephemeral Runners
on: [push, pull_request]

jobs:
  test:
    runs-on: [self-hosted, ephemeral, docker]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci  # Clean install (no cache pollution)

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NODE_ENV: test

      - name: Build application
        run: npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: dist/

      # No cleanup needed - runner will be destroyed automatically!

  security-scan:
    runs-on: [self-hosted, ephemeral, docker]
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Run security scan
        run: |
          docker run --rm -v $(pwd):/src \
            aquasec/trivy fs /src

      # Secrets used here won't persist to next job ✅

  deploy-staging:
    runs-on: [self-hosted, ephemeral, docker]
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          ./scripts/deploy-staging.sh
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      # AWS credentials destroyed with runner ✅
3. Runner Lifecycle Monitoring

// monitor-runners.js
// CloudWatch Events rule triggered every 5 minutes

const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();

async function cleanupStuckRunners() {
    // Find runners older than 2 hours (possible stuck jobs)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const params = {
        Filters: [
            {
                Name: 'tag:Purpose',
                Values: ['ephemeral-ci-runner']
            },
            {
                Name: 'instance-state-name',
                Values: ['running']
            }
        ]
    };

    const instances = await ec2.describeInstances(params).promise();
    const stuckInstances = [];

    for (const reservation of instances.Reservations) {
        for (const instance of reservation.Instances) {
            if (instance.LaunchTime < twoHoursAgo) {
                stuckInstances.push(instance.InstanceId);
                console.log(`Found stuck runner: ${instance.InstanceId}`);
            }
        }
    }

    // Terminate stuck runners
    if (stuckInstances.length > 0) {
        await ec2.terminateInstances({
            InstanceIds: stuckInstances
        }).promise();

        console.log(`Terminated ${stuckInstances.length} stuck runners`);
    }

    return {
        checked: instances.Reservations.length,
        terminated: stuckInstances.length
    };
}

exports.handler = cleanupStuckRunners;
Results: Before vs After

Metrics Comparison (30 days):
═══════════════════════════════════════════════════

                    Persistent    Ephemeral    Improvement
────────────────────────────────────────────────────────────
Runner Uptime       720 hours     40 hours     -94%
                    (always on)   (job time)

Infrastructure Cost $1,200/month  $180/month   -85%
                    (3×t3.medium  (pay per job)
                     24/7)

Disk Space Issues   12 incidents  0 incidents  100% ✅

State Pollution     8 incidents   0 incidents  100% ✅
Bugs

Security Incidents  2 (leaked     0            100% ✅
                    secrets)

Average Job Time    5m 30s        4m 45s       -14%
                    (slow start)  (fresh env)  (faster!)

Developer          "Why does it   "Works       Developer
Satisfaction       work locally?" every time"  happiness ⬆️

Maintenance Hours  16 hours/mo   2 hours/mo   -88%
                   (updates,      (monitoring
                    troubleshoot)  only)
```
