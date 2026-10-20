---
title: "Dependency Injection (DI)"
termSlug: "dependency-injection-di"
year: 2026
month: 10
monthName: "October"
day: 19
order: 13
source: "2026/oct-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/oct-term.md"
excerpt: "Dependency injection means one rule: an object receives the objects it needs from outside. It does not build them itself. The caller decides which concrete version to pass. The receiver only knows..."
---
### Definition:

**Dependency injection** means one rule: an object receives the objects it needs from outside. It does not build them itself. The caller decides which concrete version to pass. The receiver only knows the interface.

The name covers three mechanics. **Constructor injection** passes dependencies as arguments to the constructor. **Setter injection** assigns them after construction. **Parameter injection** passes them per call, which is what FastAPI `Depends` and plain Python default arguments do. Constructor injection is the default choice, because an object built that way can never exist in a half-wired state.

DI is one form of a larger idea, **inversion of control**. Control over creation moves out of the object and into the code that assembles the program. That code has a name: the **composition root**. In most services the composition root is `main()`. It is the only place that names a concrete type, reads a connection string, or calls `sql.Open`.

The point is not testability, although testability is the usual sales pitch. The point is **one place owns the wiring**. To see why that matters, compare the two shapes.

```text
WITHOUT DI — each object builds what it needs
═══════════════════════════════════════════════════════════════════════════

  main()
    └─ NewOrderService()
         │  inside the constructor body:
         │      db, _  := sql.Open("postgres", "host=10.0.0.7 user=app pw=...")
         │      mail   := NewSMTPMailer("smtp.internal", 587, "user", "pass")
         ▼
   ┌────────────────────────────┐      ┌────────────────────────────┐
   │ OrderService               │      │ OrderService               │
   │ knows the DB host          │      │ opens its own SMTP socket  │
   │ knows the DB password      │      │ knows the SMTP port        │
   │ opens its own pool         │      │ formats its own mail body  │
   └─────────────┬──────────────┘      └─────────────┬──────────────┘
                 ▼                                   ▼
          ┌──────────────┐                    ┌──────────────┐
          │  PostgreSQL  │                    │ SMTP server  │
          └──────────────┘                    └──────────────┘

  cost of one test: a live database, a live SMTP server, and a secret in a
  unit test.  two OrderService instances cannot share a pool.  a swap to a
  different mail vendor edits business logic.

WITH DI — one place builds the graph, every object asks for an interface
═══════════════════════════════════════════════════════════════════════════

  main()   ← the composition root.  the only code that names concretes.

     cfg ──► newDB(cfg) ───────────────┐
                                       ▼
     cfg ──► newMailer(cfg) ──► newOrderService(store, mailer) ──► Handler
                                       ▲
                                       │  OrderService holds two fields:
                                       │      Store   Save(ctx, Order) error
                                       │      Mailer  Send(ctx, to, body) error

   ┌─────────────────────────────────────────────────────────────────────┐
   │ OrderService                                                        │
   │   knows nothing about Postgres.  knows nothing about SMTP.          │
   │   calls the interface.  trusts the caller.                          │
   └─────────────────────────────────────────────────────────────────────┘

  cost of one test: one line.
     svc := NewOrderService(fakeStore{}, fakeMailer{})
  no socket.  no secret.  no container.  the test runs in microseconds.
```

The trade is explicit. DI moves knowledge from many files into one file. That file gets long. The alternative is that the knowledge spreads across every file, and no file shows the full graph.

There is a wrong way to get the same benefit: the **service locator**. The object pulls what it needs from a global registry.

```text
SERVICE LOCATOR — the object reaches into a global registry
═══════════════════════════════════════════════════════════════════════════

   func (s *OrderService) Place(ctx context.Context, o Order) error {
       mail := locator.Get("mailer").(Mailer)   // <- the need is invisible
       ...
   }

┌─────────────────────────────┬──────────────────────────┬─────────────────┐
│ SIGNATURE IS HONEST         │ FAILURE MODE             │ TEST SETUP      │
├─────────────────────────────┼──────────────────────────┼─────────────────┤
│ no. no argument in          │ panic on the first       │ global setup    │
│ the constructor, but        │ call, when the key       │ before every    │
│ the method needs one        │ or the type is wrong     │ test run        │
└─────────────────────────────┴──────────────────────────┴─────────────────┘
```

DI and DI **containers** are also not the same thing. A container is a library that builds the graph for you from registrations. DI is the discipline of passing dependencies in. Manual wiring in `main()` gives you the discipline with no library, and many Go services stop there.

Containers add a second problem, **lifetimes**. A registration says how long an object lives: transient (new each resolve), scoped (one per request), singleton (one per process). The rules look small. They produce one of the most expensive bug classes in application code, the **captive dependency**. A long-lived object captures a short-lived one.

```text
CAPTIVE DEPENDENCY — a singleton captures a scoped object
═══════════════════════════════════════════════════════════════════════════

  registrations
    AuditLog       SINGLETON   built once, at process start
    RequestScope   SCOPED      built once per request
                       ▲
    AuditLog ──────────┘  asks for RequestScope in its own constructor

  ─────────────────────────────────────────────────────────────────────────
  request 1   user = kim
      RequestScope{user: kim}  ──►  AuditLog keeps this pointer for good

  request 2   user = dewi
      RequestScope{user: dewi} ──►  AuditLog still points at kim's object

  ─────────────────────────────────────────────────────────────────────────
  every audit row after the first request is written as user = kim.

  no exception.  no failed health check.  no latency change.
  just wrong data, in the table you keep for compliance.
```

