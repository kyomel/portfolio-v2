---
title: "Logic Gates"
termSlug: "logic-gates"
year: 2026
month: 5
monthName: "May"
day: 14
order: 10
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "A logic gate is the fundamental building block of digital circuits. It takes one or more binary inputs (0 or 1, representing off/on or false/true) and produces a single binary output according to a..."
---
### Definition:

A logic gate is the fundamental building block of digital circuits. It takes one or more binary inputs (0 or 1, representing off/on or false/true) and produces a single binary output according to a fixed logical rule. Every computer, smartphone, and digital device is ultimately composed of billions of these gates arranged into complex networks.

The Core Types (One-Sentence Each)
Gate	Rule
AND	Output is 1 only if all inputs are 1.
OR	Output is 1 if at least one input is 1.
NOT	Output is the opposite of the single input.
XOR	Output is 1 if the inputs are different.

### Example:

Home Security System

```
A house alarm uses an AND gate connected to two sensors:

Sensor A (Front Door)	Sensor B (Motion)	AND Gate Output	Alarm
0 (closed)	0 (none)	0	Off
1 (open)	0 (none)	0	Off
0 (closed)	1 (motion)	0	Off
1 (open)	1 (motion)	1	On
The alarm only sounds when both conditions are true—someone opened the door and tripped the motion sensor. This prevents false triggers from a stray cat (motion only) or a gust of wind (door only).
```
