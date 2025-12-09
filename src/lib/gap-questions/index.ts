import { chat } from "@/lib/ollama";
import type { CoverageMap, CoverageItem } from "@/lib/matching";
import type { CareerData } from "@/types/json-resume";

export interface GapQuestion {
  id: string;
  skillName: string;
  question: string;
  context: string;
  questionType: "experience" | "project" | "training" | "transferable";
  suggestedAnswerFormat?: string;
  priority: "P1" | "P2" | "P3" | "P4";
}

export interface GapQuestionResponse {
  questionId: string;
  answer: string;
  hasExperience: boolean;
  yearsOfExperience?: number;
  context?: string;
}

export interface GapAnalysis {
  questions: GapQuestion[];
  totalGaps: number;
  criticalGaps: number; // P1 gaps
  addressableGaps: number; // Gaps that might be filled with more info
}

// Question templates for different gap types
const QUESTION_TEMPLATES = {
  experience: [
    "Have you worked with {skill} in any professional capacity, even if it wasn't a primary responsibility?",
    "Did any of your previous roles involve {skill}, perhaps as a secondary tool or technology?",
    "Have you used {skill} to solve problems in your work, even informally?",
  ],
  project: [
    "Have you built any personal or side projects using {skill}?",
    "Did any academic or bootcamp projects involve {skill}?",
    "Have you contributed to open source projects that use {skill}?",
  ],
  training: [
    "Have you completed any courses, certifications, or training programs for {skill}?",
    "Are you currently learning {skill}? If so, what's your progress?",
    "Have you attended workshops, bootcamps, or conferences focused on {skill}?",
  ],
  transferable: [
    "Have you worked with technologies similar to {skill}? The skills may transfer.",
    "Do you have experience with {relatedSkills} which are related to {skill}?",
    "Have you solved similar problems to those that {skill} addresses, using different tools?",
  ],
};

// Generate a unique ID for questions
function generateQuestionId(skill: string, type: string): string {
  return `gap-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${type}-${Date.now()}`;
}

// Rule-based gap question generation
export function generateGapQuestionsRuleBased(
  coverageMap: CoverageMap,
  careerData: CareerData
): GapAnalysis {
  const gaps = coverageMap.items.filter((item) => item.status === "GAP");
  const partials = coverageMap.items.filter((item) => item.status === "PARTIAL");
  const questions: GapQuestion[] = [];

  // Process gaps - need questions for these
  for (const gap of gaps) {
    // Always ask about work experience
    questions.push({
      id: generateQuestionId(gap.requirement, "experience"),
      skillName: gap.requirement,
      question: QUESTION_TEMPLATES.experience[0].replace("{skill}", gap.requirement),
      context: `This ${gap.priority === "P1" ? "required" : "preferred"} skill has no matching evidence in your profile.`,
      questionType: "experience",
      suggestedAnswerFormat: "Describe when and how you used this skill professionally.",
      priority: gap.priority,
    });

    // Ask about projects for technical skills
    if (gap.category === "skill") {
      questions.push({
        id: generateQuestionId(gap.requirement, "project"),
        skillName: gap.requirement,
        question: QUESTION_TEMPLATES.project[0].replace("{skill}", gap.requirement),
        context: "Personal or academic projects can demonstrate practical knowledge.",
        questionType: "project",
        suggestedAnswerFormat: "Describe the project, your role, and how you used this skill.",
        priority: gap.priority,
      });
    }

    // For critical gaps (P1), also ask about training
    if (gap.priority === "P1") {
      questions.push({
        id: generateQuestionId(gap.requirement, "training"),
        skillName: gap.requirement,
        question: QUESTION_TEMPLATES.training[0].replace("{skill}", gap.requirement),
        context: "Formal training or certifications can help address this critical skill gap.",
        questionType: "training",
        suggestedAnswerFormat: "Include course name, provider, and completion date if applicable.",
        priority: gap.priority,
      });
    }
  }

  // Process partials - might be able to strengthen these
  for (const partial of partials) {
    if (partial.evidence.some((e) => e.startsWith("Related:"))) {
      questions.push({
        id: generateQuestionId(partial.requirement, "transferable"),
        skillName: partial.requirement,
        question: `You have experience with related technologies. Have you worked directly with ${partial.requirement}?`,
        context: `We found related experience: ${partial.evidence.join(", ")}`,
        questionType: "transferable",
        suggestedAnswerFormat: "Describe any direct experience, even brief.",
        priority: partial.priority,
      });
    }
  }

  // Sort by priority
  questions.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return {
    questions,
    totalGaps: gaps.length,
    criticalGaps: gaps.filter((g) => g.priority === "P1").length,
    addressableGaps: gaps.length + partials.filter((p) => p.evidence.some((e) => e.startsWith("Related:"))).length,
  };
}

// LLM-powered gap question generation for more contextual questions
const GAP_QUESTION_PROMPT = `You are helping a job seeker identify hidden experience. Given a skill gap and their background, generate ONE targeted question to uncover relevant experience they may have overlooked.

Rules:
- Be specific and context-aware
- Reference their existing experience when possible
- Focus on practical experience, not theoretical knowledge
- Don't assume they lack the skill - help them recall relevant experience
- Keep questions concise and direct

Return ONLY valid JSON:
{
  "question": "Your question here",
  "context": "Brief explanation of why this question matters",
  "suggestedAnswerFormat": "What kind of answer would be helpful"
}

Skill Gap: {skill}
Priority: {priority}
User's Background Summary:
- Current/Recent Role: {currentRole}
- Years of Experience: {yearsExp}
- Known Skills: {skills}
- Recent Projects: {projects}
`;

