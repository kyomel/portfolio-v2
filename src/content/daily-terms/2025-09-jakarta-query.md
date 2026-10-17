---
title: "Jakarta Query"
termSlug: "jakarta-query"
year: 2025
month: 9
monthName: "September"
day: 12
order: 10
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "Jakarta Query (formerly JPA Criteria API) is a Java specification that allows developers to build database queries programmatically using Java code instead of writing SQL strings. It provides a typ..."
---
### Definition:

Jakarta Query (formerly JPA Criteria API) is a Java specification that allows developers to build database queries programmatically using Java code instead of writing SQL strings. It provides a type-safe, object-oriented way to construct dynamic queries at runtime.

**Key Features**

- Type-safe: Compile-time checking prevents SQL errors
- Dynamic: Build queries conditionally based on user input
- Database-agnostic: Works across different database systems
- IDE-friendly: Auto-completion and refactoring support

### Example:

Traditional SQL String:

```
String sql = "SELECT p FROM Person p WHERE p.age > 25 AND p.city = 'New York'";
```

Jakarta Query (Criteria API):

```
CriteriaBuilder cb = entityManager.getCriteriaBuilder();
CriteriaQuery<Person> query = cb.createQuery(Person.class);
Root<Person> person = query.from(Person.class);

query.select(person)
     .where(cb.and(
         cb.greaterThan(person.get("age"), 25),
         cb.equal(person.get("city"), "New York")
     ));

List<Person> results = entityManager.createQuery(query).getResultList();
```
