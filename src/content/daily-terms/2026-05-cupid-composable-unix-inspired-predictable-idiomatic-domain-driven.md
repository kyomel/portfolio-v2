---
title: "CUPID (Composable, Unix-inspired, Predictable, Idiomatic, Domain-driven)"
termSlug: "cupid-composable-unix-inspired-predictable-idiomatic-domain-driven"
year: 2026
month: 5
monthName: "May"
day: 12
order: 8
source: "2026/may-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/may-term.md"
excerpt: "CUPID is a set of five software design principles—Composable, Unix-inspired, Predictable, Idiomatic, Domain-driven—created by Daniel Terhorst-North as a practical alternative to traditional OOP gui..."
---
### Definition:

CUPID is a set of five software design principles—Composable, Unix-inspired, Predictable, Idiomatic, Domain-driven—created by Daniel Terhorst-North as a practical alternative to traditional OOP guidelines like SOLID. It describes code that behaves like a set of high-quality building blocks: small, honest, easy to read, and easy to wire together in combinations the original author never imagined.

The Five Principles at a Glance
Principle	What It Means
Composable	Pieces have clean inputs and outputs, no hidden state, and snap together like LEGO bricks.
Unix-inspired	Each component does one thing well; they collaborate through simple, standard interfaces rather than deep custom APIs.
Predictable	The same input always yields the same output. Side effects are explicit, not surprises.
Idiomatic	Code looks like it belongs to its language and ecosystem (e.g., Python looks like Python, not Java in disguise).
Domain-driven	Names and structures reflect the real business (e.g., Invoice, Payroll), not technical jargon (e.g., ManagerHelper, processData).

### Example:

The Monthly Sales Report
Imagine you need to fetch last month’s sales, calculate revenue, generate a PDF, and email it to the CFO.

```
The CUPID Way (The Assembly Line)
Each station handles one task and passes a clear artifact to the next:

// 1. Domain object + query
List<Sale> sales = new SalesQuery(database).forMonth("2024-05");

// 2. Pure calculation (Predictable, Domain-driven)
RevenueSummary summary = new RevenueCalculator().compute(sales);

// 3. One tool for formatting (Unix-inspired: does one thing)
FormattedReport report = new PdfFormatter().render(summary);

// 4. Two separate, composable output tools
new FileStore().save(report, "/tmp/report.pdf");
new EmailDispatcher().send("cfo@company.com", report);
Why this works:

Composable: Tomorrow you can swap PdfFormatter for CsvFormatter without touching RevenueCalculator.
Unix-inspired: Each stage is a small, sharp tool; they “pipe” domain objects to one another.
Predictable: RevenueCalculator.compute() is a pure function—same sales in, same total out, zero surprises.
Idiomatic: It uses the language’s collections and standard types naturally.
Domain-driven: The code reads like the business process: query sales → calculate revenue → format report → deliver.
Bottom line: CUPID code is not just maintainable—it is recombinant. You can grab the middle pieces and drop them into a dashboard API, a mobile view, or a unit test without rewriting the world.
```
