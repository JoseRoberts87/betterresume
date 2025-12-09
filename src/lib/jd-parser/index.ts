import { chat } from "@/lib/ollama";
import type {
  ParsedJobDescription,
  SeniorityLevel,
  ExtractedSkill,
} from "@/types/job";
import {
  SENIORITY_PATTERNS,
  REQUIRED_PATTERNS,
  PREFERRED_PATTERNS,
} from "@/types/job";

const JD_PARSE_PROMPT = `You are a job description parser. Extract structured information from the following job description.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "title": "job title or null",
  "company": "company name or null",
  "location": "location or null",
  "seniorityLevel": "entry|mid|senior|lead|executive or null",
  "requiredSkills": [{"name": "skill name", "category": "technical|soft|tool|domain|certification"}],
  "preferredSkills": [{"name": "skill name", "category": "technical|soft|tool|domain|certification"}],
  "responsibilities": ["responsibility 1", "responsibility 2"],
  "requirements": [{"text": "requirement text", "type": "experience|education|certification|other", "yearsRequired": number or null, "isRequired": true|false}],
  "benefits": ["benefit 1", "benefit 2"]
}

Rules:
- requiredSkills: Skills marked as "must have", "required", "mandatory", or in Requirements section
- preferredSkills: Skills marked as "nice to have", "preferred", "bonus", or single mentions
- For technical skills: programming languages, frameworks, databases, cloud platforms, tools
- For soft skills: communication, leadership, teamwork, problem-solving
- Extract years of experience requirements when mentioned
- Determine seniority from title keywords (Junior, Senior, Lead, etc.) or years required

Job Description:
`;

export async function parseJobDescriptionWithLLM(
  rawDescription: string
): Promise<ParsedJobDescription> {
  try {
    const response = await chat(
      [
        {
          role: "user",
          content: JD_PARSE_PROMPT + rawDescription,
        },
      ],
      {
        model: "llama3.2",
        temperature: 0.3,
        format: "json",
      }
    );

    const parsed = JSON.parse(response);

    // Add priority based on required vs preferred
    const requiredSkills: ExtractedSkill[] = (parsed.requiredSkills || []).map(
      (s: { name: string; category: string }) => ({
        ...s,
        priority: "P1" as const,
      })
    );

    const preferredSkills: ExtractedSkill[] = (parsed.preferredSkills || []).map(
      (s: { name: string; category: string }, i: number) => ({
        ...s,
        priority: (i < 3 ? "P2" : "P3") as "P2" | "P3",
      })
    );

    return {
      title: parsed.title || undefined,
      company: parsed.company || undefined,
      location: parsed.location || undefined,
      seniorityLevel: parsed.seniorityLevel || undefined,
      requiredSkills,
      preferredSkills,
      responsibilities: parsed.responsibilities || [],
      requirements: parsed.requirements || [],
      benefits: parsed.benefits || [],
    };
  } catch (error) {
    console.error("LLM parsing failed:", error);
    // Fall back to rule-based parsing
    return parseJobDescriptionRuleBased(rawDescription);
  }
}

// Rule-based fallback parser
export function parseJobDescriptionRuleBased(
  rawDescription: string
): ParsedJobDescription {
  const lines = rawDescription.split("\n").map((l) => l.trim()).filter(Boolean);

  // Detect seniority
  let seniorityLevel: SeniorityLevel | undefined;

  for (const [level, patterns] of Object.entries(SENIORITY_PATTERNS) as [SeniorityLevel, RegExp[]][]) {
    if (patterns.some((p) => p.test(rawDescription))) {
      seniorityLevel = level;
      break;
    }
  }

  // Extract common tech skills using regex
  const techSkillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Angular|Vue|Next\.?js|Node\.?js|Express|Django|Flask|Spring|Rails)\b/gi,
    /\b(AWS|Azure|GCP|Google Cloud|Kubernetes|Docker|Terraform)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB)\b/gi,
    /\b(Git|CI\/CD|Jenkins|GitHub Actions|CircleCI)\b/gi,
    /\b(REST|GraphQL|gRPC|API|Microservices)\b/gi,
    /\b(Agile|Scrum|Kanban|JIRA)\b/gi,
  ];

  const foundSkills = new Set<string>();
  for (const pattern of techSkillPatterns) {
    const matches = rawDescription.match(pattern);
    if (matches) {
      matches.forEach((m) => foundSkills.add(m));
    }
  }

  // Determine if skills are required or preferred based on context
  const requiredSkills: ExtractedSkill[] = [];
  const preferredSkills: ExtractedSkill[] = [];

  for (const skill of foundSkills) {
    // Check surrounding context
    const skillRegex = new RegExp(`[^.]*\\b${skill}\\b[^.]*`, "gi");
    const contexts = rawDescription.match(skillRegex) || [];

    let isRequired = false;
    for (const context of contexts) {
      if (REQUIRED_PATTERNS.some((p) => p.test(context))) {
        isRequired = true;
        break;
      }
    }

    const extractedSkill: ExtractedSkill = {
      name: skill,
      priority: isRequired ? "P1" : "P2",
      category: "technical",
    };

    if (isRequired) {
      requiredSkills.push(extractedSkill);
    } else {
      preferredSkills.push(extractedSkill);
    }
  }

  // Extract responsibilities (lines starting with bullet points or dashes)
  const responsibilities = lines
    .filter((l) => /^[-*•]\s/.test(l) || /^\d+\.\s/.test(l))
    .map((l) => l.replace(/^[-*•\d.]\s*/, ""))
    .slice(0, 10);

  return {
    seniorityLevel,
    requiredSkills,
    preferredSkills,
    responsibilities,
    requirements: [],
  };
}

// Hybrid approach: use LLM with rule-based validation
export async function parseJobDescription(
  rawDescription: string,
  useLLM: boolean = true
): Promise<ParsedJobDescription> {
  if (useLLM) {
    return parseJobDescriptionWithLLM(rawDescription);
  }
  return parseJobDescriptionRuleBased(rawDescription);
}
