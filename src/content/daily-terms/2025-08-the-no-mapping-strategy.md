---
title: "The \"No Mapping\" Strategy"
termSlug: "the-no-mapping-strategy"
year: 2025
month: 8
monthName: "August"
day: 13
order: 13
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "The \"No Mapping\" Strategy in hexagonal architecture means using the same domain model objects directly across different layers (domain, application, and infrastructure) without creating separate DT..."
---
### Definition:

The "No Mapping" Strategy in hexagonal architecture means using the same domain model objects directly across different layers (domain, application, and infrastructure) without creating separate DTOs or mapping between them. This reduces complexity and boilerplate code but may couple the domain model more tightly to external systems.

### Example:

Suppose you have a User entity in your domain:

```
type User struct {
    ID    string
    Name  string
    Email string
}
```

With the "No Mapping" strategy, you’d:

- Use this User struct directly in your application service.
- Pass it directly to your database repository implementation.
- Return it directly in your API response.

So your repository might look like:

```
func (r *UserRepository) FindByID(id string) (*User, error) {
    // Directly query the DB and scan into domain struct
}
```

And your handler:

```
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    user, _ := h.repo.FindByID("123")
    json.NewEncoder(w).Encode(user) // no mapping to a DTO
}
```

If you’d like, I can also make you a short pros & cons table so you see when to use and avoid this strategy.
