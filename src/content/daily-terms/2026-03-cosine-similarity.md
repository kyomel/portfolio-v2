---
title: "Cosine Similarity"
termSlug: "cosine-similarity"
year: 2026
month: 3
monthName: "March"
day: 3
order: 2
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "Cosine Similarity is a metric that measures how similar two things are by calculating the cosine of the angle between their vector representations — focusing on direction, not size."
---
### Definition:

Cosine Similarity is a metric that measures how similar two things are by calculating the cosine of the angle between their vector representations — focusing on direction, not size.

The smaller the angle between two vectors, the more similar they are.

Simple Analogy
🧭 Two people walking — it doesn't matter if one walks faster or slower. If they're walking in the same direction, they're going to the same place. Cosine similarity measures direction alignment, not speed.

The Formula
Cosine Similarity(A,B)=
∥A∥×∥B∥
A⋅B
​

Where:

- A⋅B = dot product of vectors A and B
- ∥A∥ and ∥B∥ = magnitudes (lengths) of each vector

Result Range
| Value | Meaning |
|-------|------------------------------------------|
| 1 | Identical direction (perfectly similar) |
| 0 | Perpendicular (no similarity) |
| -1 | Opposite direction (completely dissimilar) |

### Example:

Text Similarity
Imagine comparing two sentences to see how similar they are.

```
Sentence A: "I love cats"
Sentence B: "I love dogs"
Step 1 — Build a word frequency table
Word	Sentence A	Sentence B
I	1	1
love	1	1
cats	1	0
dogs	0	1
So the vectors are:

A=[1,1,1,0]
B=[1,1,0,1]

Step 2 — Calculate dot product
A⋅B=(1×1)+(1×1)+(1×0)+(0×1)=2

Step 3 — Calculate magnitudes
∥A∥=
1
2
 +1
2
 +1
2
 +0
2

​
 =
3
​
 ≈1.732

∥B∥=
1
2
 +1
2
 +0
2
 +1
2

​
 =
3
​
 ≈1.732

Step 4 — Final score
Cosine Similarity=
1.732×1.732
2
​
 =
3
2
​
 ≈0.667

✅ Score of 0.667 — the sentences are moderately similar (share structure and some words, but differ in one key word)
```
