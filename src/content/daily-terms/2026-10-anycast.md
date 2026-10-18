---
title: "Anycast"
termSlug: "anycast"
year: 2026
month: 10
monthName: "October"
day: 15
order: 11
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Anycast is a network addressing and routing method. One IP address belongs to many servers. The servers sit in different locations. The routing system sends each user to one server. The user does n..."
---
### Definition:

**Anycast** is a network addressing and routing method. One IP address belongs to many servers. The servers sit in different locations. The routing system sends each user to one server. The user does not know which one.

The method breaks a basic assumption of the internet. Most traffic is **unicast**: one address points to one machine. Anycast keeps one address and points it at many machines. Routing decides which machine answers.

Anycast has no protocol of its own. It borrows BGP. The operator takes a prefix, for example `198.51.100.0/24`, and announces it from several sites. Each site is an independent origin. BGP now sees N paths to one prefix instead of one path. Routers run the same best-path selection that they run for every other prefix. They pick one path. That pick holds until the routing changes.

RFC 4786 (BCP 126, published in 2006) names the parts. An anycast **node** is a group of hosts and routers that serve the address at one site. The **catchment** of a node is the region whose packets flow to that node.

```text
UNICAST vs ANYCAST vs MULTICAST
═══════════════════════════════════════════════════════════════════════

 UNICAST — one address, one owner
 ─────────────────────────────────────────────────────────────────────
   user A (Berlin)  ──┐
   user B (Jakarta) ──┼────▶  198.51.100.53   ┌──────────────┐
   user C (Lima)    ──┘      single route     │   node       │
                                              │   Frankfurt  │
                                              └──────────────┘
   every user crosses the planet to one box.
   distance is not part of the decision.

 ANYCAST — one address, many owners, routing picks one
 ─────────────────────────────────────────────────────────────────────
                          ┌───────────────┐
   user A (Berlin) ──────▶│ node Frankfurt│  AS64500 says: /24 is here
                          └───────────────┘
                          ┌───────────────┐
   user B (Jakarta) ─────▶│ node Singapore│  AS64500 says: /24 is here
                          └───────────────┘
                          ┌───────────────┐
   user C (Lima) ────────▶│ node São Paulo│  AS64500 says: /24 is here
                          └───────────────┘

   every user dials 198.51.100.53.
   BGP sends each user to the node the network likes best.
   one box in one city can serve a whole region.

 MULTICAST — one address, all listeners at once (a different tool)
 ─────────────────────────────────────────────────────────────────────
   sender ──▶ group address ──▶ many receivers
   the network copies one packet onto many links.
   anycast never copies a packet. it still sends one packet to one node.

 WHAT ANYCAST BUYS / WHAT IT COSTS
 ─────────────────────────────────────────────────────────────────────
   PRO                                 CON
   • latency drops: traffic enters     • "nearest" means topologically
     the closest node                    nearest, not geographically
   • a DDoS spreads over N nodes       • load can land unevenly
   • failover in seconds, from BGP     • TCP state lives on one node, so
     hold time, not from a DNS TTL       a mid-flow path change kills it
   • no hardware load balancer and     • needs its own AS, its own BGP,
     no virtual IP to move               and carrier tuning to stop
   • one IP serves every client          route flapping
```

Two properties matter more than the rest.

First, anycast likes **stateless services**. DNS is the classic case. One query fits in one packet. The answer does not depend on earlier packets. Any node can answer. That is why anycast carries the DNS root, and why it works there.

Second, anycast dislikes **mid-flight state**. A TCP connection lives inside one kernel. That kernel holds the sequence numbers, the window, and the TLS keys. No other node has them. If BGP moves the path while the connection is open, later packets arrive at a node that never saw the handshake. That node replies with a reset, and the connection dies. In practice the path stays stable for the life of most connections. So anycast TCP works well. The failure mode is real but rare, and it appears as a reset, not as silent corruption.

Failover is the headline benefit. The operator removes one announcement. BGP re-converges in seconds. DNS-based failover must first wait for a TTL to expire. Anycast skips that wait.

One warning sits under the word **nearest**. BGP does not measure latency. It compares attributes: local preference, AS-path length, origin, and MED. A short AS path can still be a long physical path. Real CDNs therefore pair anycast with DNS steering. DNS steering can read the resolver location and the EDNS Client Subnet of the user. BGP cannot see either one.

