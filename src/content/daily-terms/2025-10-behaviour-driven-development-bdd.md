---
title: "Behaviour Driven Development(BDD)"
termSlug: "behaviour-driven-development-bdd"
year: 2025
month: 10
monthName: "October"
day: 8
order: 5
source: "2025/october-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/october-term.md"
excerpt: "Behavior Driven Development (BDD) is a software development methodology that focuses on defining and testing software behavior through collaboration between developers, testers, and business stakeh..."
---
### Definition:

Behavior Driven Development (BDD) is a software development methodology that focuses on defining and testing software behavior through collaboration between developers, testers, and business stakeholders. It uses natural language specifications to describe how the software should behave from the user's perspective, creating a shared understanding of requirements.

**Key Properties:**

- Natural language: Uses plain English to describe behavior
- Collaboration focused: Bridges gap between technical and non-technical teams
- Outside-in approach: Starts with user behavior, works inward to implementation
- Living documentation: Specifications serve as both requirements and tests
- Gherkin syntax: Common format using Given-When-Then structure

**Core Concepts:**

- Given: Initial context/preconditions
- When: Action or event that triggers behavior
- Then: Expected outcome or result
- And/But: Additional conditions or outcomes

### Example:

User login to e-commerce website

```
Feature: User Login
  As a customer
  I want to log into my account
  So that I can access my personal dashboard and order history

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter valid email "john@example.com"
    And I enter valid password "mypassword123"
    And I click the "Login" button
    Then I should be redirected to my dashboard
    And I should see "Welcome back, John!"

  Scenario: Login with invalid credentials
    Given I am on the login page
    When I enter email "john@example.com"
    And I enter incorrect password "wrongpassword"
    And I click the "Login" button
    Then I should remain on the login page
    And I should see error message "Invalid email or password"

  Scenario: Account lockout after multiple failed attempts
    Given I am on the login page
    And I have already failed to login 2 times
    When I enter email "john@example.com"
    And I enter incorrect password "wrongpassword"
    And I click the "Login" button
    Then I should see "Account temporarily locked. Try again in 15 minutes"
    And the login form should be disabled
```

BDD Process Flow:

```
1. Discovery Workshop
   ↓
2. Write Feature Files (Gherkin)
   ↓
3. Implement Step Definitions
   ↓
4. Run Tests (Red)
   ↓
5. Implement Feature (Green)
   ↓
6. Refactor (Clean)
   ↓
7. Repeat
```
