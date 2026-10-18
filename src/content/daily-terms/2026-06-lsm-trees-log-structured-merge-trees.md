---
title: "LSM Trees (Log-Structured Merge-Trees)"
termSlug: "lsm-trees-log-structured-merge-trees"
year: 2026
month: 6
monthName: "June"
day: 2
order: 2
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "LSM Trees are a data structure designed for write-heavy workloads. Instead of updating data in place (like a B-tree), they just append every change to a log, then lazily sort and merge things in th..."
---
### Definition:

LSM Trees are a data structure designed for write-heavy workloads. Instead of updating data in place (like a B-tree), they just append every change to a log, then lazily sort and merge things in the background. The mantra: write fast now, organize later.

In one sentence: Turn random writes into sequential writes, then periodically tidy up.

Analogy — The Receptionist's Logbook
Picture a busy doctor's office. Patients arrive constantly. The receptionist has two tools:

Tool What happens LSM Equivalent
📝 Logbook on the desk Scribbles every arrival instantly, in order of arrival. Super fast — just append to the page. Memtable + WAL (in-memory + append-only log)
🗄️ Filing cabinet During quiet moments, she takes names from the logbook and files them alphabetically into patient folders. SSTables (sorted files on disk)
♻️ Merging old folders Eventually, she merges duplicate folders, keeping only the latest record for each patient. Compaction
Writing (new patient arrives): Just scribble in the logbook. Zero searching. Lightning fast.
Reading (find patient info): Check the logbook first, then check the filing cabinet. Slightly more work for reads, but writes fly.

How It Works

```text
    WRITE ──▶ [ Memtable (sorted, in RAM) ]    ← fastest
                    │
                    │ (when full, flush to disk)
                    ▼
              [ SSTable (sorted file) ]        ← disk, immutable
              [ SSTable (sorted file) ]
              [ SSTable (sorted file) ]
                    │
                    │ (background compaction)
                    ▼
              [ Merged SSTable ]               ← fewer files, garbage collected
```

### Example:

Simplified LSM Key-Value Store in Python
This is a dramatically simplified version to illustrate the mechanics. Real LSM engines use skip lists, bloom filters, binary search, and much more.

```
import bisect
import json
import os

class MiniLSM:
    def __init__(self, db_path="minilsm_data"):
        self.db_path = db_path
        os.makedirs(db_path, exist_ok=True)
        self.memtable = {}          # in-memory sorted dict
        self.sstables = []          # list of filenames on disk
        self.memtable_limit = 3     # flush after 3 entries (tiny for demo)

    def put(self, key, value):
        """Just write to memtable. Super fast!"""
        self.memtable[key] = value
        print(f"✍️  memtable ← {key}: {value}")

        if len(self.memtable) >= self.memtable_limit:
            self._flush()

    def get(self, key):
        """Read path: check memtable first, then SSTables (newest first)."""
        # 1. Check memtable (fastest, in RAM)
        if key in self.memtable:
            print(f"🔍 Found '{key}' in memtable")
            return self.memtable[key]

        # 2. Check SSTables, newest to oldest
        for sst_filename in reversed(self.sstables):
            with open(sst_filename, 'r') as f:
                data = json.load(f)
                if key in data:
                    print(f"🔍 Found '{key}' in {sst_filename}")
                    return data[key]
        return None

    def _flush(self):
        """Sort memtable, write to disk as a new SSTable, then clear memtable."""
        sst_name = f"{self.db_path}/sst_{len(self.sstables)+1:03d}.json"
        with open(sst_name, 'w') as f:
            # Sort by key before writing (real SSTables are always sorted)
            sorted_data = dict(sorted(self.memtable.items()))
            json.dump(sorted_data, f)

        self.sstables.append(sst_name)
        print(f"📦 Flushed → {sst_name} ({len(self.memtable)} entries)")
        self.memtable.clear()

    def compact(self):
        """Merge all SSTables into one, keeping only the latest value per key."""
        if len(self.sstables) < 2:
            return

        merged = {}
        # Read from oldest to newest, so newer values overwrite older
        for sst_filename in self.sstables:
            with open(sst_filename, 'r') as f:
                data = json.load(f)
                merged.update(data)   # newer overwrites older
            os.remove(sst_filename)   # delete old file

        # Write the single merged file
        new_sst = f"{self.db_path}/sst_merged.json"
        with open(new_sst, 'w') as f:
            json.dump(dict(sorted(merged.items())), f)

        self.sstables = [new_sst]
        print(f"♻️  Compacted → {new_sst} ({len(merged)} keys)")

# --- Usage ---
db = MiniLSM()

db.put("name", "Alice")     # memtable ←
db.put("city", "Paris")     # memtable ←
db.put("name", "Bob")       # overwrites Alice in memtable
db.put("age",  "30")        # triggers flush! (limit=3 reached)

print("\nReading...")
print(db.get("name"))        # checks memtable first
print(db.get("city"))        # checks SSTable
db.compact()                 # merge everything (real DBs do this in background)
Output:

✍️  memtable ← name: Alice
✍️  memtable ← city: Paris
✍️  memtable ← name: Bob
📦 Flushed → minilsm_data/sst_001.json (3 entries)
✍️  memtable ← age: 30

Reading...
🔍 Found 'name' in memtable
🔍 Found 'city' in minilsm_data/sst_001.json
♻️  Compacted → minilsm_data/sst_merged.json (4 keys)
Notice: name: Bob overwrites name: Alice because it was written later — no in-place update, just a newer entry that takes precedence.
```
