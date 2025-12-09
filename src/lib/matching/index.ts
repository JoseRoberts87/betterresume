import type { CareerData, Skill as UserSkill, WorkExperience, Project } from "@/types/json-resume";
import type { ExtractedSkill, ParsedJobDescription } from "@/types/job";
import { normalizeSkillName, getRelatedSkills } from "@/lib/skills/taxonomy";

export type CoverageStatus = "FULL" | "PARTIAL" | "GAP";

export interface CoverageItem {
  requirement: string;
  category: "skill" | "experience" | "education" | "other";
  priority: "P1" | "P2" | "P3" | "P4";
  status: CoverageStatus;
  evidence: string[];
  relatedExperience?: string;
}

export interface CoverageMap {
  items: CoverageItem[];
  overallScore: number;
  requiredCoverage: { full: number; partial: number; gap: number };
  preferredCoverage: { full: number; partial: number; gap: number };
}

// Extract all skills from user's career data
function extractUserSkills(careerData: CareerData): Set<string> {
  const skills = new Set<string>();

  // Direct skills
  careerData.skills?.forEach((s) => {
    skills.add(normalizeSkillName(s.name));
  });

  // Skills from work experience
  careerData.work?.forEach((w) => {
    w.skillsUsed?.forEach((s) => skills.add(normalizeSkillName(s)));
    w.toolsUsed?.forEach((t) => skills.add(normalizeSkillName(t)));

    // Extract from highlights
    w.highlights?.forEach((h) => {
      extractSkillsFromText(h).forEach((s) => skills.add(s));
    });
  });

  // Skills from projects
  careerData.projects?.forEach((p) => {
    p.technologies?.forEach((t) => skills.add(normalizeSkillName(t)));
    p.keywords?.forEach((k) => skills.add(normalizeSkillName(k)));
  });

  return skills;
}

// Simple skill extraction from text (can be enhanced with NLP)
function extractSkillsFromText(text: string): string[] {
  const techPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Angular|Vue|Next\.?js|Node\.?js|Express|Django|Flask|Spring|Rails)\b/gi,
    /\b(AWS|Azure|GCP|Kubernetes|Docker|Terraform)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch)\b/gi,
  ];

  const skills: string[] = [];
  for (const pattern of techPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      skills.push(...matches.map(normalizeSkillName));
    }
  }
  return skills;
}

// Find evidence for a skill in user's experience
function findEvidence(skill: string, careerData: CareerData): string[] {
  const evidence: string[] = [];
  const normalizedSkill = normalizeSkillName(skill).toLowerCase();
  const relatedSkills = getRelatedSkills(skill).map((s) => s.toLowerCase());

  // Check work experience
  careerData.work?.forEach((w) => {
    const hasSkill =
      w.skillsUsed?.some((s) => normalizeSkillName(s).toLowerCase() === normalizedSkill) ||
      w.toolsUsed?.some((t) => normalizeSkillName(t).toLowerCase() === normalizedSkill) ||
      w.highlights?.some((h) => h.toLowerCase().includes(normalizedSkill));

    const hasRelated =
      relatedSkills.length > 0 &&
      (w.skillsUsed?.some((s) => relatedSkills.includes(normalizeSkillName(s).toLowerCase())) ||
        w.highlights?.some((h) => relatedSkills.some((r) => h.toLowerCase().includes(r))));

    if (hasSkill) {
      evidence.push(`${w.position} at ${w.company}`);
    } else if (hasRelated) {
      evidence.push(`Related: ${w.position} at ${w.company}`);
    }
  });

  // Check projects
  careerData.projects?.forEach((p) => {
    const hasSkill =
      p.technologies?.some((t) => normalizeSkillName(t).toLowerCase() === normalizedSkill) ||
      p.description?.toLowerCase().includes(normalizedSkill);

    if (hasSkill) {
      evidence.push(`Project: ${p.name}`);
    }
  });

  // Check certifications
  careerData.certifications?.forEach((c) => {
    if (
      c.name.toLowerCase().includes(normalizedSkill) ||
      c.skillsValidated?.some((s) => normalizeSkillName(s).toLowerCase() === normalizedSkill)
    ) {
      evidence.push(`Certification: ${c.name}`);
    }
  });

  return evidence;
}

