---
title: "Principle of Inclusion and Exclusion(PIE)"
termSlug: "principle-of-inclusion-and-exclusion-pie"
year: 2025
month: 7
monthName: "July"
day: 31
order: 26
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "PIE is a combinatorial counting technique that calculates the size of the union of multiple sets by: Including individual set sizes Excluding pairwise intersections Including triple intersections"
---
### Definition:

PIE is a combinatorial counting technique that calculates the size of the union of multiple sets by:

- Including individual set sizes
- Excluding pairwise intersections
- Including triple intersections
- And so on, alternating signs

**Formula:**

```
|A ∪ B ∪ C| = |A| + |B| + |C| - |A ∩ B| - |A ∩ C| - |B ∩ C| + |A ∩ B ∩ C|
```

### Example:

- Students and Subjects
  Problem: In a class of 100 students:

- 60 study Math (M)
- 50 study Physics (P)
- 40 study Chemistry (C)
- 30 study both Math and Physics
- 20 study both Math and Chemistry
- 15 study both Physics and Chemistry
- 10 study all three subjects

Find: How many students study at least one subject?

**Solution using PIE:**

```
|M ∪ P ∪ C| = |M| + |P| + |C| - |M ∩ P| - |M ∩ C| - |P ∩ C| + |M ∩ P ∩ C|

= 60 + 50 + 40 - 30 - 20 - 15 + 10
= 150 - 65 + 10
= 95
```

Answer: 95 students study at least one subject.
