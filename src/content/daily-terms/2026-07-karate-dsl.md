---
title: "Karate DSL"
termSlug: "karate-dsl"
year: 2026
month: 7
monthName: "July"
day: 24
order: 17
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "Karate DSL is an open-source test automation framework that combines API testing, UI testing, and performance testing into a single, readable, programming-language-free domain-specific language. In..."
---
### Definition:

Karate DSL is an open-source test automation framework that combines API testing, UI testing, and performance testing into a single, readable, programming-language-free domain-specific language. Instead of writing test code in Python, Java, or JavaScript, you write tests in Gherkin-style plain text (Given/When/Then syntax) that describes exactly what the test should do — and Karate runs it without you writing a single line of programming code.

The revolutionary idea behind Karate: API tests should NOT require programming knowledge. Product owners, QA analysts, and developers should all be able to read, write, and review the same test files.

═══════════════════════════════════════════════════════════════
  WHAT KARATE DSL REPLACES
═══════════════════════════════════════════════════════════════

  Traditional API Test (Python + Requests library):
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  import requests                                        │
  │  import json                                            │
  │                                                         │
  │  def test_create_user():                                │
  │      payload = {                                        │
  │          "name": "Alice",                               │
  │          "email": "alice@test.com",                     │
  │          "role": "admin"                                │
  │      }                                                  │
  │      response = requests.post(                          │
  │          "https://api.example.com/users",               │
  │          json=payload,                                  │
  │          headers={"Authorization": "Bearer xxx"}        │
  │      )                                                  │
  │      assert response.status_code == 201                 │
  │      data = response.json()                             │
  │      assert data["name"] == "Alice"                     │
  │      assert data["role"] == "admin"                     │
  │      assert data["id"] is not None                      │
  │                                                         │
  │  → Requires: Python knowledge, HTTP knowledge,          │
  │               JSON parsing, assertion syntax            │
  │  → Only readable by: developers                         │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  Same Test in Karate DSL:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
    │  Feature: User Management                               │
    │                                                         │
    │  Scenario: Create a new admin user                      │
    │    Given url 'https://api.example.com'                  │
    │    And path '/users'                                    │
    │    And header Authorization = 'Bearer xxx'              │
    │    And request { name: 'Alice', email: 'alice@test.com',│
    │      role: 'admin' }                                    │
    │    When method post                                     │
    │    Then status 201                                      │
    │    And match $.name == 'Alice'                          │
    │    And match $.role == 'admin'                          │
    │    And match $.id != '#null'                            │
    │                                                         │
    │  → Requires: No programming knowledge                   │
    │  → Readable by: Devs, QAs, PMs, product owners         │
    │  → Each line is self-explanatory English                │
    │                                                         │
    └─────────────────────────────────────────────────────────┘

### Example:

A visual walkthrough of a complete test scenario in Karate DSL — showing an API test, a data-driven test, and a mock server — all without writing any programming code.

