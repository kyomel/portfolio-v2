---
title: "Real-Time Ad Bidding Systems (RTB)"
termSlug: "real-time-ad-bidding-systems-rtb"
year: 2026
month: 4
monthName: "April"
day: 9
order: 5
source: "2026/apr-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/apr-term.md"
excerpt: "Real-Time Bidding (RTB) is an automated digital advertising process where ad impressions are bought and sold through instant auctions that occur in the time it takes a webpage to load — typically u..."
---
### Definition:

Real-Time Bidding (RTB) is an automated digital advertising process where ad impressions are bought and sold through instant auctions that occur in the time it takes a webpage to load — typically under 100 milliseconds. Every time a user visits a webpage, advertisers automatically compete in a live auction to show their ad to that specific user, with the highest bidder winning the ad slot.

An impression is simply one instance of an ad being displayed to a user on a webpage or app.

💡 Simple Analogy
Imagine a lightning-fast stock exchange, but instead of trading company shares, you're trading eyeballs on a screen. The moment someone visits a webpage, thousands of advertisers instantly bid for the right to show that specific person their ad — all before the page even finishes loading.

### Example:

Scenario: Nike Targeting a Runner
Sarah is a 28-year-old marathon runner. She visits ESPN.com to check scores.

```
What happens behind the scenes in 100ms:

1️⃣  ESPN's SSP fires a Bid Request:
    ┌─────────────────────────────────────────┐
    │ User ID:      #XJ-4829                  │
    │ Age:          28                        │
    │ Interests:    Running, Fitness, Sports  │
    │ Location:     Chicago, IL               │
    │ Device:       iPhone 15                 │
    │ Page:         ESPN.com/scores           │
    │ Ad Slot:      300x250 banner, above fold│
    └─────────────────────────────────────────┘

2️⃣  Ad Exchange broadcasts to all DSPs

3️⃣  DSPs evaluate and bid:
    Nike DSP    → $4.20  ✅ (Sarah matches runner profile)
    Adidas DSP  → $3.80
    Netflix DSP → $1.20  (not their target)
    Booking.com → $2.50

4️⃣  Nike WINS at $4.20

5️⃣  Nike's "Spring Running Shoes" ad appears
    on Sarah's ESPN page instantly 🏃‍♀️👟
```
