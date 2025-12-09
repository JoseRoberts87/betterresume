import { chat } from "@/lib/ollama";
import { checkGuardrails, getGuardrailInstructions } from "./guardrails";
import type { WorkExperience, Project } from "@/types/json-resume";
import type { ExtractedSkill } from "@/types/job";

export interface RewriteRequest {
  type: "bullet" | "summary" | "description";
  content: string;
  context?: {
    jobTitle?: string;
    company?: string;
    targetRole?: string;
    targetSkills?: ExtractedSkill[];
  };
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  guardrailsPassed: boolean;
  violations: string[];
  warnings: string[];
  needsUserConfirmation: boolean;
  confirmationReason?: string;
}

export interface MetricConfirmation {
  metric: string;
  original: string;
  question: string;
}

// Prompt for rewriting bullet points
const BULLET_REWRITE_PROMPT = `You are a professional resume writer. Rewrite the following bullet point to be more impactful for a resume.

${getGuardrailInstructions()}

Context:
- Job Title: {jobTitle}
- Company: {company}
- Target Role: {targetRole}
- Target Skills to Highlight (if naturally applicable): {targetSkills}

Original bullet point:
{content}

Return ONLY the rewritten bullet point, nothing else. No explanations, no quotes, just the improved text.`;

// Prompt for rewriting summaries
const SUMMARY_REWRITE_PROMPT = `You are a professional resume writer. Rewrite the following professional summary to be more compelling.

${getGuardrailInstructions()}

Target Role: {targetRole}
Target Skills to Naturally Incorporate: {targetSkills}

Original summary:
{content}

Return ONLY the rewritten summary (2-3 sentences max), nothing else.`;

// Prompt for rewriting descriptions
const DESCRIPTION_REWRITE_PROMPT = `You are a professional resume writer. Rewrite the following description to be more professional and clear.

${getGuardrailInstructions()}

Original description:
{content}

Return ONLY the rewritten description, nothing else.`;

// Check if content contains metrics that need user confirmation
function detectMetricsNeedingConfirmation(original: string, rewritten: string): MetricConfirmation[] {
  const confirmations: MetricConfirmation[] = [];

  // Check for vague performance claims that could be quantified
  const vaguePerformancePatterns = [
    { pattern: /improv(?:ed|ing)\s+(?:the\s+)?(\w+)/gi, type: "improvement" },
    { pattern: /increas(?:ed|ing)\s+(?:the\s+)?(\w+)/gi, type: "increase" },
    { pattern: /reduc(?:ed|ing)\s+(?:the\s+)?(\w+)/gi, type: "reduction" },
    { pattern: /sav(?:ed|ing)\s+(?:the\s+)?(?:company\s+)?(\w+)/gi, type: "savings" },
    { pattern: /grow(?:ing|n|th)\s+(?:of\s+)?(?:the\s+)?(\w+)/gi, type: "growth" },
  ];

  for (const { pattern, type } of vaguePerformancePatterns) {
    const matches = rewritten.match(pattern);
    if (matches) {
      // Check if there's no specific number attached
      for (const match of matches) {
        if (!/\d+/.test(match)) {
          confirmations.push({
            metric: match,
            original: original,
            question: `You mentioned "${match}". Do you have a specific number or percentage to quantify this ${type}?`,
          });
        }
      }
    }
  }

  return confirmations;
}

// Rewrite a single piece of content
export async function rewriteContent(request: RewriteRequest): Promise<RewriteResult> {
  let prompt: string;

  switch (request.type) {
    case "bullet":
      prompt = BULLET_REWRITE_PROMPT
        .replace("{jobTitle}", request.context?.jobTitle || "Not specified")
        .replace("{company}", request.context?.company || "Not specified")
        .replace("{targetRole}", request.context?.targetRole || "Not specified")
        .replace("{targetSkills}", request.context?.targetSkills?.map((s) => s.name).join(", ") || "None specified")
        .replace("{content}", request.content);
      break;
    case "summary":
      prompt = SUMMARY_REWRITE_PROMPT
        .replace("{targetRole}", request.context?.targetRole || "Not specified")
        .replace("{targetSkills}", request.context?.targetSkills?.map((s) => s.name).join(", ") || "None specified")
        .replace("{content}", request.content);
      break;
    case "description":
      prompt = DESCRIPTION_REWRITE_PROMPT.replace("{content}", request.content);
      break;
  }

  try {
    const response = await chat(
      [{ role: "user", content: prompt }],
      { model: "llama3.2", temperature: 0.3 }
    );

    const rewritten = response.trim();

    // Run guardrails
    const guardrailCheck = checkGuardrails(request.content, rewritten);

    // Check for metrics needing confirmation
    const metricsToConfirm = detectMetricsNeedingConfirmation(request.content, rewritten);

    return {
      original: request.content,
      rewritten,
      guardrailsPassed: guardrailCheck.passed,
      violations: guardrailCheck.results.flatMap((r) => r.result.violations),
      warnings: guardrailCheck.results.flatMap((r) => r.result.warnings),
      needsUserConfirmation: metricsToConfirm.length > 0,
      confirmationReason: metricsToConfirm.length > 0
        ? metricsToConfirm.map((m) => m.question).join(" ")
        : undefined,
    };
  } catch (error) {
    console.error("Content rewrite failed:", error);
    // Return original content on failure
    return {
      original: request.content,
      rewritten: request.content,
      guardrailsPassed: true,
      violations: [],
      warnings: ["Rewrite failed, returning original content"],
      needsUserConfirmation: false,
    };
  }
}

