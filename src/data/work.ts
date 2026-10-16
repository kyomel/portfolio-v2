/**
 * Case studies. One entry per shipped build, newest first.
 *
 * Shape: the problem, the decisions that mattered, and the measured outcome.
 * `visibility: "private"` means the artifact is not public, so the page shows
 * the work without a dead link.
 */

export type Decision = {
  title: string;
  /** What I chose. */
  choice: string;
  /** What that choice cost. */
  tradeoff: string;
};

export type Outcome = {
  metric: string;
  text: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  category: string;
  period: string;
  role: string;
  /** The one line a skimming reader gets. */
  oneLiner: string;
  problem: string[];
  decisions: Decision[];
  outcomes: Outcome[];
  stack: string[];
  links: { href: string; label: string }[];
  visibility: "public" | "private";
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "orbitum-backend",
    title: "Orbitum backend",
    category: "Backend",
    period: "Sep 2025 - Present",
    role: "Software Engineer, Orbitum",
    oneLiner: "Backend services for a Web3 product, from API design to deploy.",
    problem: [
      "A Web3 product needs backend services that hold user and product data behind a clean API, while the chain stays the source of truth for ownership.",
      "The work runs from API design through to deploy, so the service layer has to stay readable as the domain grows.",
    ],
    decisions: [
      {
        title: "NestJS for the service layer",
        choice:
          "One module per domain, with dependency injection at the seams so a service can be swapped in a test.",
        tradeoff:
          "More boilerplate than a bare Express app, and the framework shapes the structure of every module.",
      },
    ],
    outcomes: [{ metric: "live", text: "Services in production for Orbitum users." }],
    stack: ["NestJS", "TypeScript"],
    links: [],
    visibility: "private",
  },
  {
    slug: "approval-automation",
    title: "Approval automation",
    category: "Internal tool",
    period: "Feb 2021 - Apr 2024",
    role: "Software Engineer, Xapiens Teknologi Indonesia",
    oneLiner:
      "An internal Go product that removed 70% of the manual work from the approval process.",
    problem: [
      "Approvals moved through people, not a system. Every request needed a manual hand-off, so the queue grew and nobody could see where a request stood.",
      "The goal was a number: cut the manual steps, and keep the approver's decision.",
    ],
    decisions: [
      {
        title: "Go for the service",
        choice:
          "One binary to build and deploy, with concurrency that fits a queue of requests.",
        tradeoff:
          "A smaller library ecosystem than Node.js, so more of the plumbing is written by hand.",
      },
      {
        title: "Automate the hand-off, not the decision",
        choice:
          "The system moves a request to the next approver and records the state at each step.",
        tradeoff:
          "The human decision stays in the loop, so the product could not remove every manual step.",
      },
    ],
    outcomes: [
      { metric: "-70%", text: "Manual intervention in the approval process." },
    ],
    stack: ["Go", "SQL"],
    links: [],
    visibility: "private",
  },
  {
    slug: "incident-reporting",
    title: "Incident reporting",
    category: "Internal tool",
    period: "Feb 2021 - Apr 2024",
    role: "Software Engineer, Xapiens Teknologi Indonesia",
    oneLiner:
      "An incident reporting feature that cut reporting time by 60% and raised data accuracy by 40%.",
    problem: [
      "Incident reports were written after the fact, in free text, by whoever was on shift. The data arrived late and could not be compared across incidents.",
    ],
    decisions: [
      {
        title: "Structured fields over free text",
        choice:
          "The report became a form with typed fields, so incidents could be queried and compared.",
        tradeoff:
          "A longer form than a single text box, and the fields have to cover the common cases.",
      },
      {
        title: "Report at the moment of the incident",
        choice:
          "The form is short enough to fill while the incident is still open, on the device the responder already holds.",
        tradeoff:
          "The UI has to work on a phone, not only on a desk machine, which constrains the layout.",
      },
    ],
    outcomes: [
      { metric: "-60%", text: "Time to file an incident report." },
      { metric: "+40%", text: "Accuracy of the incident data." },
    ],
    stack: ["React", "Node.js", "SQL"],
    links: [],
    visibility: "private",
  },
  {
    slug: "sayembara",
    title: "Sayembara App",
    category: "Backend",
    period: "2020",
    role: "Backend developer, Glints x Binar Academy",
    oneLiner:
      "A contest management API with authentication, submissions, and an admin dashboard.",
    problem: [
      "A contest needs one place to take submissions and one place to review them. Without it, entries arrive by email and the organiser tracks them by hand.",
    ],
    decisions: [
      {
        title: "JWT for authentication",
        choice:
          "The API stays stateless, so any instance can serve any request without a shared session store.",
        tradeoff:
          "Revoking a token before it expires needs extra work, because no server holds the session.",
      },
      {
        title: "PostgreSQL for the submission store",
        choice:
          "Submissions are relational data with real constraints, so the database enforces them.",
        tradeoff:
          "Schema changes need migrations, which is slower than a schemaless store.",
      },
    ],
    outcomes: [
      { metric: "demo", text: "Walked through end to end in a recorded demo." },
    ],
    stack: ["Node.js", "Express", "PostgreSQL", "JWT"],
    links: [
      { href: "https://www.youtube.com/watch?v=xCECMFUDp70", label: "Watch the demo" },
    ],
    visibility: "public",
  },
];
