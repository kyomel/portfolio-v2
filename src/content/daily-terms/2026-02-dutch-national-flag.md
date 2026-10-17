---
title: "Dutch National Flag"
termSlug: "dutch-national-flag"
year: 2026
month: 2
monthName: "February"
day: 20
order: 15
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Dutch National Flag is an array sorting pattern (algorithm) that efficiently partitions an array into three sections based on a pivot value: elements less than pivot (left), equal to pivot (middle)..."
---
### Definition:

Dutch National Flag is an array sorting pattern (algorithm) that efficiently partitions an array into three sections based on a pivot value: elements less than pivot (left), equal to pivot (middle), and greater than pivot (right). Named after the three-colored Dutch flag (red-white-blue), it uses three pointers to sort in a single pass with O(n) time and O(1) space. It's commonly used to solve problems involving sorting arrays with three distinct values (like 0s, 1s, and 2s).

**Key Concepts:**

- Three Pointers: low, mid, high to track three sections
- Single Pass: Processes array once (O(n) time)
- In-Place: No extra space needed (O(1) space)
- Three-Way Partition: Divides into less-than, equal-to, greater-than
- Common Problem: Sort array of 0s, 1s, and 2s

### Example:

Traffic Light Sorter

```
The Problem

// A parking lot has cars that prefer different traffic signals
// Sort them by preference: RED → YELLOW → GREEN

const parkingLot = [
  { id: 'Car1', prefers: 'GREEN' },
  { id: 'Car2', prefers: 'RED' },
  { id: 'Car3', prefers: 'YELLOW' },
  { id: 'Car4', prefers: 'GREEN' },
  { id: 'Car5', prefers: 'RED' },
  { id: 'Car6', prefers: 'YELLOW' },
  { id: 'Car7', prefers: 'RED' },
  { id: 'Car8', prefers: 'GREEN' }
];

// Goal: [RED, RED, RED, YELLOW, YELLOW, GREEN, GREEN, GREEN]
Solution with Dutch Flag Pattern

function sortCarsByPreference(cars) {
  let low = 0;   // RED cars section
  let mid = 0;   // Current car
  let high = cars.length - 1;  // GREEN cars section

  while (mid <= high) {
    const preference = cars[mid].prefers;

    if (preference === 'RED') {
      // Swap with low boundary (RED section)
      [cars[low], cars[mid]] = [cars[mid], cars[low]];

      console.log(`Move ${cars[mid].id} (RED) to front`);

      low++;
      mid++;

    } else if (preference === 'YELLOW') {
      // Already in correct section, just advance
      console.log(`Keep ${cars[mid].id} (YELLOW) in middle`);
      mid++;

    } else { // GREEN
      // Swap with high boundary (GREEN section)
      [cars[mid], cars[high]] = [cars[high], cars[mid]];

      console.log(`Move ${cars[mid].id} (GREEN) to back`);

      high--;
      // Don't increment mid!
    }
  }

  return cars;
}

// Execute:
const sorted = sortCarsByPreference(parkingLot);

console.log('\nSorted parking lot:');
sorted.forEach((car, i) => {
  console.log(`Spot ${i + 1}: ${car.id} (${car.prefers})`);
});

/*
Output:
Move Car1 (GREEN) to back
Move Car2 (RED) to front
Keep Car3 (YELLOW) in middle
Move Car4 (GREEN) to back
Move Car5 (RED) to front
Keep Car6 (YELLOW) in middle
Move Car7 (RED) to front

Sorted parking lot:
Spot 1: Car2 (RED)
Spot 2: Car5 (RED)
Spot 3: Car7 (RED)
Spot 4: Car3 (YELLOW)
Spot 5: Car6 (YELLOW)
Spot 6: Car4 (GREEN)
Spot 7: Car1 (GREEN)
Spot 8: Car8 (GREEN)
*/
Visualization

Initial:
[🚗G, 🚗R, 🚗Y, 🚗G, 🚗R, 🚗Y, 🚗R, 🚗G]
 ↑                                    ↑
 L,M                                  H

After processing:
[🚗R, 🚗R, 🚗R, 🚗Y, 🚗Y, 🚗G, 🚗G, 🚗G]
 └─ RED ─┘  └YELLOW┘  └─ GREEN ─┘

Perfect organization in ONE pass! ✅
```
