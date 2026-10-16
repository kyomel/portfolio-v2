/**
 * Contribution record. Counts come from the GitHub API, read by hand on
 * `measured`. They are not fetched at build time: a network call would make the
 * build depend on a rate limit and break reproducibility.
 */

export type UpstreamPR = {
  repo: string;
  href: string;
  title: string;
  what: string;
  date: string;
  merged: boolean;
};

export type CommunityRepo = {
  repo: string;
  href: string;
  role: string;
  what: string;
  prs: number;
  merged: number;
  stars: number;
};

export type Resource = {
  repo: string;
  href: string;
  what: string;
  stars: number;
  language: string;
};

export const measured = "2026-10-16";

export const totals = {
  prs: 376,
  merged: 370,
  repos: 8,
};

export const upstream: UpstreamPR[] = [
  {
    repo: "fatjan/gogomanager",
    href: "https://github.com/fatjan/gogomanager/pull/2",
    title: "Migrations using Goose",
    what: "Added the migration path so the schema could change with the code.",
    date: "2025-01-07",
    merged: true,
  },
  {
    repo: "fatjan/gogomanager",
    href: "https://github.com/fatjan/gogomanager/pull/7",
    title: "Get User Profile",
    what: "Added the profile read endpoint and its handler.",
    date: "2025-01-08",
    merged: true,
  },
  {
    repo: "fatjan/gogomanager",
    href: "https://github.com/fatjan/gogomanager/pull/12",
    title: "Delete and Patch Employee",
    what: "Added the update and delete paths for employee records.",
    date: "2025-01-08",
    merged: true,
  },
  {
    repo: "fatjan/fitbyte",
    href: "https://github.com/fatjan/fitbyte/pull/1",
    title: "Init Project fitbyte Boilerplate",
    what: "Set up the project boilerplate the team built on.",
    date: "2025-01-17",
    merged: true,
  },
  {
    repo: "fatjan/fitbyte",
    href: "https://github.com/fatjan/fitbyte/pull/7",
    title: "Add feature Update & Delete Activity",
    what: "Added the update and delete paths for activity records.",
    date: "2025-01-19",
    merged: true,
  },
];

export const communityRepos: CommunityRepo[] = [
  {
    repo: "swegrowthid/daily-term-SE-Growth",
    href: "https://github.com/swegrowthid/daily-term-SE-Growth",
    role: "Maintainer",
    what: "The weekday tech-term journal for SE Growth. One term per day, archived by month.",
    prs: 305,
    merged: 305,
    stars: 9,
  },
  {
    repo: "swegrowthid/lapor-bot",
    href: "https://github.com/swegrowthid/lapor-bot",
    role: "Contributor",
    what: "A WhatsApp activity tracker in Go: self-reporting, streak tracking, and a web dashboard.",
    prs: 51,
    merged: 51,
    stars: 11,
  },
  {
    repo: "swegrowthid/sweg-ai-lists",
    href: "https://github.com/swegrowthid/sweg-ai-lists",
    role: "Contributor",
    what: "An Astro site that lists AI tools for software engineers.",
    prs: 7,
    merged: 7,
    stars: 0,
  },
];

export const resources: Resource[] = [
  {
    repo: "kyomel/list-problems-SE-Growth",
    href: "https://github.com/kyomel/list-problems-SE-Growth",
    what: "Practice problems for SE Growth members, Monday to Friday, with solutions in 11 languages.",
    stars: 48,
    language: "C++",
  },
  {
    repo: "kyomel/system-design-challenge",
    href: "https://github.com/kyomel/system-design-challenge",
    what: "System design use-case problems for the SE Growth Computer Science subgroup, with live discussions.",
    stars: 27,
    language: "Markdown",
  },
  {
    repo: "kyomel/learning-resources",
    href: "https://github.com/kyomel/learning-resources",
    what: "A community list of free and paid IT learning resources, open to contributions.",
    stars: 17,
    language: "Markdown",
  },
  {
    repo: "kyomel/commandcode-pi-omp",
    href: "https://github.com/kyomel/commandcode-pi-omp",
    what: "A Command Code provider package for pi and Oh My Pi, published for the community.",
    stars: 2,
    language: "TypeScript",
  },
];
