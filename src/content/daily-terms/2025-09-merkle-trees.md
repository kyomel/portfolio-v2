---
title: "Merkle Trees"
termSlug: "merkle-trees"
year: 2025
month: 9
monthName: "September"
day: 29
order: 21
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "A Merkle Tree is a binary tree data structure where each leaf node contains a hash of a data block, and each non-leaf node contains a hash of its two child nodes. This creates a hierarchical struct..."
---
### Definition:
A Merkle Tree is a binary tree data structure where each leaf node contains a hash of a data block, and each non-leaf node contains a hash of its two child nodes. This creates a hierarchical structure that allows efficient and secure verification of large data sets.

**Key Properties:**
- Root hash: Single hash at the top representing the entire dataset
- Tamper-evident: Any change in data changes the root hash
- Efficient verification: Can verify specific data without downloading everything

### Example:
Let's say we have 4 transactions: A, B, C, D
```
        Root Hash
       /          \
   Hash(AB)      Hash(CD)
   /      \      /       \
Hash(A) Hash(B) Hash(C) Hash(D)
  |       |       |       |
  A       B       C       D
```
Step-by-step construction:

- Hash each transaction: Hash(A), Hash(B), Hash(C), Hash(D)
- Combine pairs: Hash(AB) = Hash(Hash(A) + Hash(B))
- Continue upward: Root = Hash(Hash(AB) + Hash(CD))
