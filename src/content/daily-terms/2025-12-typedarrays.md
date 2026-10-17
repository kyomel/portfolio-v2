---
title: "TypedArrays"
termSlug: "typedarrays"
year: 2025
month: 12
monthName: "December"
day: 9
order: 7
source: "2025/dec-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/dec-term.md"
excerpt: "TypedArrays are array-like objects in JavaScript that provide a mechanism for reading and writing raw binary data in memory buffers. Unlike regular arrays that can hold mixed data types, TypedArray..."
---
### Definition:

TypedArrays are array-like objects in JavaScript that provide a mechanism for reading and writing raw binary data in memory buffers. Unlike regular arrays that can hold mixed data types, TypedArrays store fixed data types (integers, floats) in contiguous memory blocks, enabling faster performance and efficient memory usage for numerical operations.

**Key characteristics:**

- Fixed data type per array (Int8, Float32, etc.)
- Contiguous memory allocation
- Significantly faster for numerical operations
- Direct binary data manipulation
- Essential for WebGL, audio processing, file handling

### Example:

TypedArray
Scenario: Storing image pixel values (0-255)

```
// TypedArray - optimized for bytes (0-255)
const pixels = new Uint8Array([255, 128, 64, 255, 0, 128, 200, 100]);

// Benefits:
// - Each element uses exactly 1 byte
// - Type-safe
// - Much faster operations

pixels[0] = 300;      // Automatically becomes 44 (overflow handling)
pixels[1] = -1;       // Automatically becomes 255 (underflow handling)
console.log(pixels);  // Uint8Array [44, 255, 64, 255, 0, 128, 200, 100]

TypedArray Types Available:
┌─────────────────────────────────────────────────────┐
│              TYPED ARRAY TYPES                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  INTEGER TYPES:                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Int8Array      │ -128 to 127        │ 1 byte│   │
│  │ Uint8Array     │ 0 to 255           │ 1 byte│   │
│  │ Int16Array     │ -32768 to 32767    │ 2 bytes   │
│  │ Uint16Array    │ 0 to 65535         │ 2 bytes   │
│  │ Int32Array     │ -2B to 2B          │ 4 bytes   │
│  │ Uint32Array    │ 0 to 4B            │ 4 bytes   │
│  │ BigInt64Array  │ Very large         │ 8 bytes   │
│  │ BigUint64Array │ Very large         │ 8 bytes   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  FLOATING POINT TYPES:                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ Float32Array   │ 32-bit float       │ 4 bytes   │
│  │ Float64Array   │ 64-bit float       │ 8 bytes   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  SPECIAL:                                           │
│  ┌─────────────────────────────────────────────┐   │
│  │ Uint8ClampedArray │ 0-255, clamped  │ 1 byte│   │
│  │                   │ (no overflow)   │       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
Memory Comparison:
┌─────────────────────────────────────────────────────┐
│          MEMORY USAGE COMPARISON                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Storing 1000 numbers (0-255):                      │
│                                                     │
│  Regular Array:                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [255, 128, 64, ...]                         │   │
│  │                                             │   │
│  │ Memory: ~8,000+ bytes                       │   │
│  │ (Each number stored as 64-bit float)       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Uint8Array:                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ Uint8Array([255, 128, 64, ...])             │   │
│  │                                             │   │
│  │ Memory: 1,000 bytes exactly                 │   │
│  │ (Each number stored as 8-bit integer)      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Savings: 87.5% less memory!                       │
│                                                     │
└─────────────────────────────────────────────────────┘
How TypedArrays Work:
┌─────────────────────────────────────────────────────┐
│              TYPED ARRAY ARCHITECTURE               │
└─────────────────────────────────────────────────────┘

Step 1: ArrayBuffer (Raw Memory)
┌─────────────────────────────────────────────────────┐
│  ArrayBuffer - Raw binary data container            │
│                                                     │
│  const buffer = new ArrayBuffer(16);  // 16 bytes  │
│                                                     │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│  │00│00│00│00│00│00│00│00│00│00│00│00│00│00│00│00││
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15  │
│                                                     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
Step 2: TypedArray View (Interpret the bytes)
┌─────────────────────────────────────────────────────┐
│  Same buffer, different interpretations:            │
│                                                     │
│  As Uint8Array (16 elements, 1 byte each):          │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│  │ 0│ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│11│12│13│14│15││
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│                                                     │
│  As Int32Array (4 elements, 4 bytes each):          │
│  ┌────────────┬────────────┬────────────┬──────────┐│
│  │     0      │     1      │     2      │    3     ││
│  └────────────┴────────────┴────────────┴──────────┘│
│                                                     │
│  As Float64Array (2 elements, 8 bytes each):        │
│  ┌────────────────────────┬────────────────────────┐│
│  │          0             │          1             ││
│  └────────────────────────┴────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```
