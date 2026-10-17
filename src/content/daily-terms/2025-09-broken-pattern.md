---
title: "Broken Pattern"
termSlug: "broken-pattern"
year: 2025
month: 9
monthName: "September"
day: 8
order: 6
source: "2025/sept-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/sept-term.md"
excerpt: "The broker pattern, also known as the intermediary pattern, inserts a middleman called a broker between service users (also known as clients) and service providers (servers). The client is fully di..."
---
### Definition:

The broker pattern, also known as the intermediary pattern, inserts a middleman called a broker between service users (also known as clients) and service providers (servers). The client is fully disconnected from the servers and has no knowledge of them. When a client requires a service, it asks a broker over a service interface, and the broker forwards the request to the appropriate server, which handles the request. The server returns the outcome of its action to the broker that forwards the result (together with any exceptions) to the client that initiated the request.

### Example:

- Broken Singleton Pattern

```
// BROKEN: Not thread-safe, can create multiple instances
public class DatabaseConnection {
    private static DatabaseConnection instance;
    private Connection connection;

    private DatabaseConnection() {
        // Expensive database connection setup
        this.connection = DriverManager.getConnection("jdbc:mysql://localhost/db");
    }

    // PROBLEM: Two threads can both see instance as null
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            instance = new DatabaseConnection();  // Race condition!
        }
        return instance;
    }

    public void executeQuery(String sql) {
        // PROBLEM: Single connection shared by all threads
        Statement stmt = connection.createStatement();
        stmt.execute(sql);  // Concurrent access issues!
    }
}

// Usage that breaks:
// Thread 1: DatabaseConnection.getInstance()
// Thread 2: DatabaseConnection.getInstance() (simultaneously)
// Result: Two instances created, defeating Singleton purpose
```
