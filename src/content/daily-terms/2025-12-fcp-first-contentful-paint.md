---
title: "FCP (First Contentful Paint)"
termSlug: "fcp-first-contentful-paint"
year: 2025
month: 12
monthName: "December"
day: 31
order: 23
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "First Contentful Paint (FCP) is a web performance metric that measures the time from when a page starts loading to when any part of the page's content is first rendered on the screen."
---
### Definition:

First Contentful Paint (FCP) is a web performance metric that measures the time from when a page starts loading to when any part of the page's content is first rendered on the screen.

**Content** includes:

- Text
- Images (including background images)
- SVG elements
- Non-white <canvas> elements

**Why It Matters:**

FCP tells you when users first see visual feedback that the page is actually loading. It's a key user-centric performance metric because it marks when users perceive the site is responding.

### Example:

Imagine you visit an online store:

```
Timeline:
0.0s  → User clicks link
0.5s  → White/blank screen (still loading)
1.2s  → Logo appears ← FCP happens here! ✓
2.5s  → Product images load
3.0s  → Page fully interactive

FCP = 1.2 seconds (when the logo first appeared)
```
