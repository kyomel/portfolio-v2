---
title: "Database Normalization"
termSlug: "database-normalization"
year: 2025
month: 7
monthName: "July"
day: 3
order: 3
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Database Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity by dividing large tables into smaller, related tables and defining relationshi..."
---
### Definition:

Database Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity by dividing large tables into smaller, related tables and defining relationships between them.
**Normalization Forms:**
1NF: Each column contains atomic values, no repeating groups
2NF: 1NF + All non-key attributes fully depend on primary key
3NF: 2NF + No transitive dependencies
BCNF: 3NF + Every determinant is a candidate key

### Example:

**Student Database Normalization**

Before Normalization:

```
Students Table:
+----+----------+-------------+------------------+----------------+
| ID | Name     | Courses     | Instructors      | Departments    |
+----+----------+-------------+------------------+----------------+
| 1  | John     | Math, CS    | Smith, Johnson   | Math, CS       |
| 2  | Sarah    | Physics     | Brown            | Physics        |
+----+----------+-------------+------------------+----------------+
```

After 1NF(First Normal Form):

```
Students Table:
+----+----------+
| ID | Name     |
+----+----------+
| 1  | John     |
| 2  | Sarah    |
+----+----------+

Student_Courses Table:
+----+---------+------------+------------+
| ID | Course  | Instructor | Department |
+----+---------+------------+------------+
| 1  | Math    | Smith      | Math       |
| 1  | CS      | Johnson    | CS         |
| 2  | Physics | Brown      | Physics    |
+----+---------+------------+------------+
```

After 2NF & 3NF:

```
Students Table:
+----+----------+
| ID | Name     |
+----+----------+
| 1  | John     |
| 2  | Sarah    |
+----+----------+

Courses Table:
+-----------+-------------+----------------+
| Course_ID | Course_Name | Department_ID  |
+-----------+-------------+----------------+
| 101       | Math        | 1              |
| 102       | CS          | 2              |
| 103       | Physics     | 3              |
+-----------+-------------+----------------+

Departments Table:
+---------------+-----------------+
| Department_ID | Department_Name |
+---------------+-----------------+
| 1             | Mathematics     |
| 2             | Computer Science|
| 3             | Physics         |
+---------------+-----------------+

Instructors Table:
+---------------+----------+---------------+
| Instructor_ID | Name     | Department_ID |
+---------------+----------+---------------+
| 1             | Smith    | 1             |
| 2             | Johnson  | 2             |
| 3             | Brown    | 3             |
+---------------+----------+---------------+

Enrollments Table:
+------------+-----------+---------------+
| Student_ID | Course_ID | Instructor_ID |
+------------+-----------+---------------+
| 1          | 101       | 1             |
| 1          | 102       | 2             |
| 2          | 103       | 3             |
+------------+-----------+---------------+
```

reference: [Link-1](https://www.geeksforgeeks.org/dbms/introduction-of-database-normalization/)
[Link-2](https://www.datacamp.com/tutorial/normalization-in-sql)
