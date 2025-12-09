import { chat } from "@/lib/ollama";
import { getGuardrailInstructions, checkGuardrails } from "@/lib/content-rewriter/guardrails";
import type { CareerData } from "@/types/json-resume";
import type { ParsedJobDescription } from "@/types/job";
import type { CoverageMap } from "@/lib/matching";

export interface CoverLetterOptions {
  careerData: CareerData;
  jobDescription: ParsedJobDescription;
  coverageMap?: CoverageMap;
  customizations?: {
    emphasizeSkills?: string[];
    addressGaps?: boolean;
    tone?: "formal" | "enthusiastic" | "conversational";
  };
}

export interface CoverLetterResult {
  content: string;
  guardrailsPassed: boolean;
  violations: string[];
  wordCount: number;
}

const COVER_LETTER_PROMPT = `You are a professional cover letter writer. Generate a tailored cover letter based on the following information.

${getGuardrailInstructions()}

Additional cover letter rules:
- Keep it between 250-400 words (3-4 short paragraphs)
- Opening paragraph: Express genuine interest in the specific role and company
- Body paragraphs: Connect your experience to their requirements with specific examples
- Closing paragraph: Clear call to action, express enthusiasm
- Never use generic phrases like "I am writing to apply for..."
- Make it specific to this company and role
- If addressing gaps, be honest but positive (mention related experience or learning)

Candidate Information:
Name: {name}
Current Role: {currentRole}
Years of Experience: {yearsExp}
Top Relevant Skills: {skills}
Key Achievements: {achievements}

Job Information:
Job Title: {jobTitle}
Company: {company}
Required Skills: {requiredSkills}
Key Responsibilities: {responsibilities}

Coverage Analysis:
Match Score: {matchScore}%
Strong Matches: {strongMatches}
Areas to Address: {gaps}

Skills to Emphasize: {emphasizeSkills}
Address Gaps: {addressGaps}
Tone: {tone}

Return ONLY the cover letter text, no JSON, no explanations, no "Dear Hiring Manager" header (the user will add their own greeting).`;

export async function generateCoverLetter(
  options: CoverLetterOptions
): Promise<CoverLetterResult> {
  const { careerData, jobDescription, coverageMap, customizations } = options;

  // Extract candidate info
  const name = careerData.basics?.name || "Candidate";
  const currentWork = careerData.work?.[0];
  const currentRole = currentWork ? `${currentWork.position} at ${currentWork.company}` : "Professional";

  const yearsExp = careerData.work?.reduce((total, w) => {
    if (!w.startDate) return total;
    const start = new Date(w.startDate);
    const end = w.endDate ? new Date(w.endDate) : new Date();
    return total + (end.getFullYear() - start.getFullYear());
  }, 0) || 0;

  // Get relevant skills (prioritize those matching job requirements)
  const requiredSkillNames = jobDescription.requiredSkills.map((s) => s.name.toLowerCase());
  const relevantSkills = careerData.skills
    ?.filter((s) => requiredSkillNames.includes(s.name.toLowerCase()))
    .map((s) => s.name)
    .slice(0, 5) || [];

  const additionalSkills = careerData.skills
    ?.filter((s) => !requiredSkillNames.includes(s.name.toLowerCase()))
    .map((s) => s.name)
    .slice(0, 3) || [];

  const skills = [...relevantSkills, ...additionalSkills].join(", ");

  // Get key achievements
  const achievements = careerData.work
    ?.slice(0, 2)
    .flatMap((w) => w.highlights?.slice(0, 2) || [])
    .join("; ") || "Various professional achievements";

  // Extract job info
  const jobTitle = jobDescription.title || "the position";
  const company = jobDescription.company || "your company";
  const requiredSkills = jobDescription.requiredSkills.map((s) => s.name).join(", ");
  const responsibilities = jobDescription.responsibilities?.slice(0, 3).join("; ") || "Not specified";

  // Coverage analysis
  const matchScore = coverageMap?.overallScore || 0;
  const strongMatches = coverageMap?.items
    .filter((i) => i.status === "FULL")
    .map((i) => i.requirement)
    .slice(0, 3)
    .join(", ") || "Various relevant skills";
  const gaps = coverageMap?.items
    .filter((i) => i.status === "GAP" && i.priority === "P1")
    .map((i) => i.requirement)
    .slice(0, 2)
    .join(", ") || "None significant";

  const prompt = COVER_LETTER_PROMPT
    .replace("{name}", name)
    .replace("{currentRole}", currentRole)
    .replace("{yearsExp}", String(yearsExp))
    .replace("{skills}", skills)
    .replace("{achievements}", achievements)
    .replace("{jobTitle}", jobTitle)
    .replace("{company}", company)
    .replace("{requiredSkills}", requiredSkills)
    .replace("{responsibilities}", responsibilities)
    .replace("{matchScore}", String(matchScore))
    .replace("{strongMatches}", strongMatches)
    .replace("{gaps}", gaps)
    .replace("{emphasizeSkills}", customizations?.emphasizeSkills?.join(", ") || "All relevant skills")
    .replace("{addressGaps}", customizations?.addressGaps ? "Yes, briefly mention learning or related experience" : "No")
    .replace("{tone}", customizations?.tone || "enthusiastic");

  try {
    const response = await chat(
      [{ role: "user", content: prompt }],
      { model: "llama3.2", temperature: 0.6 }
    );

    const content = response.trim();
    const wordCount = content.split(/\s+/).length;

    // Run guardrails
    const guardrailCheck = checkGuardrails("", content);

    return {
      content,
      guardrailsPassed: guardrailCheck.passed,
      violations: guardrailCheck.results.flatMap((r) => r.result.violations),
      wordCount,
    };
  } catch (error) {
    console.error("Cover letter generation failed:", error);

    // Fallback template
    const fallbackContent = `I am excited to apply for the ${jobTitle} position at ${company}. With ${yearsExp} years of experience in ${skills.split(",").slice(0, 3).join(", ")}, I believe I can make a meaningful contribution to your team.

Throughout my career, I have developed expertise in ${relevantSkills.slice(0, 3).join(", ")}. ${achievements.split(";")[0] || "I have consistently delivered results in my roles."}.

${company}'s focus on ${responsibilities.split(";")[0] || "innovation"} aligns well with my professional interests and expertise. I am particularly drawn to this opportunity because it allows me to apply my skills while continuing to grow.

I would welcome the opportunity to discuss how my background aligns with your needs. Thank you for considering my application.`;

    return {
      content: fallbackContent,
      guardrailsPassed: true,
      violations: [],
      wordCount: fallbackContent.split(/\s+/).length,
    };
  }
}

// Format cover letter with proper structure
export function formatCoverLetter(
  result: CoverLetterResult,
  recipientName?: string,
  senderName?: string
): string {
  const greeting = recipientName
    ? `Dear ${recipientName},`
    : "Dear Hiring Manager,";

  const closing = senderName
    ? `Sincerely,\n\n${senderName}`
    : "Sincerely,\n\n[Your Name]";

  return `${greeting}

${result.content}

${closing}`;
}
