/**
 * Community programs. One entry per program, newest first. Every number here is
 * stated in `profile.ts` or in the program's own public page.
 */

export type ProgramOutcome = {
  metric: string;
  text: string;
};

export type Program = {
  org: string;
  role: string;
  period: string;
  current: boolean;
  /** What the program is, in one line. */
  what: string;
  /** What I did there, in one line. */
  did: string;
  outcomes: ProgramOutcome[];
  link?: { href: string; label: string };
};

export const programs: Program[] = [
  {
    org: "Software Engineer Growth Community",
    role: "Co-Founder",
    period: "Dec 2023 - Present",
    current: true,
    what: "A community of Indonesian software engineers that meets every weekday.",
    did: "I run the weekday tech-term program and host System Design sessions.",
    outcomes: [
      { metric: "weekday", text: "Daily tech-term program, running since Dec 2023." },
      { metric: "weekly", text: "System Design discussions and AI tooling news." },
      { metric: "100+", text: "Engineers trained across the community and its programs." },
    ],
    link: { href: "https://github.com/swegrowthid", label: "swegrowthid on GitHub" },
  },
  {
    org: "Dicoding Indonesia",
    role: "Contributor, Coding Camp 2025 and 2026 by DBS Foundation",
    period: "Jun 2025 - Apr 2026",
    current: false,
    what: "A national coding bootcamp run by Dicoding and the DBS Foundation.",
    did: "I mentored capstone teams through the final project.",
    outcomes: [
      { metric: "4.8-5/5", text: "Student satisfaction, at full session attendance." },
      { metric: "75>88%", text: "Graduation rate for the mentored cohorts, 2025 to 2026." },
    ],
  },
  {
    org: "RevoU",
    role: "Team Lead",
    period: "Oct 2024 - May 2025",
    current: false,
    what: "A software engineering bootcamp.",
    did: "I mentored 14 students and led three final-project teams.",
    outcomes: [
      { metric: "85% done", text: "Mentored students reached the end of the program." },
      { metric: "70%", text: "Reached the final project phase." },
      { metric: "2 won", text: "Of three final-project teams won Best Team." },
    ],
  },
  {
    org: "Binar Academy",
    role: "Buddy, Binar Labs 2",
    period: "Apr 2024 - Jul 2024",
    current: false,
    what: "A backend engineering lab for Binar Academy students.",
    did: "I guided the backend team day to day and reviewed progress against the plan.",
    outcomes: [
      { metric: "+20% code", text: "Cleaner code from the backend team." },
      { metric: "-30% delay", text: "Project delays, from daily progress reviews." },
    ],
  },
  {
    org: "Bangkit, led by Google, GoTo, and Traveloka",
    role: "Soft Skill Instructor and Advisor",
    period: "Feb 2023 - Jun 2023",
    current: false,
    what: "A national talent program led by Google, GoTo, and Traveloka.",
    did: "I taught soft skills and advised final-project teams to completion.",
    outcomes: [
      { metric: "100+", text: "Students trained in soft skills." },
      { metric: "+40%", text: "Engagement in the sessions." },
      { metric: "+25%", text: "Completion and quality of the advised teams." },
    ],
  },
  {
    org: "Glints Academy",
    role: "Product Owner",
    period: "Nov 2020 - Mar 2022",
    current: false,
    what: "A product and engineering academy run by Glints.",
    did: "I wrote the PRDs with the Glints team and mentored four teams.",
    outcomes: [
      { metric: "+30% flow", text: "Project flow efficiency from the PRDs." },
      { metric: "4 teams", text: "Mentored to Best Team in the final showcase." },
    ],
  },
];
