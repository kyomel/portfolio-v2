---
title: "Hi-Lo Algorithm"
termSlug: "hi-lo-algorithm"
year: 2026
month: 6
monthName: "June"
day: 5
order: 5
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "The Hi-Lo Algorithm is an ID generation strategy that produces unique identifiers by combining two numbers: a \"Hi\" value fetched occasionally from a shared source (like a database), and a \"Lo\" valu..."
---
### Definition:

The Hi-Lo Algorithm is an ID generation strategy that produces unique identifiers by combining two numbers: a "Hi" value fetched occasionally from a shared source (like a database), and a "Lo" value that increments locally in memory. The formula:

ID=(Hi×blockSize)+Lo

In one sentence: Grab a big chunk of IDs from the database once, then hand them out locally until you run out — repeat. This avoids a database round-trip for every single ID.

Analogy — The Waiter's Check Numbers
Imagine a restaurant where every order needs a unique check number, and the central office owns the master list. Three waiters are taking orders simultaneously:

Approach What happens Problem
❌ Call the office for every order "Give me one check number!" → wait → get #42. Next order: call again → #43. Slow, bottleneck, waiters standing around on the phone
✅ Hi-Lo: Grab a block Waiter A: "Give me 100 numbers!" → gets block #0 (covers #0–#99). Waiter B: gets block #1 (covers #100–#199). Both hand out numbers locally without calling again. Fast, no waiting, office is barely bothered
Role Real World Hi-Lo Algorithm
Central office Master sequence / DB table Hi value — fetched occasionally
Waiter's own pad Local counter (0–99) Lo value — incremented in memory
Check number Final unique order number (Hi × blockSize) + Lo
"Give me another block" Waiter calls office when pad runs out Next database fetch when Lo hits blockSize
The office is contacted once per 100 orders, not once per order. That's the Hi-Lo magic.

### Example:

Hi-Lo ID Generator in Python

```
import threading

class HiLoGenerator:
    """
    Generates unique IDs without hitting the DB for every ID.
    Fetches a new 'Hi' block when the local 'Lo' runs out.
    """
    def __init__(self, block_size=100):
        self.block_size = block_size
        self.hi = -1          # Current high block (will trigger fetch on first next())
        self.lo = block_size  # Start at max to trigger immediate fetch
        self.lock = threading.Lock()

    def _fetch_next_hi(self):
        """
        Simulate a DB call to get the next available Hi block.
        In reality this would be:
            SELECT nextval('hi_sequence') FROM dual;  -- Oracle/PostgreSQL
            UPDATE hi_table SET hi = hi + 1;           -- manual table
        """
        # Simulated: in real code, this hits the database
        self._db_value = getattr(self, '_db_value', -1) + 1
        print(f"  📞 DB CALL → fetched Hi block #{self._db_value}")
        return self._db_value

    def next_id(self) -> int:
        """
        Returns the next unique ID.
        Calls the database ONLY when the local block is exhausted.
        """
        with self.lock:
            if self.lo >= self.block_size:
                # Ran out of local numbers → fetch new Hi block
                self.hi = self._fetch_next_hi()
                self.lo = 0

            generated_id = (self.hi * self.block_size) + self.lo
            self.lo += 1
            return generated_id

# ── Usage ──
gen = HiLoGenerator(block_size=5)   # Small block for demo

print("Generating IDs:")
for i in range(12):
    print(f"  → ID #{gen.next_id()}")
Output:

Generating IDs:
  📞 DB CALL → fetched Hi block #0
  → ID #0
  → ID #1
  → ID #2
  → ID #3
  → ID #4
  📞 DB CALL → fetched Hi block #1     ← Only 3 DB calls for 12 IDs!
  → ID #5
  → ID #6
  → ID #7
  → ID #8
  → ID #9
  📞 DB CALL → fetched Hi block #2
  → ID #10
  → ID #11
Only 3 database calls for 12 IDs. With block_size=1000, you'd need just 1 DB call per 1000 IDs.
```
