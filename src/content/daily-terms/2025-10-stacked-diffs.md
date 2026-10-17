---
title: "Stacked Diffs"
termSlug: "stacked-diffs"
year: 2025
month: 10
monthName: "October"
day: 29
order: 19
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Stacked Diffs is a version control workflow where you create a series of small, dependent commits that build upon each other in a stack, rather than one large feature branch. Each \"diff\" (change) i..."
---
### Definition:

Stacked Diffs is a version control workflow where you create a series of small, dependent commits that build upon each other in a stack, rather than one large feature branch. Each "diff" (change) in the stack represents a logical, reviewable unit of work that depends on the previous changes. This approach enables parallel development, easier code reviews, and faster iteration on complex features.

**Key Properties:**

- Small, focused changes: Each diff tackles one specific problem
- Sequential dependencies: Later diffs build on earlier ones
- Independent review: Each diff can be reviewed separately
- Parallel development: Multiple developers can work on the same feature
- Easy rebasing: Individual diffs can be modified without affecting others

**Core Concepts:**

- Stack: A series of related commits/diffs
- Base: The commit each diff builds upon
- Dependencies: How diffs relate to each other
- Landing: Merging diffs in order to main branch

### Example:

Adding a user authentication system to an app

```
# Stack of 5 small, focused diffs
D1: Add User model and database schema
D2: Add authentication middleware
D3: Add login/logout API endpoints
D4: Add user registration UI
D5: Add integration tests

# Each diff is small, focused, and reviewable
```
