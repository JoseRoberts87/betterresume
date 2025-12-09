import { chat } from "@/lib/ollama";
import { getGuardrailInstructions, checkGuardrails } from "@/lib/content-rewriter/guardrails";
import type { CareerData } from "@/types/json-resume";

export interface LinkedInSummaryOptions {
  careerData: CareerData;
  targetRole?: string;
  tone?: "professional" | "conversational" | "technical";
}

export interface LinkedInSummaryResult {
  summary: string;
  headline: string;
  guardrailsPassed: boolean;
  violations: string[];
}

const LINKEDIN_SUMMARY_PROMPT = `You are a professional LinkedIn profile writer. Generate a LinkedIn "About" section and headline based on the following career data.

${getGuardrailInstructions()}

Additional LinkedIn-specific rules:
- Keep the summary between 150-300 words
- Write in first person
- Be personable but professional
- Focus on value you bring, not just what you've done
- Include a subtle call to action at the end
- The headline should be under 120 characters and highlight your expertise

Career Data:
Name: {name}
Current Role: {currentRole}
Years of Experience: {yearsExp}
Top Skills: {skills}
Key Highlights: {highlights}
Target Role: {targetRole}
Tone: {tone}

Return ONLY valid JSON with this structure (no markdown):
{
  "summary": "Your LinkedIn summary here",
  "headline": "Your LinkedIn headline here"
}`;

export async function generateLinkedInSummary(
  options: LinkedInSummaryOptions
): Promise<LinkedInSummaryResult> {
  const { careerData, targetRole, tone = "professional" } = options;

  // Extract relevant data
  const name = careerData.basics?.name || "Professional";
  const currentWork = careerData.work?.[0];
  const currentRole = currentWork ? `${currentWork.position} at ${currentWork.company}` : "Professional";

  // Calculate years of experience
  const yearsExp = careerData.work?.reduce((total, w) => {
    if (!w.startDate) return total;
    const start = new Date(w.startDate);
    const end = w.endDate ? new Date(w.endDate) : new Date();
    return total + (end.getFullYear() - start.getFullYear());
  }, 0) || 0;

  // Get top skills
  const skills = careerData.skills?.slice(0, 10).map((s) => s.name).join(", ") || "Not specified";

  // Get key highlights from recent work
  const highlights = careerData.work
    ?.slice(0, 2)
    .flatMap((w) => w.highlights?.slice(0, 2) || [])
    .join("; ") || "Not specified";

  const prompt = LINKEDIN_SUMMARY_PROMPT
    .replace("{name}", name)
    .replace("{currentRole}", currentRole)
    .replace("{yearsExp}", String(yearsExp))
    .replace("{skills}", skills)
    .replace("{highlights}", highlights)
    .replace("{targetRole}", targetRole || currentRole)
    .replace("{tone}", tone);

  try {
    const response = await chat(
      [{ role: "user", content: prompt }],
      { model: "llama3.2", temperature: 0.5, format: "json" }
    );

    const parsed = JSON.parse(response);

    // Run guardrails
    const summaryCheck = checkGuardrails("", parsed.summary);
    const headlineCheck = checkGuardrails("", parsed.headline);

    const violations = [
      ...summaryCheck.results.flatMap((r) => r.result.violations),
      ...headlineCheck.results.flatMap((r) => r.result.violations),
    ];

    return {
      summary: parsed.summary,
      headline: parsed.headline,
      guardrailsPassed: violations.length === 0,
      violations,
    };
  } catch (error) {
    console.error("LinkedIn summary generation failed:", error);

    // Fallback to basic template
    const fallbackSummary = `${name} is a ${currentRole} with ${yearsExp}+ years of experience in ${skills.split(",").slice(0, 3).join(", ")}. Passionate about delivering impactful solutions and continuous learning.`;

    const fallbackHeadline = `${currentWork?.position || "Professional"} | ${skills.split(",").slice(0, 3).join(" | ")}`;

    return {
      summary: fallbackSummary,
      headline: fallbackHeadline.slice(0, 120),
      guardrailsPassed: true,
      violations: [],
    };
  }
}

// Generate content optimized for copy-paste to LinkedIn
export function formatForLinkedIn(result: LinkedInSummaryResult): string {
  return `HEADLINE (copy to your LinkedIn headline):
${result.headline}

ABOUT SECTION (copy to your LinkedIn About section):
${result.summary}`;
}
