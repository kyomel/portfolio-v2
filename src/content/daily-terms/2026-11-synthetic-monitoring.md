---
title: "Synthetic Monitoring"
termSlug: "synthetic-monitoring"
year: 2026
month: 11
monthName: "November"
day: 18
order: 13
source: "2026/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/nov-term.md"
excerpt: "Synthetic Monitoring runs scripted checks against a system from the outside, on a fixed schedule. The script plays a known user journey. It opens the page, logs in, adds one item, and pays with a t..."
---
### Definition:

**Synthetic Monitoring** runs scripted checks against a system from the outside, on a
fixed schedule. The script plays a known user journey. It opens the page, logs in,
adds one item, and pays with a test card. The check asserts that every step works and
that each step stays inside its time budget. When the script fails, you get an alert.

The traffic is synthetic because no real user makes it. Your own probe fleet makes it.
That is the main value. You control the journey, the location, and the clock.

RUM and APM cannot do this. They read traffic that already exists. No traffic means no
data, so an outage at 03:00 stays invisible. RUM also cannot tell you that login is
broken, because it does not know which flows are missing. A synthetic check defines
the flow by hand. So it covers the flows that matter, at every hour of the day.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ WITHOUT SYNTHETIC MONITORING  -  the user is the monitor                 │
├──────────────────────────────────────────────────────────────────────────┤
│ 03:00  bad deploy lands. Checkout is down.                               │
│ 03:00  APM sees no traffic. No error spike. No alert.                    │
│ 07:15  first real user tries to buy. The page fails.                     │
│ 07:22  the user writes to support. Nobody reads it yet.                  │
│ 09:40  on-call learns about the break from a ticket.                     │
│        downtime: 6 h 40 min, found by a customer                         │
└──────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ WITH SYNTHETIC MONITORING  -  the probe is the monitor                   │
├──────────────────────────────────────────────────────────────────────────┤
│ 03:00  bad deploy lands. Checkout is down.                               │
│ 03:00  no user traffic, but the probe runs anyway.                       │
│ 03:01  probe clicks Buy from 3 regions. Step 3 fails.                    │
│ 03:01  2 regions, 2 runs -> page the on-call engineer.                   │
│ 03:04  rollback starts. No user ever saw the break.                      │
│        downtime: 4 min, found by your own script                         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Two families of checks.**

1. **Protocol checks** send one request and assert one result. HTTP(S), DNS, TCP,
   ICMP, gRPC, WebSocket. They are cheap, so they run every 15-60 seconds.
2. **Browser checks** drive headless Chromium through Playwright or the Chrome
   DevTools Protocol. The script clicks real elements, waits for network idle, and
   reads Core Web Vitals. Each run starts a full browser, so it costs much more than
   one HTTP request. These run every 5-15 minutes.

Both families run from probe locations. Public locations catch CDN faults, DNS
routing faults, and regional network faults. Private locations run a small agent
inside your VPC. They reach internal APIs that the internet cannot reach.

Layer the checks. Keep the shallow probe fast and frequent, and keep the deep journey
rare and rich.

```text
┌──────────────┬──────────────────────────────────────────────┬────────────┐
│ FREQUENCY    │ CHECK                                        │ COST / RUN │
├──────────────┼──────────────────────────────────────────────┼────────────┤
│ every 30 s   │ HTTP status on /health                       │ tiny       │
│ every 60 s   │ DNS resolve, TLS days left, TTFB             │ tiny       │
│ every 5 min  │ API call with a token, assert JSON body      │ small      │
│ every 15 min │ browser: log in, add to cart, pay (test key) │ large      │
└──────────────┴──────────────────────────────────────────────┴────────────┘
```

