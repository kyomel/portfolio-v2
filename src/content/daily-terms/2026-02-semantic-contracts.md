---
title: "Semantic Contracts"
termSlug: "semantic-contracts"
year: 2026
month: 2
monthName: "February"
day: 9
order: 6
source: "2026/feb-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/feb-term.md"
excerpt: "Semantic Contracts are implicit, unwritten agreements about the meaning and behavior of an API or interface that go beyond the formal technical contract (data types, function signatures). While a t..."
---
### Definition:

Semantic Contracts are implicit, unwritten agreements about the meaning and behavior of an API or interface that go beyond the formal technical contract (data types, function signatures). While a technical contract says "this function accepts an integer and returns an integer," the semantic contract defines "this function returns the sum of two numbers" and includes assumptions about performance, side effects, error handling, and business logic that clients rely on.

**Key Concept:**

- Technical Contract: What the code can do (types, signatures, schemas)
- Semantic Contract: What the code should do (meaning, behavior, guarantees)
- Problem: Breaking semantic contracts breaks client expectations, even if technical contract is unchanged
- Example: Changing sum(1, 2) to return 4 instead of 3 breaks the semantic contract (but not the technical contract)

### Example:

E-commerce API

```
The Technical Contract (API Spec)

# openapi.yaml

/api/products/search:
  get:
    summary: Search for products
    parameters:
      - name: query
        in: query
        required: true
        schema:
          type: string
      - name: limit
        in: query
        required: false
        schema:
          type: integer
          default: 10
    responses:
      200:
        description: List of products
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Product'

components:
  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        price:
          type: number
        inStock:
          type: boolean
This is what's documented:

Endpoint: GET /api/products/search?query=laptop&limit=10
Input: string query, integer limit
Output: array of Product objects

That's it! No other guarantees!
The Semantic Contract (Implicit Expectations)

/**
 * SEMANTIC CONTRACT (What Clients Expect):
 *
 * 1. RELEVANCE:
 *    - Results are relevant to search query
 *    - Most relevant results come first
 *    - "laptop" query returns laptops, not phones
 *
 * 2. PERFORMANCE:
 *    - Response time < 200ms (p95)
 *    - Response time < 500ms (p99)
 *    - No timeouts
 *
 * 3. CONSISTENCY:
 *    - Same query returns similar results
 *    - Results don't wildly fluctuate
 *    - Pagination works correctly
 *
 * 4. COMPLETENESS:
 *    - Returns all matching products (within limit)
 *    - Doesn't randomly skip products
 *    - Respects limit parameter
 *
 * 5. DATA ACCURACY:
 *    - Prices are current
 *    - Stock status is accurate
 *    - Product info is correct
 *
 * 6. BUSINESS LOGIC:
 *    - Out-of-stock items appear last
 *    - Premium items ranked higher
 *    - Sponsored items clearly marked
 */
```
