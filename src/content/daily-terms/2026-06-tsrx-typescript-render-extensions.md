---
title: "TSRX (TypeScript Render Extensions)"
termSlug: "tsrx-typescript-render-extensions"
year: 2026
month: 6
monthName: "June"
day: 19
order: 15
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "TypeScript language extension by Dominic Gannaway (ex-React/Svelte core, creator of Inferno, Lexical, Ripple) \"Spiritual successor to JSX\" — statement-based instead of expression-based"
---
### Definition:

- TypeScript language extension by Dominic Gannaway (ex-React/Svelte core, 
  creator of Inferno, Lexical, Ripple)
- "Spiritual successor to JSX" — statement-based instead of expression-based
- Framework-agnostic: compiles to React, Preact, Solid, Vue, Ripple
- Key features: @if/@else, @for, scoped <style>, conditional hooks, prop shorthands
- Not a runtime — pure compile-time: .tsrx → AST → framework-specific .tsx
- Status: Beta, MIT license
- Analogi: Universal Translator — write once, output idiomatic code for any framework 🌐

### Example:

```
UserProfile.tsrx component showcasing:
  - @if/@else for auth state (signed in vs signed out)
  - @for for rendering recent posts list
  - Scoped <style> block auto-hashed by compiler
  - Conditional hooks (useUser inside @else — compiler generates child 
    component to satisfy Rules of Hooks)
  - Side-by-side with compiled React output
```

### Key Concepts:
- Statement-based > expression-based (compilers can optimize better)
- Framework-agnostic via plugin architecture
- Conditional hooks = no more manual component splitting for hook rules
- Incremental adoption (one .tsrx at a time)

===