// Calculate years of experience
function calculateYearsExperience(careerData: CareerData): number {
  if (!careerData.work || careerData.work.length === 0) return 0;

  let totalMonths = 0;
  for (const work of careerData.work) {
    const start = work.startDate ? new Date(work.startDate) : null;
    const end = work.endDate ? new Date(work.endDate) : new Date();

    if (start) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  }

  return Math.round(totalMonths / 12);
}

// Generate coverage map
export function generateCoverageMap(
  careerData: CareerData,
  jobDescription: ParsedJobDescription
): CoverageMap {
  const userSkills = extractUserSkills(careerData);
  const userYearsExp = calculateYearsExperience(careerData);
  const items: CoverageItem[] = [];

  // Process required skills
  for (const skill of jobDescription.requiredSkills) {
    const normalizedName = normalizeSkillName(skill.name);
    const evidence = findEvidence(skill.name, careerData);
    const hasSkill = userSkills.has(normalizedName);
    const hasRelated = getRelatedSkills(skill.name).some((r) => userSkills.has(normalizeSkillName(r)));

    let status: CoverageStatus;
    if (evidence.length > 0 && evidence.some((e) => !e.startsWith("Related"))) {
      status = "FULL";
    } else if (hasRelated || evidence.length > 0) {
      status = "PARTIAL";
    } else {
      status = "GAP";
    }

    items.push({
      requirement: skill.name,
      category: "skill",
      priority: skill.priority,
      status,
      evidence,
    });
  }

  // Process preferred skills
  for (const skill of jobDescription.preferredSkills) {
    const normalizedName = normalizeSkillName(skill.name);
    const evidence = findEvidence(skill.name, careerData);
    const hasSkill = userSkills.has(normalizedName);
    const hasRelated = getRelatedSkills(skill.name).some((r) => userSkills.has(normalizeSkillName(r)));

    let status: CoverageStatus;
    if (evidence.length > 0 && evidence.some((e) => !e.startsWith("Related"))) {
      status = "FULL";
    } else if (hasRelated || evidence.length > 0) {
      status = "PARTIAL";
    } else {
      status = "GAP";
    }

    items.push({
      requirement: skill.name,
      category: "skill",
      priority: skill.priority,
      status,
      evidence,
    });
  }

  // Process experience requirements
  for (const req of jobDescription.requirements) {
    if (req.type === "experience" && req.yearsRequired) {
      const status: CoverageStatus =
        userYearsExp >= req.yearsRequired
          ? "FULL"
          : userYearsExp >= req.yearsRequired * 0.7
            ? "PARTIAL"
            : "GAP";

      items.push({
        requirement: `${req.yearsRequired}+ years experience`,
        category: "experience",
        priority: req.isRequired ? "P1" : "P2",
        status,
        evidence: [`${userYearsExp} years of professional experience`],
      });
    }
  }

  // Calculate coverage stats
  const requiredItems = items.filter((i) => i.priority === "P1");
  const preferredItems = items.filter((i) => i.priority !== "P1");

  const requiredCoverage = {
    full: requiredItems.filter((i) => i.status === "FULL").length,
    partial: requiredItems.filter((i) => i.status === "PARTIAL").length,
    gap: requiredItems.filter((i) => i.status === "GAP").length,
  };

  const preferredCoverage = {
    full: preferredItems.filter((i) => i.status === "FULL").length,
    partial: preferredItems.filter((i) => i.status === "PARTIAL").length,
    gap: preferredItems.filter((i) => i.status === "GAP").length,
  };

  // Calculate overall score (weighted)
  const totalRequired = requiredItems.length || 1;
  const totalPreferred = preferredItems.length || 1;

  const requiredScore =
    (requiredCoverage.full * 1 + requiredCoverage.partial * 0.5) / totalRequired;
  const preferredScore =
    (preferredCoverage.full * 1 + preferredCoverage.partial * 0.5) / totalPreferred;

  // Weight: 70% required, 30% preferred
  const overallScore = Math.round((requiredScore * 0.7 + preferredScore * 0.3) * 100);

  return {
    items,
    overallScore,
    requiredCoverage,
    preferredCoverage,
  };
}
