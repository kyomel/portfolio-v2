const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export const siteMeta = {
  title: 'Michael Stevan Lapandio | Software Engineer Portfolio',
  description:
    'Software Engineer portfolio of Michael Stevan Lapandio, focused on backend, web engineering, and impactful digital products.',
  url: siteUrl
};

export const profile = {
  name: 'Michael Stevan Lapandio',
  role: 'Software Engineer',
  location: 'Yogyakarta, Indonesia',
  birthday: '13 May 1994',
  email: 'michaellapandio04@gmail.com',
  tagline:
    'I build reliable products across backend and frontend stacks, with a strong focus on clean architecture and practical impact.',
  summary: [
    'As a seasoned Software Engineer with over three years in the ICT industry, I have worked across frontend and backend technologies, including ReactJS, NodeJS, and Golang.',
    'At PT Xapiens Teknologi Indonesia, I helped build a digital approval process that reduced manual intervention by 70%, showing how technical improvements can unlock real operational value.',
    'I enjoy learning and sharing, and I am always excited to collaborate on projects that blend engineering quality with meaningful user outcomes.'
  ],
  skills: ['JavaScript', 'TypeScript', 'Go', 'Node.js', 'React', 'Python', 'PostgreSQL', 'Docker', 'Kubernetes']
};

export const experiences = [
  {
    period: 'Oct 2024 - May 2025',
    company: 'RevoU',
    role: 'Team Lead',
    location: 'Remote'
  },
  {
    period: 'Apr 2024 - Jun 2024',
    company: 'Binar Academy',
    role: 'Buddy Lab 2',
    location: 'Remote'
  },
  {
    period: 'Feb 2023 - Jun 2023',
    company: 'Bangkit Academy',
    role: 'Soft Skill Instructor and Advisor',
    location: 'Remote'
  },
  {
    period: 'Feb 2021 - May 2024',
    company: 'PT Xapiens Teknologi Indonesia',
    role: 'Software Engineer',
    location: 'Special Region of Yogyakarta'
  },
  {
    period: 'Nov 2020 - Mar 2022',
    company: 'Glints Academy',
    role: 'Part-Time Product Owner',
    location: 'Remote'
  }
];

export const education = [
  {
    period: 'Aug 2012 - Sept 2019',
    school: 'Atma Jaya Yogyakarta University',
    major: 'Informatics Engineering'
  },
  {
    period: 'Apr 2020 - Jul 2020',
    school: 'Glints x Binar Academy Batch 6',
    major: 'Back-End Developer Program'
  }
];

export const projects = [
  {
    name: 'Sayembara App',
    description:
      'Backend platform for managing contests and submissions with authentication and robust data workflows.',
    stack: ['Node.js', 'Express', 'PostgreSQL', 'Sequelize', 'JWT'],
    liveUrl: 'https://sayembara-ga6.herokuapp.com/'
  }
];

export const socials = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/michael-stevan-lapandio/',
    color: '#0a66c2'
  },
  {
    label: 'GitHub',
    href: 'https://github.com/kyomel',
    color: '#181717'
  },
  {
    label: 'Dev.to',
    href: 'https://dev.to/kyomel',
    color: '#0a0a0a'
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/michael.limabelas/',
    color: '#0866ff'
  }
];