```
SCENARIO: An e-commerce API. You need to test:
1. Creating a product (POST)
2. Looking up a product by ID (GET)
3. Testing with MULTIPLE product types (data-driven)
4. Mocking the payment service for isolated testing
═══════════════════════════════════════════════════════════════
  TEST 1: API CRUD — Create and Verify a Product
═══════════════════════════════════════════════════════════════

  Karate DSL test file (products.feature):

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Feature: Product API                                   │
  │                                                         │
  │  Background:                                            │
  │    * url 'https://api.shop.example.com'                 │
  │    * header Authorization = 'Bearer test-token-123'     │
  │                                                         │
  │  Scenario: Create a new product and verify it exists    │
  │                                                         │
  │    # Step 1: Create the product                         │
  │    Given path '/products'                                │
  │    And request {                                        │
  │      'name': 'Wireless Keyboard',                       │
  │      'price': 49.99,                                    │
  │      'category': 'electronics',                         │
  │      'inStock': true                                    │
  │    }                                                    │
  │    When method post                                     │
  │    Then status 201                                      │
  │                                                         │
  │    # Save the returned ID for later use                 │
  │    And def productId = $.id                             │
  │                                                         │
  │    # Step 2: Look up the product by ID                  │
    │    Given path '/products', productId                    │
    │    When method get                                      │
    │    Then status 200                                      │
    │                                                         │
    │    # Verify the response                                │
    │    And match $.name == 'Wireless Keyboard'              │
    │    And match $.price == 49.99                           │
    │    And match $.inStock == true                          │
    │    And match $.category == 'electronics'                │
    │    And match $ contains { createdBy: '#notnull' }      │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
  
  
  ═══════════════════════════════════════════════════════════════
    TEST 2: DATA-DRIVEN — Same Test, Multiple Product Types
  ═══════════════════════════════════════════════════════════════
  
    Instead of writing 8 separate test scenarios, use a
    Scenario Outline with Examples:
  
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │  Scenario Outline: Create products of different types   │
    │                                                         │
    │    Given path '/products'                                │
    │    And request {                                       │
    │      'name': '<name>',                                  │
    │      'price': <price>,                                  │
    │      'category': '<category>'                           │
    │    }                                                    │
    │    When method post                                     │
    │    Then status 201                                      │
    │    And match $.category == '<category>'                 │
    │    And match $.price == <price>                         │
    │    And match $.id != '#null'                            │
      │                                                         │
      │    Examples:                                            │
      │      | name             | price | category      |       │
      │      | Wireless Keyboard| 49.99 | electronics   |       │
      │      | Running Shoes    | 89.99 | sports        |       │
      │      | Programming Book | 39.99 | books         |       │
      │      | Desk Lamp        | 24.99 | home          |       │
      │      | Coffee Maker     | 59.99 | kitchen       |       │
      │      | Yoga Mat         | 19.99 | sports        |       │
      │      | Water Bottle     | 14.99 | sports        |       │
      │      | USB-C Cable      | 9.99  | electronics   |       │
      │                                                         │
      │  → One Scenario Outline runs 8 tests with different     │
      │    data. Add more rows to test more cases.              │
      │  → JSON/CSV files can also be used as data sources.    │
      │                                                         │
      └─────────────────────────────────────────────────────────┘
    
    
    ═══════════════════════════════════════════════════════════════
      TEST 3: MOCKING — Simulate Payment Service Without Real $
    ═══════════════════════════════════════════════════════════════
    
      Karate has a built-in mock server. No need for WireMock
      or separate mock services.
    
      ┌─────────────────────────────────────────────────────────┐
      │                                                         │
      │  Mock file (payment-mock.feature):                      │
      │                                                         │
      │  Feature: Payment Service Mock                          │
      │                                                         │
      │  Scenario: Simulate successful payment                  │
      │    Given pathMatches('/payments/charge')                │
      │    And method 'post'                                    │
      │    And request.amount < 1000                           │
        │    Then status 200                                      │
        │    And response {                                      │
        │      'status': 'approved',                              │
        │      'transactionId': '#uuid'                           │
        │    }                                                    │
        │                                                         │
        │  Scenario: Simulate declined payment                    │
        │    Given pathMatches('/payments/charge')                │
        │    And method 'post'                                    │
        │    And request.amount >= 1000                          │
        │    Then status 402                                      │
        │    And response {                                      │
        │      'status': 'declined',                              │
        │      'reason': 'amount_exceeds_limit'                  │
        │    }                                                    │
        │                                                         │
        │  Start the mock server:                                 │
        │  java -jar karate.jar -m payment-mock.feature -p 8089   │
        │                                                         │
        │  → Now your real app can point to localhost:8089         │
        │    and get realistic payment responses — FOR FREE.      │
        │  → No credit cards charged. No payment gateway needed.  │
        │  → Test both approved AND declined paths easily.        │
        │                                                         │
        └─────────────────────────────────────────────────────────┘
      
      
      ═══════════════════════════════════════════════════════════════
        THE FULL TEST PIPELINE (How Karate DSL runs)
      ═══════════════════════════════════════════════════════════════
      
        ┌─────────────────────────────────────────────────────────┐
        │                                                         │
        │  WRITE:  Plain text .feature files                      │
        │          (Given/When/Then syntax — no code)             │
          │                                                         │
          │          ↓                                               │
          │                                                         │
          │  PARSE:  Karate engine reads .feature files             │
          │          → Builds an internal test plan                 │
          │          → Handles HTTP, auth, JSON automatically       │
          │                                                         │
          │          ↓                                               │
          │                                                         │
          │  EXECUTE:                                                │
          │    ┌──────────────────────────────────────────────┐    │
          │    │  API Tests → Sends HTTP requests             │    │
          │    │               Validates JSON/XML responses   │    │
          │    │                                               │    │
          │    │  UI Tests  → Drives browser via WebDriver    │    │
          │    │               (if using Karate UI module)    │    │
          │    │                                               │    │
          │    │  Perf Tests → Converts to Gatling simulation │    │
          │    │               (if using Karate Gatling)      │    │
          │    │                                               │    │
          │    │  Mocks      → Starts embedded HTTP mock      │    │
          │    │               server                          │    │
          │    └──────────────────────────────────────────────┘    │
          │                                                         │
          │          ↓                                               │
          │                                                         │
          │  REPORT:  HTML reports with request/response logs       │
          │          Timelines, assertions, coverage analytics      │
          │          CI integration (JUnit XML, Cucumber reports)  │
          │                                                         │
          └─────────────────────────────────────────────────────────┘
```
