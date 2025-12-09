export type SeniorityLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type SkillPriority = "P1" | "P2" | "P3" | "P4";

export interface ExtractedSkill {
  name: string;
  priority: SkillPriority;
  category: "technical" | "soft" | "tool" | "domain" | "certification";
  context?: string; // Original text where skill was found
}

export interface ExtractedRequirement {
  text: string;
  type: "experience" | "education" | "certification" | "other";
  yearsRequired?: number;
  isRequired: boolean;
}

export interface ParsedJobDescription {
  title?: string;
  company?: string;
  location?: string;
  seniorityLevel?: SeniorityLevel;
  requiredSkills: ExtractedSkill[];
  preferredSkills: ExtractedSkill[];
  responsibilities: string[];
  requirements: ExtractedRequirement[];
  benefits?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

// Patterns for detecting seniority
export const SENIORITY_PATTERNS: Record<SeniorityLevel, RegExp[]> = {
  entry: [
    /entry[- ]?level/i,
    /junior/i,
    /associate/i,
    /\b0-2\s*years?\b/i,
    /\b1-2\s*years?\b/i,
    /new\s+grad/i,
  ],
  mid: [
    /mid[- ]?level/i,
    /\b2-4\s*years?\b/i,
    /\b3-5\s*years?\b/i,
    /\b2\+\s*years?\b/i,
    /\b3\+\s*years?\b/i,
  ],
  senior: [
    /senior/i,
    /sr\./i,
    /\b5\+\s*years?\b/i,
    /\b5-7\s*years?\b/i,
    /\b6\+\s*years?\b/i,
    /\b7\+\s*years?\b/i,
    /extensive\s+experience/i,
  ],
  lead: [
    /\blead\b/i,
    /principal/i,
    /staff/i,
    /\b8\+\s*years?\b/i,
    /\b10\+\s*years?\b/i,
  ],
  executive: [
    /director/i,
    /\bvp\b/i,
    /vice\s+president/i,
    /head\s+of/i,
    /\b15\+\s*years?\b/i,
    /c-level/i,
    /chief/i,
  ],
};

// Patterns for detecting required vs preferred
export const REQUIRED_PATTERNS = [
  /must\s+have/i,
  /required/i,
  /mandatory/i,
  /essential/i,
  /minimum/i,
  /at\s+least/i,
];

export const PREFERRED_PATTERNS = [
  /nice\s+to\s+have/i,
  /preferred/i,
  /bonus/i,
  /ideally/i,
  /plus/i,
  /advantage/i,
  /desirable/i,
];
