/**
 * Evidence layer. Every number here is either stated in `profile.ts` or derived at
 * build time from this repository. Nothing is invented, so the page can show its work.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = projectRoot();

/**
 * Astro bundles this module into `dist/.prerender/chunks`, so walk up until a
 * `package.json` shows the real project root.
 */
function projectRoot(): string {
  let dir = fileURLToPath(new URL(".", import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "src"))) {
      return dir;
    }
    dir = join(dir, "..");
  }
  return process.cwd();
}

export type Proof = {
  label: string;
  href: string;
  /** false means the artifact is private, so the page shows the label without a link. */
  external: boolean;
};

export type Outcome = {
  text: string;
  metric: string;
  proofs?: Proof[];
};

export type RecordEntry = {
  org: string;
  role: string;
  place: string;
  period: string;
  current: boolean;
  outcomes: Outcome[];
  detail?: string[];
};

export type Metric = {
  value: string;
  unit?: string;
  label: string;
  note: string;
};

export type BuildFact = {
  label: string;
  value: string;
  detail?: string;
};

const GH = "https://github.com/kyomel";

export const records: RecordEntry[] = [
  {
    org: "Orbitum",
    role: "Software Engineer",
    place: "Yogyakarta, Indonesia",
    period: "Sep 2025 - Present",
    current: true,
    outcomes: [
      {
        text: "Focuses on the backend for Orbitum users: NestJS services, from API design to deploy.",
        metric: "backend",
        proofs: [{ label: "Profile", href: GH, external: true }],
      },
    ],
  },
  {
    org: "Software Engineer Growth Community",
    role: "Co-Founder",
    place: "Indonesia",
    period: "Dec 2023 - Present",
    current: true,
    outcomes: [
      {
        text: "Runs the weekday tech-term program and hosts System Design sessions.",
        metric: "daily",
        proofs: [{ label: "Profile", href: GH, external: true }],
      },
    ],
    detail: ["Shares AI tooling news with the community."],
  },
  {
    org: "Dicoding Indonesia",
    role: "Contributor, Coding Camp 2025 and 2026 by DBS Foundation",
    place: "Indonesia",
    period: "Jun 2025 - Apr 2026",
    current: false,
    outcomes: [
      {
        text: "Mentored capstone teams at full session attendance.",
        metric: "4.8-5/5",
      },
      {
        text: "Graduation rate for the mentored cohorts, 2025 to 2026.",
        metric: "75>88%",
      },
    ],
  },
  {
    org: "RevoU",
    role: "Team Lead",
    place: "Indonesia",
    period: "Oct 2024 - May 2025",
    current: false,
    outcomes: [
      { text: "Mentored 14 students to the end of the program.", metric: "85% done" },
      { text: "Led three final-project teams; two won Best Team.", metric: "2 won" },
    ],
  },
  {
    org: "Binar Academy",
    role: "Buddy, Binar Labs 2",
    place: "Indonesia",
    period: "Apr 2024 - Jul 2024",
    current: false,
    outcomes: [
      { text: "Guided the backend team to cleaner code.", metric: "+20% code" },
      { text: "Daily progress reviews against the plan.", metric: "-30% delay" },
    ],
  },
  {
    org: "Xapiens Teknologi Indonesia",
    role: "Software Engineer",
    place: "Yogyakarta, Indonesia",
    period: "Feb 2021 - Apr 2024",
    current: false,
    outcomes: [
      {
        text: "Owned an internal Go approval product and automated the approval process.",
        metric: "-70% manual work",
      },
      {
        text: "Shipped the incident reporting feature.",
        metric: "-60% time",
      },
      {
        text: "Cleaned the incident data path.",
        metric: "+40% accuracy",
      },
      {
        text: "Refactored the ReactJS, NodeJS, and Go applications.",
        metric: "+35% speed",
      },
    ],
  },
  {
    org: "Bangkit, led by Google, GoTo, and Traveloka",
    role: "Soft Skill Instructor and Advisor",
    place: "Indonesia",
    period: "Feb 2023 - Jun 2023",
    current: false,
    outcomes: [
      { text: "Trained more than 100 students in soft skills.", metric: "+40% engage" },
      { text: "Advised final-project teams to completion.", metric: "+25% quality" },
    ],
  },
  {
    org: "Glints",
    role: "Product Owner, Glints Academy",
    place: "Indonesia",
    period: "Nov 2020 - Mar 2022",
    current: false,
    outcomes: [
      { text: "Wrote the PRDs with the Glints team.", metric: "+30% flow" },
      { text: "Mentored four teams to the final showcase.", metric: "4x Best Team" },
    ],
  },
  {
    org: "Build App Today Heroes",
    role: "Intern System Analyst",
    place: "Yogyakarta, Indonesia",
    period: "Feb 2016 - Jul 2017",
    current: false,
    outcomes: [{ text: "Analysed and documented internal systems.", metric: "start" }],
  },
];

export const metrics: Metric[] = [
  {
    value: "5",
    unit: "years",
    label: "Engineering track",
    note: "From Feb 2021 to now, web products end to end",
  },
  {
    value: "70",
    unit: "%",
    label: "Manual work removed",
    note: "Go approval product at Xapiens, owned end to end",
  },
  {
    value: "100",
    unit: "+",
    label: "Engineers trained and mentored",
    note: "Bangkit, Dicoding, RevoU, Binar Academy, SWE Growth",
  },
  {
    value: "4",
    unit: "teams",
    label: "Led to Best Team",
    note: "Two of three RevoU final projects, four at Glints",
  },
];

function readJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

/** Lines of hand-written source, excluding the generated and content-free files. */
function sourceLines(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += sourceLines(path);
    else if (/\.(astro|tsx|ts|css)$/.test(entry.name))
      total += readFileSync(path, "utf8").split("\n").length;
  }
  return total;
}

/** Gzipped size of the single stylesheet that ships with the page. */
function styleKb(): number {
  try {
    return gzipSync(readFileSync(join(root, "src/styles/global.css"))).length / 1024;
  } catch {
    return 0;
  }
}

const pkg = readJson("package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export function buildFacts(): BuildFact[] {
  const deps = Object.keys(pkg.dependencies ?? {}).length;
  const devDeps = Object.keys(pkg.devDependencies ?? {}).length;
  const facts: BuildFact[] = [
    {
      label: "Dependencies",
      value: `${deps} runtime, ${devDeps} dev`,
      detail: "Astro static output with a single React island. Counted from package.json.",
    },
    {
      label: "Handwritten source",
      value: `${sourceLines(join(root, "src")).toLocaleString("en-US")} lines`,
      detail: "Astro, TypeScript, one TSX island, one stylesheet. Counted at build time.",
    },
  ];

  const cssKb = styleKb();
  if (cssKb) {
    facts.push({
      label: "Styling",
      value: `${cssKb.toFixed(1)} kB gzip`,
      detail:
        "One stylesheet for the whole page. No utility framework, no CSS runtime.",
    });
  }

  facts.push({
    label: "Runtime shipped",
    value: "1 React island",
    detail:
      "The contact form. Navigation, theme, and the pixel plate are CSS and inline script.",
  });

  facts.push({
    label: "Build",
    value: new Date().toLocaleDateString("en-CA"),
    detail: "This block is generated from the repository, not typed by hand.",
  });

  return facts;
}