Two defenses exist. Validate the graph at startup, so the container refuses to boot with a captive dependency (ASP.NET Core scope validation, Dagger's scope checks). Or make the graph plain code, so a lifetime is just an argument and the compiler sees it. Go's `google/wire` took the second route: it generated constructors at build time, so a missing dependency failed the build, not a request. Wire was archived in August 2025, so new Go projects should read that maintenance status first. The community fork `wireinject/wire` continues the tool. Manual constructors plus a `main()` remain the default for most Go teams.

### Example:

**A checkout service moves mail delivery behind an interface. Then a test runs without a network.**

The starting code below is the "without DI" shape. `PlaceOrder` cannot be called in a test, because the constructor opens a socket.

```go
// before: the constructor owns the world
type OrderService struct {
	db   *sql.DB
	mail *SMTPMailer
}

func NewOrderService() *OrderService {
	db, _ := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	return &OrderService{db: db, mail: NewSMTPMailer()}
}
```

The change is small and mechanical. The service asks for two interfaces. `main()` supplies the real ones. The test supplies fakes.

```diff
  type OrderService struct {
- 	db   *sql.DB
- 	mail *SMTPMailer
+ 	store  Store
+ 	mailer Mailer
  }

- func NewOrderService() *OrderService {
- 	db, _ := sql.Open("postgres", os.Getenv("DATABASE_URL"))
- 	return &OrderService{db: db, mail: NewSMTPMailer()}
- }
+ func NewOrderService(store Store, mailer Mailer) *OrderService {
+ 	return &OrderService{store: store, mailer: mailer}
+ }
```

The interfaces live next to the code that consumes them, not next to the code that implements them. That rule keeps the interface small. A Postgres type should not dictate what the service may call.

```go
// consumer side: two methods, because the service calls two methods
type Store interface {
	Save(ctx context.Context, o Order) error
}

type Mailer interface {
	Send(ctx context.Context, to, body string) error
}
```

The composition root is now the only file that knows a vendor name.

```text
BEFORE AND AFTER, ONE PLACE CHANGES
═══════════════════════════════════════════════════════════════════════════

  PRODUCTION  main.go
  ─────────────────────────────────────────────────────────────────────────
    db     := newDB(cfg)                 ─┐
    mailer := newSMTPMailer(cfg)         ─┼─► NewOrderService(db, mailer)
    svc    := ...                        ┘
    handler := NewHTTPHandler(svc)

  TEST  order_test.go
  ─────────────────────────────────────────────────────────────────────────
    store  := &fakeStore{}               ─┐
    mailer := &fakeMailer{}              ─┼─► NewOrderService(store, mailer)
    svc    := ...                        ┘
    err := svc.PlaceOrder(ctx, Order{ID: "A-17"})

    assert store.saved == 1
    assert mailer.sent  == 1        <- the assertion is now possible at all
    elapsed: 0.4 ms.  no socket opened.

  BUG REPORT ARRIVES: "receipts go out twice on retry"
  ─────────────────────────────────────────────────────────────────────────
    with DI, the retry path is one test:
      fakeStore.setFailOnce()
      svc.PlaceOrder(...)  twice
      assert mailer.sent == 1     <- fails.  the bug is real, and it is local.
```

The same change enables a second thing that is hard to fake otherwise: a **decorator**. Wrap the mailer to log, to retry, or to count, and the service does not change.

```go
type countingMailer struct{ inner Mailer; n *int }

func (c countingMailer) Send(ctx context.Context, to, body string) error {
	*c.n++
	return c.inner.Send(ctx, to, body)
}
```

The honest limits of the pattern matter more than its benefits.

- **DI is not a container, and a container is not a requirement.** If `main()` builds five objects and passes them down, that is full DI. Adding a container to a ten-file service adds a dependency and removes no work.
- **A container trades compile-time safety for runtime flexibility.** Registrations are strings and types resolved at boot. A missing registration is a startup crash, or worse, a `nil` that fails on the first request. Generated wiring and manual wiring keep the check inside the compiler.
- **One interface per concrete type is over-abstraction.** Add an interface when a second implementation exists, or when a test needs a seam. Not before. Every interface is a file a reader must open to learn what the code does.
- **DI does not remove coupling. It concentrates it.** Some file must still know Postgres exists. The gain is that exactly one file knows, and that file is boring on purpose.
- **Lifetime bugs outlive the pattern.** Captive dependencies, shared mutable singletons, and per-request objects stored in global caches all survive a correct DI setup. The composition root shows the graph. It does not prove the graph is safe under concurrency.

The punchline: dependency injection is a small idea with a large effect on where knowledge lives. The object stops asking "how do I build this" and starts asking "what do I need". The answer moves to one readable place. Judge the setup by that place. If the composition root is short enough to read in one screen, the wiring is healthy, with or without a library.
