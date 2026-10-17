---
title: "Reservoir Sampling"
termSlug: "reservoir-sampling"
year: 2025
month: 9
monthName: "September"
day: 30
order: 22
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Reservoir Sampling is an algorithm for randomly selecting k items from a stream of n items where n is either very large or unknown. It ensures each item has an equal probability of being selected,..."
---
### Definition:
Reservoir Sampling is an algorithm for randomly selecting k items from a stream of n items where n is either very large or unknown. It ensures each item has an equal probability of being selected, using only one pass through the data and O(k) memory.

**Key Properties:**
- Single pass: Process data once as it arrives
- Constant memory: Only stores k items regardless of stream size
- Equal probability: Each item has exactly k/n chance of selection
- Unknown size: Works even when you don't know how many items total

Algorithm Steps:
1. Fill reservoir with first k items
2. For each subsequent item i (where i > k):
   - Generate random number j between 1 and i
   - If j ≤ k, replace reservoir[j] with current item

### Example:
Select 3 random songs from a playlist of unknown size
```
Stream: [Song1, Song2, Song3, Song4, Song5, Song6, Song7]
Reservoir size k = 3

Step 1: Fill reservoir with first 3 items
Reservoir: [Song1, Song2, Song3]

Step 2: Process Song4 (i=4)
- Random j between 1-4 → j=2
- j ≤ k (3), so replace reservoir[2] with Song4
Reservoir: [Song1, Song4, Song3]

Step 3: Process Song5 (i=5)
- Random j between 1-5 → j=5
- j > k (3), so keep current reservoir
Reservoir: [Song1, Song4, Song3]

Step 4: Process Song6 (i=6)
- Random j between 1-6 → j=1
- j ≤ k (3), so replace reservoir[1] with Song6
Reservoir: [Song6, Song4, Song3]

Step 5: Process Song7 (i=7)
- Random j between 1-7 → j=4
- j > k (3), so keep current reservoir
Final: [Song6, Song4, Song3]
```

Code example:
```
import random

def reservoir_sampling(stream, k):
    reservoir = []
    
    for i, item in enumerate(stream):
        if i < k:
            reservoir.append(item)
        else:
            j = random.randint(0, i)
            if j < k:
                reservoir[j] = item
    
    return reservoir
```
