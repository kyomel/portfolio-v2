---
title: "Object-Oriented Analysis and Design (OOAD)"
termSlug: "object-oriented-analysis-and-design-ooad"
year: 2025
month: 8
monthName: "August"
day: 20
order: 19
source: "2025/august-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/august-term.md"
excerpt: "Object-Oriented Analysis and Design (OOAD) is a software development approach that models real-world problems using objects (things) and their interactions. It breaks down complex systems into mana..."
---
## Definition:

Object-Oriented Analysis and Design (OOAD) is a software development approach that models real-world problems using objects (things) and their interactions. It breaks down complex systems into manageable, reusable components that mirror how we naturally think about the world.

Analysis = Understanding the problem and requirements
Design = Creating a solution using objects and their relationships

Core Principles

- Encapsulation: Bundle data and methods together
- Inheritance: Create new classes based on existing ones
- Polymorphism: Same interface, different behaviors
- Abstraction: Hide complex details, show only essentials

## Example:

Let's design a Library Management System

**Analysis (What do we need?)**

- Track books, members, and borrowing
- Members can borrow and return books
- System tracks due dates and fines

**Design (How do we solve it?)**

- Use classes for Book, Member, and Borrowing
- Implement methods for borrowing and returning
- Use inheritance for shared behavior
- Use encapsulation to hide implementation details

```
class Book:
    def __init__(self, title, author, isbn):
        self.title = title
        self.author = author
        self.isbn = isbn
        self.is_available = True

    def borrow(self):
        self.is_available = False

    def return_book(self):
        self.is_available = True

class Member:
    def __init__(self, name, member_id):
        self.name = name
        self.member_id = member_id
        self.borrowed_books = []

    def borrow_book(self, book):
        if book.is_available:
            book.borrow()
            self.borrowed_books.append(book)

class Library:
    def __init__(self):
        self.books = []
        self.members = []

    def add_book(self, book):
        self.books.append(book)
```
