/** Everything the portfolio says about Dorian, taken from the resume. */

export interface Job {
  company: string;
  place: string;
  role: string;
  period: string;
  bullets: readonly string[];
}

export interface SkillGroup {
  name: string;
  items: readonly string[];
}

export interface Degree {
  school: string;
  place: string;
  title: string;
  period: string;
}

export interface Link {
  label: string;
  url: string;
}

export const profile = {
  name: 'Dorian Cortes',
  role: 'Senior Software Engineer',
  employer: 'Microsoft',
  location: 'San José, Costa Rica',
  /** Costa Rica, for the globe pin and the coordinates readout. */
  coordinates: { lat: 9.932, lon: -84.0985 },
  /** The first job; the uptime counter counts from here. */
  careerStart: '2017-09-01',

  summary:
    'Senior Software Engineer with 8+ years designing and building full-stack, cloud-native, and agentic systems across gaming, real estate, and marketplace platforms. Primary technical owner of an Xbox developer support platform used by game studios worldwide, with recent focus on AI/agentic infrastructure — internal MCP tooling, monorepo-scale context management, and evaluation and guardrail design — alongside hands-on Azure and full-stack delivery. Four-plus years working remote in a US-overlapping timezone, mentoring engineers and adapting quickly across new stacks and platforms.',

  leadership: [
    'Author internal proposals for improving development cycle time and engineering productivity through AI, including harness engineering techniques',
    'Hold design authority across cross-functional teams for new Xbox platform features spanning Console, PC, Web, Android, iOS, and Smart TV, authoring Technical Design Documents that align stakeholders',
    'Deliver internal brown bag sessions and technical talks sharing engineering practices and emerging AI-assisted development techniques',
    'Mentor engineers joining the team, supporting onboarding and technical growth',
  ],

  experience: [
    {
      company: 'Microsoft',
      place: 'San José, Costa Rica (Remote)',
      role: 'Senior Software Engineer',
      period: 'Jan 2022 – Present',
      bullets: [
        'Serve as primary technical owner of the Xbox game developer support platform used by game studios worldwide, driving its architecture and roadmap, and securing it with Microsoft Identity Platform and Microsoft Graph API',
        'Design and build internal MCP (Model Context Protocol) servers that improve agentic tool performance when searching a large monorepo, now adopted by other engineers on the team',
        'Lead internal investigation into agentic context management for large monorepo codebases, and contribute to shared memory model definitions and to guardrails and evaluation loops for agentic self-verification, also adopted by teammates',
        'Prototype agentic product experiences on the Microsoft Agent Framework through internal hackathons, including a RAG-based system to help automatically resolve requests on the Xbox developer support portal',
        'Build the Xbox app for PC in C++/WinRT and UWP, and extend Xbox app experiences on web and Smart TV using React JS, TypeScript, and React Native for Windows',
        'Develop distributed backend microservices on Azure using Cosmos DB, Azure SQL, Service Bus, Storage, Kubernetes, and Azure Search',
        'Extend an existing Java and Spring Boot service inherited mid-project, having ramped up quickly on an unfamiliar stack to take ownership and deploy it on Azure App Services with Docker and Azure Kubernetes',
      ],
    },
    {
      company: 'Gorilla Logic',
      place: 'San José, Costa Rica (Remote)',
      role: 'Full Stack Engineer',
      period: 'Sep 2020 – Dec 2021',
      bullets: [
        'Delivered full-stack development services for a US-based financial services company providing title insurance and settlement services to the real estate and mortgage industries',
        'Built a B2B digital real estate closing platform that automated title and escrow workflows, replacing manual coordination between parties',
        'Designed and implemented microservices integrating with county offices across the US to support the closing platform',
        'Developed an administration portal enabling finance specialists and analysts to track and manage closing processes independently',
        'Worked across a .NET Core, GraphQL, and Azure stack within Agile/SCRUM teams',
      ],
    },
    {
      company: 'EX Squared',
      place: 'San José, Costa Rica (On-site)',
      role: 'Frontend Engineer',
      period: 'Jan 2018 – Aug 2020',
      bullets: [
        'Developed new features for a customer-facing new home marketplace platform serving buyers across the US',
        'Led a ground-up redesign of the marketplace platform, replacing an aging experience with a mobile-first, accessibility-enhanced site that improved performance and SEO',
        'Rebuilt from scratch a legacy, data-intensive B2B partner platform used by hundreds of new home partners, modernizing it with a new architecture, look, and feel',
        'Maintained a weekly release cadence using Git, Bitbucket, and CI/CD pipelines within Agile/SCRUM teams',
      ],
    },
    {
      company: 'EX Squared',
      place: 'San José, Costa Rica (On-site)',
      role: 'Software Automation Engineer',
      period: 'Sep 2017 – Dec 2017',
      bullets: [
        'Designed and maintained Selenium-based automation test suites in Java to validate technical requirements across releases',
      ],
    },
  ],

  skills: [
    {
      name: 'Languages',
      items: ['JavaScript', 'TypeScript', 'C#', 'C/C++', 'Java', 'Python', 'Go', 'SQL', 'HTML', 'CSS'],
    },
    {
      name: 'AI & Agentic Engineering',
      items: [
        'MCP (Model Context Protocol)',
        'Agentic Context Engineering',
        'Agent Memory Architecture',
        'Evaluation & Guardrail Design',
        'RAG',
        'Microsoft Agent Framework',
        'Azure AI',
        'GitHub Copilot',
        'Claude Code',
        'OpenAI Codex',
      ],
    },
    {
      name: 'Frontend',
      items: ['React JS', 'React Native for Windows', 'Vite', 'Microsoft Fluent UI', 'Web Components'],
    },
    {
      name: 'Backend & Frameworks',
      items: ['.NET 10', '.NET Core', '.NET Aspire', 'Entity Framework', 'Spring Boot', 'GraphQL', 'C++/WinRT', 'UWP'],
    },
    {
      name: 'Cloud & DevOps',
      items: [
        'Azure Cosmos DB',
        'Azure SQL',
        'Azure Service Bus',
        'Azure Kubernetes',
        'Azure Functions',
        'Azure App Services',
        'Docker',
        'Azure Pipelines',
        'Microsoft Identity Platform',
        'Microsoft Graph API',
      ],
    },
    {
      name: 'Practices & Methodologies',
      items: [
        'Agile/SCRUM',
        'Technical Design Documents',
        'Technical Requirement Analysis',
        'Object-Oriented Programming',
        'CI/CD',
        'Software Compliance',
      ],
    },
  ],

  education: [
    {
      school: 'Universidad Latinoamericana de Ciencia y Tecnología',
      place: 'San José, Costa Rica',
      title: 'Bachelor of Engineering in Computer Science',
      period: 'Jan 2018 – Apr 2021',
    },
    {
      school: 'Colegio Técnico Don Bosco',
      place: 'San José, Costa Rica',
      title: 'Associate Degree in Software Development',
      period: 'Jan 2015 – Dec 2017',
    },
  ],

  spoken: [
    { language: 'Spanish', level: 'Native' },
    { language: 'English', level: 'Professional fluency' },
  ],

  links: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/dorian-cortes' },
    { label: 'GitHub', url: 'https://github.com/dorian-cg/portfolio' },
  ],
} as const satisfies {
  name: string;
  role: string;
  employer: string;
  location: string;
  coordinates: { lat: number; lon: number };
  careerStart: string;
  summary: string;
  leadership: readonly string[];
  experience: readonly Job[];
  skills: readonly SkillGroup[];
  education: readonly Degree[];
  spoken: readonly { language: string; level: string }[];
  links: readonly Link[];
};
