---
title: "Kadane's Algorithm"
termSlug: "kadanes-algorithm"
year: 2025
month: 11
monthName: "November"
day: 21
order: 15
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "Kadane's Algorithm is a dynamic programming algorithm that finds the maximum sum of any contiguous subarray (consecutive elements) in an array of numbers. It efficiently solves the \"Maximum Subarra..."
---
### Definition:

Kadane's Algorithm is a dynamic programming algorithm that finds the maximum sum of any contiguous subarray (consecutive elements) in an array of numbers. It efficiently solves the "Maximum Subarray Problem" in linear time by keeping track of the best sum ending at each position.

**Key characteristics:**

- Time complexity: O(n)
- Space complexity: O(1)
- Works with negative numbers
- Finds both the maximum sum and can track the subarray indices

### Example:

Finding Maximum Subarray Sum

```
Array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]

Step-by-step process:

Position:  0   1   2   3   4   5   6   7   8
Array:   [-2,  1, -3,  4, -1,  2,  1, -5,  4]
Algorithm Logic:

current_sum = best sum ending at current position
max_sum = overall best sum found so far
```