```text
┌────────────────────────────┬────────────────────────┬──────────────────────────┐
│ QUESTION                   │ SYNTHETIC CHECK        │ RUM / APM                │
├────────────────────────────┼────────────────────────┼──────────────────────────┤
│ who makes the traffic      │ your probe fleet       │ real users               │
│ works with zero traffic    │ yes                    │ no                       │
│ covers the flow you pick   │ yes, by hand           │ only flows users take    │
│ baseline over time         │ constant, repeatable   │ moves with traffic mix   │
│ needs a test account       │ yes                    │ no                       │
│ sees PII                   │ no                     │ yes                      │
│ breaks when the UI changes │ yes (script rot)       │ no                       │
│ best for                   │ availability, journeys │ UX quality, real latency │
└────────────────────────────┴────────────────────────┴──────────────────────────┘
```

**Keep these limits in view.**

- Watch the cost. A browser check starts a whole Chromium process. A protocol check
  sends a few packets. Run the deep journey every 5-15 minutes. Never run it every 10
  seconds.
- Prevent script rot. A browser check breaks when the DOM changes, even when the
  product is healthy. Pin `data-testid` attributes. Keep the journey on the critical
  path only. Fix a broken script like a broken test, in the same sprint.
- Fight alert noise. One failed run can be a flaky probe network. Require two
  consecutive failures from two different locations before you page a human. Page on
  error budget burn, not on one single miss.
- Mark the probe traffic. Send a `X-Synthetic: 1` header or a dedicated user agent.
  Then filter the probe out of analytics. Add the probe IP ranges to the WAF allowlist.
- Give the probe its own account. Use one test account with least privilege and a test
  payment key. Never share a real customer account and never use a live card.
- Know the boundary. Synthetic checks cover known flows only. They do not replace unit
  tests, load tests, or RUM. Use them for availability and for the critical path.

### Example:

A shop team guards one path, checkout. The journey runs every 5 minutes from three
regions: Singapore, Frankfurt, Virginia. One run takes about 20 seconds. That is
864 runs a day for one journey.

```text
probe run  (cron: every 5 min, 3 regions, ~20 s each)
  open  https://shop.example.com
    assert 200, assert tls_days_left > 14
  log in as qa-synthetic@example.com
    type email + password -> wait for /account
  add SKU-4417 to the cart
    click [Add to cart] -> assert cart badge == 1
  pay with the test card 4242 4242 4242 4242
    assert POST /api/orders -> 201 + order_id
    assert text "Order confirmed" is visible
  emit metrics
    synthetic_up, step_time_ms{step}, ttfb_ms, tls_days_left
    on failure: attach trace.zip + screenshot.png + har
```

The run writes four metrics: `synthetic_up`, `step_time_ms{step}`, `ttfb_ms` and
`tls_days_left`. The page rule is not plain PromQL, because it needs a group count.
Write the intent first:

```text
page the on-call engineer when
    synthetic_up == 0
    in 2 or more regions
    for 5 minutes in a row
```

Read the rule in words. The journey failed in at least two regions inside the last
five minutes. This rule ignores a single flaky run and pages on a real break. A simple
`up == 0` alert on one location pages on every flaky network blip.

A real break, with both timelines side by side:

```text
WITH A SYNTHETIC CHECK
  14:02:07  deploy #4821 is live (pay form lost the currency field)
  14:02:10  probe SGP -> step 3 FAIL (cart badge = 0)
  14:07:10  probe FRA -> step 3 FAIL  =>  2 regions, 2 runs: page
  14:09:00  on-call opens the trace, sees the missing field
  14:15:00  probe SGP -> PASS. Incident closed.
            blast radius: 12 min, 3 real carts abandoned

SAME DEPLOY, NO SYNTHETIC CHECK
  14:02:07  deploy #4821 is live. Checkout is broken.
  14:41:00  first support ticket: "I cannot pay"
  15:05:00  on-call opens the form by hand and sees it
  15:20:00  rollback
            blast radius: 78 min, everyone who tried to buy
```

The probe caught something no log could show. The failure was a missing form field.
No error appeared in the API log, because the broken request never reached the API.
Only a script that drives a real browser sees this class of break. The `step_time_ms`
series also showed step 4 creeping from 900 ms to 2.4 s over two weeks, so the team
found a slow database call before users complained about it.
