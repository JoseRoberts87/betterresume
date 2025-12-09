// Custom skill taxonomy - bootstrap from common tech skills
// This can be expanded with O*NET or ESCO data later

export interface SkillDefinition {
  name: string;
  category: "technical" | "soft" | "tool" | "domain" | "certification";
  aliases: string[];
  relatedSkills: string[];
}

export const SKILL_TAXONOMY: SkillDefinition[] = [
  // Programming Languages
  { name: "JavaScript", category: "technical", aliases: ["JS", "ECMAScript", "ES6"], relatedSkills: ["TypeScript", "Node.js", "React"] },
  { name: "TypeScript", category: "technical", aliases: ["TS"], relatedSkills: ["JavaScript", "Node.js", "React"] },
  { name: "Python", category: "technical", aliases: ["Python3", "Py"], relatedSkills: ["Django", "Flask", "FastAPI"] },
  { name: "Java", category: "technical", aliases: ["Java8", "Java11", "Java17"], relatedSkills: ["Spring", "Maven", "Gradle"] },
  { name: "C#", category: "technical", aliases: ["CSharp", "C Sharp", ".NET"], relatedSkills: [".NET", "ASP.NET"] },
  { name: "Go", category: "technical", aliases: ["Golang"], relatedSkills: ["Kubernetes", "Docker"] },
  { name: "Rust", category: "technical", aliases: [], relatedSkills: ["WebAssembly", "Systems Programming"] },
  { name: "Ruby", category: "technical", aliases: [], relatedSkills: ["Rails", "Ruby on Rails"] },
  { name: "PHP", category: "technical", aliases: [], relatedSkills: ["Laravel", "WordPress"] },
  { name: "Swift", category: "technical", aliases: [], relatedSkills: ["iOS", "Xcode"] },
  { name: "Kotlin", category: "technical", aliases: [], relatedSkills: ["Android", "JVM"] },
  { name: "SQL", category: "technical", aliases: ["Structured Query Language"], relatedSkills: ["PostgreSQL", "MySQL", "Database"] },

  // Frontend Frameworks
  { name: "React", category: "technical", aliases: ["React.js", "ReactJS"], relatedSkills: ["JavaScript", "TypeScript", "Next.js"] },
  { name: "Vue", category: "technical", aliases: ["Vue.js", "VueJS"], relatedSkills: ["JavaScript", "Nuxt"] },
  { name: "Angular", category: "technical", aliases: ["Angular.js", "AngularJS"], relatedSkills: ["TypeScript", "RxJS"] },
  { name: "Next.js", category: "technical", aliases: ["NextJS", "Next"], relatedSkills: ["React", "Vercel"] },
  { name: "Svelte", category: "technical", aliases: ["SvelteKit"], relatedSkills: ["JavaScript"] },

  // Backend Frameworks
  { name: "Node.js", category: "technical", aliases: ["NodeJS", "Node"], relatedSkills: ["JavaScript", "Express", "NestJS"] },
  { name: "Express", category: "technical", aliases: ["Express.js", "ExpressJS"], relatedSkills: ["Node.js"] },
  { name: "Django", category: "technical", aliases: [], relatedSkills: ["Python"] },
  { name: "Flask", category: "technical", aliases: [], relatedSkills: ["Python"] },
  { name: "FastAPI", category: "technical", aliases: [], relatedSkills: ["Python"] },
  { name: "Spring", category: "technical", aliases: ["Spring Boot", "Spring Framework"], relatedSkills: ["Java"] },
  { name: "Rails", category: "technical", aliases: ["Ruby on Rails", "RoR"], relatedSkills: ["Ruby"] },

  // Databases
  { name: "PostgreSQL", category: "technical", aliases: ["Postgres", "PSQL"], relatedSkills: ["SQL", "Database"] },
  { name: "MySQL", category: "technical", aliases: [], relatedSkills: ["SQL", "Database"] },
  { name: "MongoDB", category: "technical", aliases: ["Mongo"], relatedSkills: ["NoSQL", "Database"] },
  { name: "Redis", category: "technical", aliases: [], relatedSkills: ["Caching", "Database"] },
  { name: "Elasticsearch", category: "technical", aliases: ["ES", "Elastic"], relatedSkills: ["Search", "Database"] },
  { name: "DynamoDB", category: "technical", aliases: [], relatedSkills: ["AWS", "NoSQL"] },

  // Cloud & DevOps
  { name: "AWS", category: "technical", aliases: ["Amazon Web Services"], relatedSkills: ["Cloud", "EC2", "S3", "Lambda"] },
  { name: "Azure", category: "technical", aliases: ["Microsoft Azure"], relatedSkills: ["Cloud"] },
  { name: "GCP", category: "technical", aliases: ["Google Cloud", "Google Cloud Platform"], relatedSkills: ["Cloud"] },
  { name: "Docker", category: "tool", aliases: [], relatedSkills: ["Containers", "Kubernetes"] },
  { name: "Kubernetes", category: "tool", aliases: ["K8s"], relatedSkills: ["Docker", "DevOps"] },
  { name: "Terraform", category: "tool", aliases: [], relatedSkills: ["Infrastructure as Code", "DevOps"] },
  { name: "CI/CD", category: "technical", aliases: ["Continuous Integration", "Continuous Deployment"], relatedSkills: ["DevOps", "Jenkins", "GitHub Actions"] },
  { name: "Jenkins", category: "tool", aliases: [], relatedSkills: ["CI/CD", "DevOps"] },
  { name: "GitHub Actions", category: "tool", aliases: [], relatedSkills: ["CI/CD", "GitHub"] },

  // Tools
  { name: "Git", category: "tool", aliases: ["GitHub", "GitLab", "Bitbucket"], relatedSkills: ["Version Control"] },
  { name: "JIRA", category: "tool", aliases: [], relatedSkills: ["Agile", "Project Management"] },
  { name: "Figma", category: "tool", aliases: [], relatedSkills: ["Design", "UI/UX"] },

  // Soft Skills
  { name: "Leadership", category: "soft", aliases: ["Team Leadership", "People Management"], relatedSkills: ["Management", "Communication"] },
  { name: "Communication", category: "soft", aliases: ["Written Communication", "Verbal Communication"], relatedSkills: ["Collaboration"] },
  { name: "Problem Solving", category: "soft", aliases: ["Problem-Solving", "Analytical Skills"], relatedSkills: ["Critical Thinking"] },
  { name: "Teamwork", category: "soft", aliases: ["Collaboration", "Team Player"], relatedSkills: ["Communication"] },
  { name: "Agile", category: "soft", aliases: ["Agile Methodology", "Agile Development"], relatedSkills: ["Scrum", "Kanban"] },
  { name: "Scrum", category: "soft", aliases: ["Scrum Master"], relatedSkills: ["Agile"] },
  { name: "Mentoring", category: "soft", aliases: ["Coaching", "Teaching"], relatedSkills: ["Leadership"] },

  // Domains
  { name: "Machine Learning", category: "domain", aliases: ["ML", "AI", "Artificial Intelligence"], relatedSkills: ["Python", "TensorFlow", "PyTorch"] },
  { name: "Data Science", category: "domain", aliases: ["Data Analytics"], relatedSkills: ["Python", "SQL", "Machine Learning"] },
  { name: "DevOps", category: "domain", aliases: ["Site Reliability", "SRE"], relatedSkills: ["CI/CD", "Kubernetes", "Docker"] },
  { name: "Security", category: "domain", aliases: ["Cybersecurity", "InfoSec"], relatedSkills: ["Authentication", "Encryption"] },
  { name: "API Design", category: "domain", aliases: ["REST API", "API Development"], relatedSkills: ["REST", "GraphQL"] },

  // Certifications
  { name: "AWS Certified", category: "certification", aliases: ["AWS Certification"], relatedSkills: ["AWS"] },
  { name: "PMP", category: "certification", aliases: ["Project Management Professional"], relatedSkills: ["Project Management"] },
  { name: "Scrum Master Certified", category: "certification", aliases: ["CSM", "PSM"], relatedSkills: ["Scrum", "Agile"] },
];

// Create lookup maps for fast access
export const SKILL_BY_NAME = new Map<string, SkillDefinition>(
  SKILL_TAXONOMY.map((s) => [s.name.toLowerCase(), s])
);

export const SKILL_BY_ALIAS = new Map<string, SkillDefinition>();
for (const skill of SKILL_TAXONOMY) {
  for (const alias of skill.aliases) {
    SKILL_BY_ALIAS.set(alias.toLowerCase(), skill);
  }
}

export function findSkill(name: string): SkillDefinition | undefined {
  const normalized = name.toLowerCase().trim();
  return SKILL_BY_NAME.get(normalized) || SKILL_BY_ALIAS.get(normalized);
}

export function normalizeSkillName(name: string): string {
  const skill = findSkill(name);
  return skill?.name || name;
}

export function getRelatedSkills(name: string): string[] {
  const skill = findSkill(name);
  return skill?.relatedSkills || [];
}
