---
title: "The PACELC Theorem"
termSlug: "the-pacelc-theorem"
year: 2025
month: 8
monthName: "August"
day: 19
order: 18
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "The PACELC Theorem is an extension of the famous CAP theorem that describes trade-offs in distributed systems. It states: \"In case of network Partition, choose between Availability and Consistency;..."
---
### Definition:

The PACELC Theorem is an extension of the famous CAP theorem that describes trade-offs in distributed systems. It states:

"In case of network Partition, choose between Availability and Consistency; Else (when network is fine), choose between Latency and Consistency."

P = Partition (network failure)
A = Availability
C = Consistency
E = Else (normal operation)
L = Latency
C = Consistency

### Example:

Think of a multi-location bank system with branches in New York and London:

During Network Partition (PA or PC):
Network cable between cities gets cut:

Choose Availability (PA):

Both branches stay open and accept transactions
Risk: Someone might withdraw money in both cities, overdrawing account
Choose Consistency (PC):

System shuts down to prevent conflicts
Risk: Customers can't access their money
During Normal Operation (EL or EC):
Network is working fine:

Choose Latency (EL):

Show account balance immediately from local cache
Risk: Balance might be slightly outdated (eventual consistency)
Choose Consistency (EC):

Always check with all locations before showing balance
Risk: Takes longer to display account information
