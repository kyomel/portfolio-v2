---
title: "MTBF and MTTR"
termSlug: "mtbf-and-mttr"
year: 2026
month: 5
monthName: "May"
day: 18
order: 12
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "MTBF — Mean Time Between Failures The average time a system runs correctly before its next failure. It measures reliability. A higher MTBF means the system breaks less often."
---
### Definition:

MTBF — Mean Time Between Failures
The average time a system runs correctly before its next failure.
It measures reliability. A higher MTBF means the system breaks less often.

MTTR — Mean Time To Repair / Recover
The average time needed to diagnose a failure and restore full service.
It measures resilience. A lower MTTR means the system heals faster.

### Example:

The Coffee Shop Espresso Machine
You run a café and track your primary espresso machine for one year.

```
Incident	Date	Downtime
Pump seal blows	Feb 1	4 hours
Grinder motor fails	Jun 1	2 hours
Heating element cracks	Nov 1	2 hours
MTBF (How reliable is it?)
The intervals between failures are ~120 days and ~150 days.
MTBF= 
2
120+150
​
 ≈135 days
Meaning: You can count on roughly 4.5 months of uninterrupted service between breakdowns.

MTTR (How fast do we recover?)
The repair durations are 4, 2, and 2 hours.
MTTR= 
3
4+2+2
​
 ≈2.67 hours
Meaning: When the machine does die, your technician gets it running again in under 3 hours on average.

The Key Takeaway
Question	Metric	Goal
How often do things break?	MTBF	Higher (fewer incidents)
How fast do we fix them?	MTTR	Lower (faster recovery)
In software, teams often focus only on preventing crashes (MTBF), but world-class SRE teams also drive MTTR down through automated rollbacks, feature flags, and redundancy—because every system eventually fails, and what matters is how little your users notice.
```