export async function generateGapQuestionsWithLLM(
  coverageMap: CoverageMap,
  careerData: CareerData
): Promise<GapAnalysis> {
  const gaps = coverageMap.items.filter((item) => item.status === "GAP");
  const partials = coverageMap.items.filter((item) => item.status === "PARTIAL");

  // Prepare user context
  const currentRole = careerData.work?.[0]
    ? `${careerData.work[0].position} at ${careerData.work[0].company}`
    : "Not specified";

  const yearsExp = careerData.work?.reduce((total, w) => {
    if (!w.startDate) return total;
    const start = new Date(w.startDate);
    const end = w.endDate ? new Date(w.endDate) : new Date();
    return total + (end.getFullYear() - start.getFullYear());
  }, 0) || 0;

  const skills = careerData.skills?.slice(0, 10).map((s) => s.name).join(", ") || "Not specified";

  const projects = careerData.projects?.slice(0, 3).map((p) => p.name).join(", ") || "None listed";

  const questions: GapQuestion[] = [];

  // Generate LLM questions for critical gaps only (to limit API calls)
  const criticalGaps = gaps.filter((g) => g.priority === "P1").slice(0, 5);

  for (const gap of criticalGaps) {
    try {
      const prompt = GAP_QUESTION_PROMPT
        .replace("{skill}", gap.requirement)
        .replace("{priority}", gap.priority)
        .replace("{currentRole}", currentRole)
        .replace("{yearsExp}", String(yearsExp))
        .replace("{skills}", skills)
        .replace("{projects}", projects);

      const response = await chat(
        [{ role: "user", content: prompt }],
        { model: "llama3.2", temperature: 0.7, format: "json" }
      );

      const parsed = JSON.parse(response);

      questions.push({
        id: generateQuestionId(gap.requirement, "llm"),
        skillName: gap.requirement,
        question: parsed.question,
        context: parsed.context,
        questionType: "experience",
        suggestedAnswerFormat: parsed.suggestedAnswerFormat,
        priority: gap.priority,
      });
    } catch (error) {
      console.error(`Failed to generate LLM question for ${gap.requirement}:`, error);
      // Fall back to template question
      questions.push({
        id: generateQuestionId(gap.requirement, "fallback"),
        skillName: gap.requirement,
        question: QUESTION_TEMPLATES.experience[0].replace("{skill}", gap.requirement),
        context: `This required skill has no matching evidence in your profile.`,
        questionType: "experience",
        suggestedAnswerFormat: "Describe when and how you used this skill professionally.",
        priority: gap.priority,
      });
    }
  }

  // Add rule-based questions for non-critical gaps
  const ruleBasedAnalysis = generateGapQuestionsRuleBased(coverageMap, careerData);
  const nonCriticalQuestions = ruleBasedAnalysis.questions.filter(
    (q) => q.priority !== "P1" || !criticalGaps.some((g) => g.requirement === q.skillName)
  );

  questions.push(...nonCriticalQuestions);

  // Sort by priority
  questions.sort((a, b) => {
    const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return {
    questions,
    totalGaps: gaps.length,
    criticalGaps: gaps.filter((g) => g.priority === "P1").length,
    addressableGaps: gaps.length + partials.filter((p) => p.evidence.some((e) => e.startsWith("Related:"))).length,
  };
}

// Main function - uses LLM with fallback to rule-based
export async function generateGapQuestions(
  coverageMap: CoverageMap,
  careerData: CareerData,
  useLLM: boolean = true
): Promise<GapAnalysis> {
  if (useLLM) {
    try {
      return await generateGapQuestionsWithLLM(coverageMap, careerData);
    } catch (error) {
      console.error("LLM gap question generation failed, using rule-based:", error);
      return generateGapQuestionsRuleBased(coverageMap, careerData);
    }
  }
  return generateGapQuestionsRuleBased(coverageMap, careerData);
}

// Process user responses to gap questions
export function processGapResponses(
  responses: GapQuestionResponse[],
  careerData: CareerData
): CareerData {
  const updatedCareerData = { ...careerData };

  for (const response of responses) {
    if (!response.hasExperience || !response.answer.trim()) {
      continue;
    }

    // Extract skill name from question ID
    const skillMatch = response.questionId.match(/^gap-([^-]+(?:-[^-]+)*)-/);
    if (!skillMatch) continue;

    const skillName = skillMatch[1].replace(/-/g, " ");

    // Add to skills if not present
    if (!updatedCareerData.skills) {
      updatedCareerData.skills = [];
    }

    const existingSkill = updatedCareerData.skills.find(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );

    if (!existingSkill) {
      updatedCareerData.skills.push({
        name: skillName,
        level: response.yearsOfExperience && response.yearsOfExperience >= 3 ? "advanced" : "intermediate",
        keywords: [],
      });
    }

    // If there's detailed context, add it as additional information
    // This could be stored in a new field or processed for resume generation
  }

  return updatedCareerData;
}
