---
title: "Fisher-Yates Shuffle"
termSlug: "fisher-yates-shuffle"
year: 2025
month: 11
monthName: "November"
day: 20
order: 14
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Fisher-Yates Shuffle (also called Knuth Shuffle) is an algorithm that randomly shuffles the elements of an array or list, ensuring each possible permutation has an equal probability of occurring. I..."
---
### Definition:

Fisher-Yates Shuffle (also called Knuth Shuffle) is an algorithm that randomly shuffles the elements of an array or list, ensuring each possible permutation has an equal probability of occurring. It works by repeatedly selecting a random element from the unshuffled portion and swapping it with the current position.

**Key characteristics:**

- Time complexity: O(n)
- Space complexity: O(1)
- Guarantees uniform randomness
- Each element has equal chance of ending up in any position

### Example:

Shuffling a Deck of 5 Cards

```
Initial deck: [A, 2, 3, 4, 5]

Step-by-step process:

Step 1: Pick random from positions 0-4 → Choose position 3 (card "4")

[A, 2, 3, 4, 5]  →  [4, 2, 3, A, 5]
 ↑       ↑            ↑       ↑
swap pos 0 and 3      fixed   remaining
Step 2: Pick random from positions 1-4 → Choose position 4 (card "5")

[4, 2, 3, A, 5]  →  [4, 5, 3, A, 2]
    ↑        ↑           ↑        ↑
    swap pos 1 and 4    fixed    remaining
Step 3: Pick random from positions 2-4 → Choose position 2 (card "3")

[4, 5, 3, A, 2]  →  [4, 5, 3, A, 2]
       ↑                    ↑
       stays same           fixed
Step 4: Pick random from positions 3-4 → Choose position 4 (card "2")

[4, 5, 3, A, 2]  →  [4, 5, 3, 2, A]
          ↑   ↑              ↑   ↑
          swap pos 3 and 4   fixed
Final shuffled deck: [4, 5, 3, 2, A]
```
