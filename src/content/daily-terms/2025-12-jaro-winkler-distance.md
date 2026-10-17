---
title: "Jaro-Winkler Distance"
termSlug: "jaro-winkler-distance"
year: 2025
month: 12
monthName: "December"
day: 16
order: 12
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Jaro-Winkler Distance is a string similarity metric that measures how similar two strings are, with extra weight given to matching prefixes (characters at the beginning). It produces a score betwee..."
---
### Definition:

Jaro-Winkler Distance is a string similarity metric that measures how similar two strings are, with extra weight given to matching prefixes (characters at the beginning). It produces a score between 0 and 1, where 1 means identical strings and 0 means completely different. It's particularly effective for comparing names and short strings where common beginnings indicate higher similarity.

**Key characteristics:**

- Score ranges from 0 (no similarity) to 1 (identical)
- Favors strings with matching prefixes
- Accounts for character transpositions
- Designed for short strings like names
- More accurate than simple edit distance for typos

### Example:

Comparing Names
Scenario: Matching customer names with typos

```
┌─────────────────────────────────────────────────────┐
│           JARO-WINKLER SIMILARITY                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  String 1: "MARTHA"                                 │
│  String 2: "MARHTA"                                 │
│                                                     │
│  Jaro Similarity:      0.944                        │
│  Jaro-Winkler Score:   0.961  (boosted!)           │
│                                                     │
│  Why higher? Both start with "MAR" (common prefix) │
│                                                     │
└─────────────────────────────────────────────────────┘
More Examples:
┌─────────────────────────────────────────────────────┐
│        STRING COMPARISONS                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  "JOHN" vs "JOHN"      →  1.000  (identical)       │
│  "JOHN" vs "JONH"      →  0.933  (transposition)   │
│  "JOHN" vs "JOAN"      →  0.867  (one different)   │
│  "JOHN" vs "JANE"      →  0.700  (some match)      │
│  "JOHN" vs "MIKE"      →  0.000  (nothing matches) │
│                                                     │
│  "JOHNSON" vs "JOHNSEN" → 0.952  (similar prefix)  │
│  "JOHNSON" vs "OHNSONJ" → 0.832  (no prefix match) │
│                                                     │
└─────────────────────────────────────────────────────┘
```
