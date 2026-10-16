export type Education = {
  period: string;
  school: string;
  degree: string;
  place: string;
};

export const profile = {
  name: "Michael Stevan Lapandio",
  brand: "KyoMel",
  roles: "Software Engineer, Web3 Enthusiast, AI Enthusiast, Basketball Player",
  headline: "Engineer, mentor, community builder.",
  tagline:
    "Five years of shipped web products, and more than 100 engineers mentored along the way.",
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
    "Software Engineer with 5+ years of experience building web products end to end. I work across ReactJS front-ends and Node.js and Go back-ends. I currently build Web3 products at Orbitum.",
    "How I work: find the outcome that matters, scope the smallest change that moves it, then ship and measure. Approvals, incident reporting, and performance work all started as a number on a page, not as a rewrite.",
    "I also grow engineers, through team-lead roles, structured mentoring programs, and a community that meets every weekday. Growing people is the part of the work that outlives the release.",
    "I am open to conversations about software engineering, Web3, AI, and mentoring. The fastest way to reach me is michaellapandio04@gmail.com.",
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
};
