export type Experience = {
  period: string;
  company: string;
  role: string;
  place: string;
  highlights?: string[];
};

export type Stat = {
  value: string;
  label: string;
};

export type Education = {
  period: string;
  school: string;
  degree: string;
  place: string;
};

export const profile = {
  name: "Michael Stevan Lapandio",
  roles: "Software Engineer, Web3 Enthusiast, AI Enthusiast, Basketball Player",
  tagline:
    "Building robust web applications with clean code, scalable architecture, and a focus on user experience.",
  birthday: "13 May 1994",
  email: "michaellapandio04@gmail.com",
  location: "Yogyakarta, Indonesia",
  linkedin: "https://www.linkedin.com/in/mlapandio/",
  socials: [
    { label: "GitHub", url: "https://github.com/kyomel" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/mlapandio/" },
    { label: "Medium", url: "https://medium.com/@kyomel" },
    { label: "DEV", url: "https://dev.to/kyomel" },
  ],
  about: [
    "Software Engineer with 5+ years of experience building web products end to end. I work across ReactJS front-ends and Node.js and Go back-ends. I currently build Web3 products at Orbitum.",    "I care about outcomes you can measure. At Xapiens Teknologi Indonesia I built an internal Go product that automated the approval process and cut manual work by 70%. An incident reporting feature cut reporting time by 60% and raised data accuracy by 40%. Refactoring lifted application responsiveness by 35%.",
    "I also grow engineers. As Team Lead at RevoU I guided 14 students and led 3 final-project teams. Two of them won \"Best Team\". Through Dicoding, Bangkit, and Binar Academy I have mentored hundreds of students. In the SWE Growth community I run daily tech-term programs and System Design sessions.",
    "I am open to conversations about software engineering, Web3, AI, and mentoring. The fastest way to reach me is michaellapandio04@gmail.com.",
  ],
  stats: [
    { value: "5+", label: "Years building web products" },
    { value: "9", label: "Roles across teams & communities" },
    { value: "100+", label: "Engineers mentored & trained" },
    { value: "70%", label: "Manual work automated at Xapiens" },
  ] as Stat[],
  details: [
    { label: "Name", value: "Michael Stevan Lapandio" },
    { label: "Birthday", value: "13 May 1994" },
    { label: "Profile", value: "Software Engineer at Orbitum" },
    { label: "Email", value: "michaellapandio04@gmail.com" },
    { label: "Location", value: "Yogyakarta, Indonesia" },
  ],
  stack: [
    "JavaScript",
    "HTML/CSS",
    "Go",
    "Node.js",
    "Python",
    "Git",
    "Docker",
    "Kubernetes",
    "SQL",
    "Rust",
  ],
  experience: [
    {
      period: "Sep 2025 - Present",
      company: "Orbitum",
      role: "Software Engineer",
      place: "Yogyakarta, Indonesia",
    },
    {
      period: "Dec 2023 - Present",
      company: "Software Engineer Growth Community",
      role: "Co-Founder",
      place: "Indonesia",
      highlights: [
        "Run the weekday daily tech-term program.",
        "Host System Design discussions and share AI tooling news with the community.",
      ],
    },
    {
      period: "Jun 2025 - Apr 2026",
      company: "Dicoding Indonesia",
      role: "Contributor at Coding Camp 2025 & 2026 by DBS Foundation",
      place: "Indonesia",
      highlights: [
        "Mentored capstone teams with 100% session attendance and 4.8-5/5 student satisfaction.",
        "Helped graduation rates reach 75% (2025) and 88% (2026).",
      ],
    },
    {
      period: "Oct 2024 - May 2025",
      company: "RevoU",
      role: "Team Lead",
      place: "Indonesia",
      highlights: [
        "Mentored 14 students: 85% program completion, 70% reached the final project phase.",
        "Led 3 final-project teams; 2 of them won \"Best Team\".",
      ],
    },
    {
      period: "Apr 2024 - Jul 2024",
      company: "Binar Academy",
      role: "Buddy, Binar Labs 2",
      place: "Indonesia",
      highlights: [
        "Guided the backend team to 20% better code efficiency.",
        "Daily progress reviews cut project delays by 30%.",
      ],
    },
    {
      period: "Feb 2021 - Apr 2024",
      company: "Xapiens Teknologi Indonesia",
      role: "Software Engineer",
      place: "Yogyakarta, Indonesia",
      highlights: [
        "Built ReactJS, NodeJS, and Golang applications; raised responsiveness by 35%.",
        "Automated the approval process with an internal Go product: 70% less manual intervention.",
        "Incident reporting feature: reporting time down 60%, data accuracy up 40%.",
      ],
    },
    {
      period: "Feb 2023 - Jun 2023",
      company: "Bangkit led by Google, GoTo, and Traveloka",
      role: "Soft Skill Instructor and Advisor",
      place: "Indonesia",
      highlights: [
        "Trained 100+ students in soft skills; engagement up 40%.",
        "Guided final-project teams: +25% completion and quality.",
      ],
    },
    {
      period: "Nov 2020 - Mar 2022",
      company: "Glints",
      role: "Product Owner at Glints Academy",
      place: "Indonesia",
      highlights: [
        "Wrote PRDs with the Glints team: +30% project flow efficiency.",
        "Mentored 4 teams to \"Best Team\" in the final showcase.",
      ],
    },
    {
      period: "Feb 2016 - Jul 2017",
      company: "Build App Today Heroes",
      role: "Intern System Analyst",
      place: "Yogyakarta, Indonesia",
    },
  ] as Experience[],
  education: [
    {
      period: "2012 - 2019",
      school: "Universitas Atma Jaya Yogyakarta",
      degree: "Sarjana Komputer (S.Kom.) in Informatics Engineering",
      place: "Yogyakarta, Indonesia",
    },
    {
      period: "2020",
      school: "Binar Academy",
      degree: "Back-End Developer Bootcamp (Glints x Binar Academy Batch 6)",
      place: "Indonesia",
    },
  ] as Education[],
  certificationsNote:
    "I hold many certifications: Go and identity and access engineering, front-end and back-end web development, data science, and English (EFSET B2). The full list with certificate links lives on my LinkedIn profile.",
  projects: [
    {
      title: "Sayembara App",
      category: "Backend",
      desc: "Contest management API with authentication, submissions, and admin dashboard.",
      tags: ["Node.js", "Express", "PostgreSQL", "JWT"],
    },
    {
      title: "AI / Web3 Project",
      category: "Coming Soon",
      desc: "Exploring the intersection of AI and Web3 technologies. Currently in development phase.",
      tags: ["AI", "Web3", "Rust"],
    },
  ],
};
