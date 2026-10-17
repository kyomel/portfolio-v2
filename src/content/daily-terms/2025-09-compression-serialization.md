---
title: "Compression & Serialization"
termSlug: "compression-serialization"
year: 2025
month: 9
monthName: "September"
day: 25
order: 19
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Serialization converts objects/data structures into a format that can be stored or transmitted (like turning a house into a blueprint). Compression reduces the size of data by removing redundancy (..."
---
### Definition:
Serialization converts objects/data structures into a format that can be stored or transmitted (like turning a house into a blueprint). Compression reduces the size of data by removing redundancy (like vacuum-packing clothes). They're often used together to efficiently store and transfer data.

**Key Concepts**
- Serialization: Object → Bytes/String (JSON, XML, Binary)
- Compression: Large data → Smaller data (ZIP, GZIP, LZ4)
- Combined: Object → Serialized → Compressed → Transmitted

### Example:
Netflix Video Streaming:
- Serialization: Movie metadata → JSON
- Compression: Video files → H.264/H.265 codecs
- Result: 4K movie fits in reasonable download size

WhatsApp Messages:

- Serialization: Message object → Protocol Buffers
- Compression: Text → LZ4 compression
- Result: Millions of messages stored efficiently
