---
title: "Recreate Deployment"
termSlug: "recreate-deployment"
year: 2025
month: 9
monthName: "September"
day: 19
order: 15
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Recreate Deployment is a deployment strategy where the old version of an application is completely shut down before the new version is deployed. This creates a brief period of downtime during the t..."
---
### Definition:
Recreate Deployment is a deployment strategy where the old version of an application is completely shut down before the new version is deployed. This creates a brief period of downtime during the transition, but ensures that only one version of the application runs at any given time.

**How It Works**
- Stop the current version (all instances go down)
- Deploy the new version
- Start the new version
- Brief downtime occurs between steps 1 and 3

### Example:
E-commerce Website Update
Before Deployment:
```
🟢 Website v1.0 (Running)
- 3 servers handling customer traffic
- Users can browse and purchase products
```

During Recreate Deployment:
```
🔴 All servers stopped
- Website completely offline
- Users see "Site temporarily unavailable"
- Duration: 5-15 minutes typically
```

After Deployment:
```
🟢 Website v2.0 (Running)
- 3 new servers with updated version
- Users can access the new features
```
