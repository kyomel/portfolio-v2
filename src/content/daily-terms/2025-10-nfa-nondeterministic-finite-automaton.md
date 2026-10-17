---
title: "NFA(Nondeterministic Finite Automaton)"
termSlug: "nfa-nondeterministic-finite-automaton"
year: 2025
month: 10
monthName: "October"
day: 7
order: 4
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "A Nondeterministic Finite Automaton (NFA) is a computational model that can be in multiple states simultaneously and can make transitions without consuming input (epsilon transitions). Unlike a DFA..."
---
### Definition:

A Nondeterministic Finite Automaton (NFA) is a computational model that can be in multiple states simultaneously and can make transitions without consuming input (epsilon transitions). Unlike a DFA, an NFA can have multiple possible transitions from a state on the same input symbol, making it "nondeterministic."

**Key Properties:**

- Multiple transitions: Can have several paths from one state on same input
- Epsilon transitions: Can move between states without reading input (ε-transitions)
- Multiple current states: Can be in several states at once
- Accepts if any path accepts: Input accepted if at least one execution path reaches an accept state
- More expressive: Easier to design than DFAs for complex patterns

**Formal Definition:**
An NFA is a 5-tuple: (Q, Σ, δ, q₀, F) where:

Q: Finite set of states
Σ: Input alphabet
δ: Transition function Q × (Σ ∪ {ε}) → P(Q) (returns set of states)
q₀: Initial state
F: Set of accept states

### Example:

Email Validation

```
# NFA for simplified email: [a-z]+@[a-z]+\.com
email_nfa = NFA(
    states={'start', 'username', 'at', 'domain', 'dot', 'com', 'accept'},
    alphabet=set('abcdefghijklmnopqrstuvwxyz@.'),
    transitions={
        # Username part (letters before @)
        ('start', letter): {'username'} for letter in 'abcdefghijklmnopqrstuvwxyz'
    } | {
        ('username', letter): {'username'} for letter in 'abcdefghijklmnopqrstuvwxyz'
    } | {
        # @ symbol
        ('username', '@'): {'at'},

        # Domain part (letters after @)
        ('at', letter): {'domain'} for letter in 'abcdefghijklmnopqrstuvwxyz'
    } | {
        ('domain', letter): {'domain'} for letter in 'abcdefghijklmnopqrstuvwxyz'
    } | {
        # .com ending
        ('domain', '.'): {'dot'},
        ('dot', 'c'): {'c'},
        ('c', 'o'): {'o'},
        ('o', 'm'): {'accept'}
    },
    start_state='start',
    accept_states={'accept'}
)
```