### Example:

**A public resolver answers from one address in three cities.**

A team runs a public DNS resolver on `198.51.100.53`. Three nodes announce this prefix. Each node runs its own BGP daemon.

```text
THREE NODES ANNOUNCE THE SAME PREFIX
═══════════════════════════════════════════════════════════════════════
  NODE          AS        ANNOUNCEMENT        CATCHMENT
  ─────────────────────────────────────────────────────────────────────
  Frankfurt     AS64500   198.51.100.0/24     Europe, north Africa
  Singapore     AS64500   198.51.100.0/24     South-East Asia, Oceania
  São Paulo     AS64500   198.51.100.0/24     South America
  ─────────────────────────────────────────────────────────────────────
  three independent origins.  no primary.  no standby.
  BGP reads them as three equal claims to one prefix.
```

A user in Jakarta sends one query.

```text
QUERY FROM JAKARTA — ROUTING DECIDES, NOT DNS
═══════════════════════════════════════════════════════════════════════
   laptop (Jakarta)
       │  UDP query  ->  198.51.100.53
       ▼
   ┌───────────────────────────────────┐
   │ ISP router                        │   BGP table, three paths
   │   from Singapore   AS-path len 1  │◀── winner
   │   from Frankfurt   AS-path len 4  │
   │   from São Paulo   AS-path len 6  │
   └────────────────┬──────────────────┘
                    ▼
   ┌───────────────────────────────────┐
   │ node SINGAPORE                    │   answers in about 12 ms
   │ holds the catchment for SE Asia   │
   └───────────────────────────────────┘

   the laptop never learns that the other two nodes exist.
   no DNS lookup picked Singapore.  the routing table did.
```

Now the Singapore node fails.

```text
FAILOVER WITHOUT A CLIENT CHANGE
═══════════════════════════════════════════════════════════════════════
   t = 0 s      the node fails its own health check
   t = 1 s      the node stops announcing 198.51.100.0/24
   t = 5-30 s   BGP withdraws the path; neighbours recompute best path
   t = then     routers point Jakarta at Frankfurt

   ┌────────────┐  withdraw  ┌──────────────┐  recompute  ┌───────────┐
   │ Singapore  │ ─────────▶ │ ISP router   │ ──────────▶ │ Frankfurt │
   │ node       │            │ (BGP)        │             │ node      │
   └────────────┘            └──────────────┘             └───────────┘
   ─────────────────────────────────────────────────────────────────────
   clients still send to 198.51.100.53.  nobody edits a client config.
   DNS failover would wait for a TTL first: minutes, not seconds.

   the price: a TCP session that is open during the switch gets a reset.
```

The same property gives DDoS defense. An attack on `198.51.100.53` divides itself over every node. Each node absorbs only the share that its catchment sends. Cloudflare reports data centers in more than 335 cities that all advertise the same external addresses. The company reports one large attack spread across 477 data centers in 293 locations. The attack spent itself before any single site had to cope.

Cloudflare also runs anycast a second time inside one building. Every server in a data center runs the Bird BGP daemon and announces the public prefixes to the local routers. The routers then use ECMP with five-tuple hashing. This design removes the hardware load balancer, which would otherwise be the single point of failure that anycast was meant to delete. When one server is busy, it raises its BGP weight or withdraws its route, and the load moves to a neighbour. FastRoute (USENIX NSDI 2015) automated the same idea at CDN scale for Microsoft.

The technique is not new. The DNS root uses it: 13 identities, run by 12 independent operators. The Root Server Technical Operations Association recorded 2,047 live instances on 15 October 2026. Public resolvers use it too, including `8.8.8.8` and `1.1.1.1`. So does NTP, and so does the internal fabric of many data centers.

Two honest limits. Anycast spreads connections, but it does not balance them. One catchment can be far larger than another, and a node with a short AS path can draw traffic from half a continent. Second, anycast needs real network work: an autonomous system number, BGP sessions, routing policy, and tuning to prevent flapping. A team without those pieces should use DNS steering or a hosted load balancer instead. The pattern is powerful, and the entry price is not low.
