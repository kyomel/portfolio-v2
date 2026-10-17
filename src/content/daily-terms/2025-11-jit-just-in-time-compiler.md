---
title: "JIT(Just In Time) Compiler"
termSlug: "jit-just-in-time-compiler"
year: 2025
month: 11
monthName: "November"
day: 4
order: 2
source: "2025/nov-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/nov-term.md"
excerpt: "JIT Compiler is a compilation technique that compiles code during runtime rather than beforehand. It translates high-level code (like Java bytecode or JavaScript) into native machine code at the mo..."
---
### Definition:

JIT Compiler is a compilation technique that compiles code during runtime rather than beforehand. It translates high-level code (like Java bytecode or JavaScript) into native machine code at the moment it's needed for execution. JIT compilers analyze running code to identify frequently executed "hot spots" and optimize them aggressively, providing a balance between compilation speed and execution performance.

**Key Properties:**

- Runtime compilation: Code is compiled while the program runs
- Adaptive optimization: Optimizes based on actual usage patterns
- Hot spot detection: Focuses optimization on frequently executed code
- Profile-guided: Uses runtime profiling to make optimization decisions
- Dynamic: Can recompile and re-optimize code as patterns change

**Core Concepts:**

- Interpretation: Initial execution without compilation
- Compilation threshold: When code becomes "hot enough" to compile
- Optimization levels: Multiple tiers of increasingly aggressive optimization
- Deoptimization: Fall back when assumptions prove wrong
- Code cache: Store compiled machine code for reuse

### Example:

JavaScript V8 Engine

```
// JavaScript JIT optimization example
function hotFunction(arr) {
    let sum = 0;
    // V8 will optimize this loop after many iterations
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];  // Type specialization: assumes numbers
    }
    return sum;
}

// Phase 1: Interpretation (Ignition interpreter)
for (let i = 0; i < 100; i++) {
    hotFunction([1, 2, 3, 4, 5]);
}

// Phase 2: Basic compilation (TurboFan compiler)
for (let i = 0; i < 10000; i++) {
    hotFunction([1, 2, 3, 4, 5]);  // Now compiled with type assumptions
}

// Phase 3: Deoptimization if assumptions break
hotFunction([1, 2, 3.14, "string"]);  // Mixed types → deoptimize back to interpreter
```
