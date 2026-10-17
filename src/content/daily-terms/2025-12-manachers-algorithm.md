---
title: "Manacher's Algorithm"
termSlug: "manachers-algorithm"
year: 2025
month: 12
monthName: "December"
day: 18
order: 14
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "Manacher's Algorithm is a clever technique for finding the longest palindromic substring in a string in linear time O(n). It avoids redundant checking by leveraging the symmetry property of palindr..."
---
### Definition:

Manacher's Algorithm is a clever technique for finding the longest palindromic substring in a string in linear time O(n). It avoids redundant checking by leveraging the symmetry property of palindromes - if you've already identified a palindrome, you can use that information to skip unnecessary character comparisons when looking for other palindromes.

**Key characteristics:**

- Finds longest palindrome in O(n) time
- Uses symmetry to avoid redundant checks
- Handles both odd and even length palindromes
- More efficient than brute force O(n²) approach
- Uses "center expansion" with clever optimization

### Example:

Finding Longest Palindrome
Scenario: Find the longest palindromic substring

```
┌─────────────────────────────────────────────────────┐
│        PALINDROME FINDING COMPARISON                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  String: "babad"                                    │
│                                                     │
│  What is a palindrome?                              │
│  └─ Reads the same forwards and backwards          │
│                                                     │
│  Examples:                                          │
│  ├─ "aba" → reversed = "aba" ✅                    │
│  ├─ "bab" → reversed = "bab" ✅                    │
│  └─ "bad" → reversed = "dab" ❌                    │
│                                                     │
│  Longest palindrome in "babad": "bab" (or "aba")  │
│                                                     │
└─────────────────────────────────────────────────────┘
The Problem: Naive Approach is Slow
┌─────────────────────────────────────────────────────┐
│        NAIVE APPROACH (Slow!)                       │
└─────────────────────────────────────────────────────┘

String: "babad"
Check every possible substring:

Length 1:  b  a  b  a  d     All palindromes ✓
Length 2:  ba ab ba ad        None palindromes ✗
Length 3:  bab aba bad        "bab", "aba" ✓
Length 4:  baba abad          None ✗
Length 5:  babad              None ✗

Total checks: 15 substrings
Time complexity: O(n²) to O(n³)

For "babad" (5 chars): 15 checks
For 100 chars: ~5,000 checks
For 10,000 chars: ~50,000,000 checks! 😱
✅ Manacher's Algorithm:

┌─────────────────────────────────────────────────────┐
│        MANACHER'S ALGORITHM (Fast!)                 │
└─────────────────────────────────────────────────────┘

String: "babad"

Using symmetry and previous palindrome information:
- Processes each character once
- Skips redundant comparisons using "mirror" information
- Finds answer in one pass

Total checks: ~10 comparisons
Time complexity: O(n)

For "babad" (5 chars): ~10 checks
For 100 chars: ~100 checks
For 10,000 chars: ~10,000 checks! ✅

Result: Same answer, 100x-1000x faster!
The Key Insight: Symmetry
┌─────────────────────────────────────────────────────┐
│          PALINDROME SYMMETRY PROPERTY               │
└─────────────────────────────────────────────────────┘

If you have a palindrome:

         a  b  c  b  a
         ↑     ↑     ↑
       Left  Center Right

The LEFT side MIRRORS the RIGHT side!

If we know:
- There's a small palindrome on the LEFT ("aba")
- We're inside a larger palindrome ("abcba")

Then:
- There MUST be a mirrored palindrome on the RIGHT!
- We can USE this info instead of checking again!

Example: "racecar"

    r  a  c  e  c  a  r
    ↑        ↑        ↑
    0        3        6

Center at position 3 ('e')

If we found palindrome at position 1 (radius 1):
    "aca"

We can predict position 5 will ALSO have radius 1:
    "aca"
    (it's the mirror!)

This saves checking character by character!
How It Works Step-by-Step:
┌─────────────────────────────────────────────────────┐
│        MANACHER'S ALGORITHM STEPS                   │
└─────────────────────────────────────────────────────┘

STEP 1: Transform String (Handle Even/Odd Palindromes)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Original:  b  a  b  a  d                          │
│                                                     │
│  Problem: "abba" (even) vs "aba" (odd)             │
│  - Different center types are hard to handle       │
│                                                     │
│  Solution: Add '#' between characters:              │
│                                                     │
│  Modified:  #  b  #  a  #  b  #  a  #  d  #        │
│             0  1  2  3  4  5  6  7  8  9  10       │
│                                                     │
│  Now ALL palindromes have odd length!              │
│  - "aba" → "#a#b#a#"                              │
│  - "abba" → "#a#b#b#a#"                           │
│                                                     │
└─────────────────────────────────────────────────────┘

STEP 2: Build Palindrome Radius Array
┌─────────────────────────────────────────────────────┐
│                                                     │
│  For each position, find palindrome radius:        │
│                                                     │
│  Position:  #  b  #  a  #  b  #  a  #  d  #        │
│  Index:     0  1  2  3  4  5  6  7  8  9  10       │
│  Radius:    0  1  0  3  0  3  0  1  0  1  0        │
│                                                     │
│  Radius = how far palindrome extends               │
│                                                     │
│  Position 3 (a): radius 3                          │
│      # b # a # b #                                 │
│          ←─┴─→                                     │
│        3 left, 3 right                             │
│        = palindrome "bab"                          │
│                                                     │
│  Position 5 (b): radius 3                          │
│      # a # b # a #                                 │
│          ←─┴─→                                     │
│        = palindrome "aba"                          │
│                                                     │
└─────────────────────────────────────────────────────┘

STEP 3: Use Symmetry to Skip Work
┌─────────────────────────────────────────────────────┐
│                                                     │
│  When processing position i:                        │
│                                                     │
│  If i is inside a known palindrome centered at C:  │
│                                                     │
│      |<----- Known Palindrome ----->|              │
│      |                               |              │
│      C         i_mirror       C      i              │
│      |←─────────┼─────────────┼─────→|             │
│                 │             │                     │
│           Mirror relationship!                      │
│                                                     │
│  Then: radius[i] ≥ min(radius[i_mirror], R - i)   │
│  (Start with mirror's radius, then expand)         │
│                                                     │
└─────────────────────────────────────────────────────┘

STEP 4: Find Maximum
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Largest radius = longest palindrome!              │
│                                                     │
│  Radius array: [0, 1, 0, 3, 0, 3, 0, 1, 0, 1, 0]  │
│                      ↑        ↑                     │
│                    Max = 3                          │
│                                                     │
│  Position 3 or 5, radius 3 = palindrome length 3   │
│  Remove '#' markers → "bab" or "aba"               │
│                                                     │
└─────────────────────────────────────────────────────┘
```