// Rewrite with automatic retry if guardrails fail
export async function rewriteContentWithRetry(
  request: RewriteRequest,
  maxRetries: number = 2
): Promise<RewriteResult> {
  let lastResult: RewriteResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await rewriteContent(request);
    lastResult = result;

    if (result.guardrailsPassed) {
      return result;
    }

    // If guardrails failed, add violations to the next prompt as warnings
    if (attempt < maxRetries) {
      console.log(`Guardrail violation on attempt ${attempt + 1}, retrying...`);
      // Add violation feedback to the content for next attempt
      request = {
        ...request,
        content: `${request.content}\n\nIMPORTANT: Previous rewrite violated these rules: ${result.violations.join("; ")}. Please rewrite avoiding these issues.`,
      };
    }
  }

  // Return last result even if guardrails failed
  return lastResult!;
}

// Rewrite all highlights for a work experience
export async function rewriteWorkExperience(
  work: WorkExperience,
  targetRole?: string,
  targetSkills?: ExtractedSkill[]
): Promise<{
  original: WorkExperience;
  rewritten: WorkExperience;
  bulletResults: RewriteResult[];
}> {
  const bulletResults: RewriteResult[] = [];

  const rewrittenHighlights: string[] = [];
  for (const highlight of work.highlights || []) {
    const result = await rewriteContentWithRetry({
      type: "bullet",
      content: highlight,
      context: {
        jobTitle: work.position,
        company: work.company,
        targetRole,
        targetSkills,
      },
    });
    bulletResults.push(result);
    rewrittenHighlights.push(result.rewritten);
  }

  // Rewrite summary if present
  let rewrittenSummary = work.summary;
  if (work.summary) {
    const summaryResult = await rewriteContentWithRetry({
      type: "summary",
      content: work.summary,
      context: {
        jobTitle: work.position,
        company: work.company,
        targetRole,
        targetSkills,
      },
    });
    bulletResults.push(summaryResult);
    rewrittenSummary = summaryResult.rewritten;
  }

  return {
    original: work,
    rewritten: {
      ...work,
      highlights: rewrittenHighlights,
      summary: rewrittenSummary,
    },
    bulletResults,
  };
}

// Rewrite project description
export async function rewriteProject(
  project: Project,
  targetSkills?: ExtractedSkill[]
): Promise<{
  original: Project;
  rewritten: Project;
  results: RewriteResult[];
}> {
  const results: RewriteResult[] = [];

  let rewrittenDescription = project.description;
  if (project.description) {
    const descResult = await rewriteContentWithRetry({
      type: "description",
      content: project.description,
      context: { targetSkills },
    });
    results.push(descResult);
    rewrittenDescription = descResult.rewritten;
  }

  const rewrittenHighlights: string[] = [];
  for (const highlight of project.highlights || []) {
    const result = await rewriteContentWithRetry({
      type: "bullet",
      content: highlight,
      context: { targetSkills },
    });
    results.push(result);
    rewrittenHighlights.push(result.rewritten);
  }

  return {
    original: project,
    rewritten: {
      ...project,
      description: rewrittenDescription,
      highlights: rewrittenHighlights,
    },
    results,
  };
}

// Generate a professional summary based on career data
export async function generateProfessionalSummary(
  currentRole: string,
  yearsExperience: number,
  topSkills: string[],
  targetRole?: string
): Promise<RewriteResult> {
  const prompt = `You are a professional resume writer. Generate a 2-3 sentence professional summary for someone with:

${getGuardrailInstructions()}

Current Role: ${currentRole}
Years of Experience: ${yearsExperience}
Top Skills: ${topSkills.join(", ")}
Target Role: ${targetRole || currentRole}

Write a factual, concise summary. Do not fabricate accomplishments. Focus on role and skills.
Return ONLY the summary, nothing else.`;

  try {
    const response = await chat(
      [{ role: "user", content: prompt }],
      { model: "llama3.2", temperature: 0.4 }
    );

    const summary = response.trim();

    // Guardrails check - use empty string for original since this is generated
    // We still check for inflation and forbidden patterns
    const guardrailCheck = checkGuardrails("", summary);

    return {
      original: "",
      rewritten: summary,
      guardrailsPassed: guardrailCheck.passed,
      violations: guardrailCheck.results.flatMap((r) => r.result.violations),
      warnings: guardrailCheck.results.flatMap((r) => r.result.warnings),
      needsUserConfirmation: false,
    };
  } catch (error) {
    console.error("Summary generation failed:", error);
    return {
      original: "",
      rewritten: `${currentRole} with ${yearsExperience} years of experience in ${topSkills.slice(0, 3).join(", ")}.`,
      guardrailsPassed: true,
      violations: [],
      warnings: ["Generation failed, using basic template"],
      needsUserConfirmation: false,
    };
  }
}
