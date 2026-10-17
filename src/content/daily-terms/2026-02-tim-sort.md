---
title: "Tim Sort"
termSlug: "tim-sort"
year: 2026
month: 2
monthName: "February"
day: 10
order: 7
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "TimSort is a hybrid, stable sorting algorithm that combines the best aspects of Merge Sort and Insertion Sort. Designed by Tim Peters in 2002 for Python, it identifies naturally ordered sequences (..."
---
### Definition:

TimSort is a hybrid, stable sorting algorithm that combines the best aspects of Merge Sort and Insertion Sort. Designed by Tim Peters in 2002 for Python, it identifies naturally ordered sequences (called "runs") in the data and intelligently merges them. TimSort is now the default sorting algorithm in Python, Java (for objects), Android, and many other platforms because it performs exceptionally well on real-world data that often has some existing order.

**Key Concepts:**

- Hybrid Algorithm: Uses Insertion Sort for small chunks, Merge Sort for combining
- Adaptive: Takes advantage of existing order in data
- Stable: Equal elements maintain their relative order
- Real-World Optimized: Designed for actual data, not worst-case academic scenarios
- Runs: Pre-sorted sequences that TimSort identifies and merges

### Example:

Sorting User Data

```
The Data

// Orders often arrive in semi-sorted order
// (e.g., grouped by date, customer, or status)

interface Order {
  id: string;
  customerId: string;
  date: Date;
  total: number;
  status: 'pending' | 'shipped' | 'delivered';
}

const orders: Order[] = [
  // Recent orders (already sorted by date)
  { id: 'A1', customerId: 'C1', date: new Date('2024-01-15'), total: 100, status: 'pending' },
  { id: 'A2', customerId: 'C2', date: new Date('2024-01-16'), total: 150, status: 'pending' },
  { id: 'A3', customerId: 'C3', date: new Date('2024-01-17'), total: 200, status: 'pending' },

  // Older orders (mixed order)
  { id: 'B5', customerId: 'C5', date: new Date('2024-01-10'), total: 80, status: 'shipped' },
  { id: 'B3', customerId: 'C3', date: new Date('2024-01-08'), total: 120, status: 'shipped' },
  { id: 'B4', customerId: 'C4', date: new Date('2024-01-09'), total: 90, status: 'shipped' },

  // Delivered orders (already sorted by date)
  { id: 'C1', customerId: 'C1', date: new Date('2024-01-01'), total: 50, status: 'delivered' },
  { id: 'C2', customerId: 'C2', date: new Date('2024-01-02'), total: 75, status: 'delivered' },
  { id: 'C3', customerId: 'C3', date: new Date('2024-01-03'), total: 60, status: 'delivered' }
];

// Goal: Sort by date (oldest to newest)
TimSort in Action

// Python (using TimSort by default)
orders.sort(key=lambda x: x.date)

// JavaScript (V8 engine uses TimSort for large arrays)
orders.sort((a, b) => a.date.getTime() - b.date.getTime());

// What TimSort Does Behind the Scenes:
Step 1: Identify Runs

Scanning for naturally ordered sequences...

Run 1: Pending orders (already sorted by date)
[
  { id: 'A1', date: '2024-01-15', ... },
  { id: 'A2', date: '2024-01-16', ... },
  { id: 'A3', date: '2024-01-17', ... }
]
✅ Length: 3, Ascending: Yes
   → Keep as-is!

Run 2: Shipped orders (NOT sorted)
[
  { id: 'B5', date: '2024-01-10', ... },  ← Out of order
  { id: 'B3', date: '2024-01-08', ... },
  { id: 'B4', date: '2024-01-09', ... }
]
❌ Length: 3, Descending order? No, Mixed!
   → Use Insertion Sort to fix:
   [
     { id: 'B3', date: '2024-01-08', ... },
     { id: 'B4', date: '2024-01-09', ... },
     { id: 'B5', date: '2024-01-10', ... }
   ]
   ✅ Now sorted!

Run 3: Delivered orders (already sorted by date)
[
  { id: 'C1', date: '2024-01-01', ... },
  { id: 'C2', date: '2024-01-02', ... },
  { id: 'C3', date: '2024-01-03', ... }
]
✅ Length: 3, Ascending: Yes
   → Keep as-is!
Step 2: Merge Runs

Merge Run 3 (delivered) + Run 2 (shipped):

Before:
Run 3: [2024-01-01, 2024-01-02, 2024-01-03]
Run 2: [2024-01-08, 2024-01-09, 2024-01-10]

Merge (all Run 3 elements come before Run 2):
[2024-01-01, 2024-01-02, 2024-01-03, 2024-01-08, 2024-01-09, 2024-01-10]

✅ Galloping mode detected!
   (All elements from one run come before the other)
   → Fast merge, minimal comparisons!

Merge Result + Run 1 (pending):

Before:
Merged: [2024-01-01, ..., 2024-01-10]
Run 1:  [2024-01-15, 2024-01-16, 2024-01-17]

Final Merge:
[2024-01-01, 2024-01-02, 2024-01-03, 2024-01-08, 2024-01-09,
 2024-01-10, 2024-01-15, 2024-01-16, 2024-01-17]

✅ All runs merged efficiently!
Final Result:

const sortedOrders = [
  { id: 'C1', customerId: 'C1', date: new Date('2024-01-01'), total: 50, status: 'delivered' },
  { id: 'C2', customerId: 'C2', date: new Date('2024-01-02'), total: 75, status: 'delivered' },
  { id: 'C3', customerId: 'C3', date: new Date('2024-01-03'), total: 60, status: 'delivered' },
  { id: 'B3', customerId: 'C3', date: new Date('2024-01-08'), total: 120, status: 'shipped' },
  { id: 'B4', customerId: 'C4', date: new Date('2024-01-09'), total: 90, status: 'shipped' },
  { id: 'B5', customerId: 'C5', date: new Date('2024-01-10'), total: 80, status: 'shipped' },
  { id: 'A1', customerId: 'C1', date: new Date('2024-01-15'), total: 100, status: 'pending' },
  { id: 'A2', customerId: 'C2', date: new Date('2024-01-16'), total: 150, status: 'pending' },
  { id: 'A3', customerId: 'C3', date: new Date('2024-01-17'), total: 200, status: 'pending' }
];

console.log("✅ Sorted by date, oldest to newest");
console.log("✅ Stable: Orders with same date maintain original order");
console.log("✅ Efficient: Reused existing sorted runs");
Performance Comparison

Array Size: 9 orders
Existing Order: 2/3 already sorted

❌ QuickSort:
├─ Ignores existing order
├─ Comparisons: ~18
├─ Time: 0.05ms
└─ Unstable (might reorder equal elements)

❌ Merge Sort:
├─ Ignores existing order
├─ Comparisons: ~16
├─ Time: 0.04ms
└─ Stable ✅

✅ TimSort:
├─ Exploits existing order
├─ Comparisons: ~9 (50% fewer!)
├─ Time: 0.02ms (2× faster!)
└─ Stable ✅

For larger arrays (10,000+ items with patterns):
TimSort can be 5-10× faster than traditional algorithms!
```
