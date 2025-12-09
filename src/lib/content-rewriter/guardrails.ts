// Content Guardrails for Resume Generation
// These rules ensure the LLM never fabricates, inflates, or misrepresents user data

export interface Guardrail {
  id: string;
  name: string;
  description: string;
  check: (original: string, rewritten: string) => GuardrailResult;
}

export interface GuardrailResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}

// Forbidden words/phrases that indicate semantic inflation
const INFLATION_PATTERNS = [
  /\bexpert\b/gi,
  /\bworld-class\b/gi,
  /\bpioneer(?:ed|ing)?\b/gi,
  /\brevolutioniz(?:ed|ing)?\b/gi,
  /\btransform(?:ed|ing|ative)?\b/gi,
  /\binnovative\b/gi,
  /\bcutting-edge\b/gi,
  /\bground-?breaking\b/gi,
  /\bunparalleled\b/gi,
  /\bexceptional(?:ly)?\b/gi,
  /\boutstanding\b/gi,
  /\bremarkable\b/gi,
  /\bextraordinary\b/gi,
  /\bstrategic(?:ally)?\b/gi,
];

// Forbidden punctuation/formatting
const FORBIDDEN_PUNCTUATION = [
  /—/g, // em-dash (use hyphen instead)
  /–/g, // en-dash (use hyphen instead)
];

// Check for fabricated metrics (numbers not in original)
function extractNumbers(text: string): Set<string> {
  const numbers = new Set<string>();
  // Match percentages
  const percentages = text.match(/\d+(?:\.\d+)?%/g) || [];
  percentages.forEach((p) => numbers.add(p));

  // Match dollar amounts
  const dollars = text.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|M|B|K))?/gi) || [];
  dollars.forEach((d) => numbers.add(d.toLowerCase()));

  // Match standalone numbers with context
  const standaloneNumbers = text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  standaloneNumbers.forEach((n) => numbers.add(n));

  return numbers;
}

// Check for fabricated skills (skills not mentioned in original)
function extractSkillMentions(text: string): Set<string> {
  const skills = new Set<string>();
  const techPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Angular|Vue|Next\.?js|Node\.?js|Express|Django|Flask|Spring|Rails)\b/gi,
    /\b(AWS|Azure|GCP|Kubernetes|Docker|Terraform)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch)\b/gi,
  ];

  for (const pattern of techPatterns) {
    const matches = text.match(pattern) || [];
    matches.forEach((m) => skills.add(m.toLowerCase()));
  }

  return skills;
}

// Core guardrails
export const GUARDRAILS: Guardrail[] = [
  {
    id: "no-fabrication",
    name: "No Fabrication",
    description: "Content must not introduce information not present in the original",
    check: (original, rewritten) => {
      const violations: string[] = [];
      const warnings: string[] = [];

      // Check for fabricated metrics
      const originalNumbers = extractNumbers(original);
      const rewrittenNumbers = extractNumbers(rewritten);

      for (const num of rewrittenNumbers) {
        if (!originalNumbers.has(num)) {
          violations.push(`Fabricated metric detected: "${num}" not found in original content`);
        }
      }

      // Check for fabricated skills
      const originalSkills = extractSkillMentions(original);
      const rewrittenSkills = extractSkillMentions(rewritten);

      for (const skill of rewrittenSkills) {
        if (!originalSkills.has(skill)) {
          violations.push(`Fabricated skill detected: "${skill}" not mentioned in original content`);
        }
      }

      return {
        passed: violations.length === 0,
        violations,
        warnings,
      };
    },
  },
  {
    id: "no-semantic-inflation",
    name: "No Semantic Inflation",
    description: "Content must not use inflated or exaggerated language",
    check: (original, rewritten) => {
      const violations: string[] = [];
      const warnings: string[] = [];

      for (const pattern of INFLATION_PATTERNS) {
        const matches = rewritten.match(pattern);
        if (matches) {
          // Check if the word was in the original
          const originalMatches = original.match(pattern);
          if (!originalMatches || originalMatches.length < matches.length) {
            violations.push(`Semantic inflation detected: "${matches[0]}" - avoid superlatives and inflated language`);
          }
        }
      }

      return {
        passed: violations.length === 0,
        violations,
        warnings,
      };
    },
  },
  {
    id: "no-forbidden-punctuation",
    name: "No Forbidden Punctuation",
    description: "Content must not use em-dashes or other forbidden punctuation",
    check: (original, rewritten) => {
      const violations: string[] = [];
      const warnings: string[] = [];

      for (const pattern of FORBIDDEN_PUNCTUATION) {
        if (pattern.test(rewritten)) {
          violations.push(`Forbidden punctuation detected: em-dash or en-dash (use hyphen instead)`);
        }
      }

      return {
        passed: violations.length === 0,
        violations,
        warnings,
      };
    },
  },
  {
    id: "no-seniority-inflation",
    name: "No Seniority Inflation",
    description: "Content must not inflate job titles or seniority levels",
    check: (original, rewritten) => {
      const violations: string[] = [];
      const warnings: string[] = [];

      const seniorityTerms = ["Senior", "Lead", "Principal", "Staff", "Director", "VP", "CTO", "CEO"];

      for (const term of seniorityTerms) {
        const originalCount = (original.match(new RegExp(`\\b${term}\\b`, "gi")) || []).length;
        const rewrittenCount = (rewritten.match(new RegExp(`\\b${term}\\b`, "gi")) || []).length;

        if (rewrittenCount > originalCount) {
          violations.push(`Seniority inflation detected: "${term}" appears more in rewritten content`);
        }
      }

      return {
        passed: violations.length === 0,
        violations,
        warnings,
      };
    },
  },
  {
    id: "length-check",
    name: "Length Check",
    description: "Rewritten content should not be significantly longer than original",
    check: (original, rewritten) => {
      const violations: string[] = [];
      const warnings: string[] = [];

      const originalWords = original.split(/\s+/).length;
      const rewrittenWords = rewritten.split(/\s+/).length;

      // Allow up to 50% increase
      if (rewrittenWords > originalWords * 1.5) {
        warnings.push(`Content length increased significantly: ${originalWords} -> ${rewrittenWords} words`);
      }

      // Flag if more than doubled
      if (rewrittenWords > originalWords * 2) {
        violations.push(`Content length more than doubled: ${originalWords} -> ${rewrittenWords} words`);
      }

      return {
        passed: violations.length === 0,
        violations,
        warnings,
      };
    },
  },
];

// Run all guardrails against content
export function checkGuardrails(
  original: string,
  rewritten: string
): {
  passed: boolean;
  results: { guardrail: string; result: GuardrailResult }[];
  totalViolations: number;
  totalWarnings: number;
} {
  const results: { guardrail: string; result: GuardrailResult }[] = [];
  let totalViolations = 0;
  let totalWarnings = 0;

  for (const guardrail of GUARDRAILS) {
    const result = guardrail.check(original, rewritten);
    results.push({ guardrail: guardrail.name, result });
    totalViolations += result.violations.length;
    totalWarnings += result.warnings.length;
  }

  return {
    passed: totalViolations === 0,
    results,
    totalViolations,
    totalWarnings,
  };
}

// Generate guardrail instructions for LLM prompt
export function getGuardrailInstructions(): string {
  return `
CRITICAL CONTENT RULES - YOU MUST FOLLOW THESE EXACTLY:

1. NEVER FABRICATE: Do not add metrics, percentages, dollar amounts, or skills that are not explicitly mentioned in the source material. If a user says they "improved performance", do not add "by 40%" unless they specified that number.

2. NO SEMANTIC INFLATION: Avoid these words and similar superlatives:
   - expert, world-class, pioneer, revolutionary, transformative
   - innovative, cutting-edge, ground-breaking, unparalleled
   - exceptional, outstanding, remarkable, extraordinary
   Instead use factual, understated language.

3. NO EM-DASHES OR EN-DASHES: Use hyphens (-) only. Never use — or –.

4. NO SENIORITY INFLATION: Do not add or elevate titles like "Senior", "Lead", "Principal", etc. unless they appear in the source.

5. PRESERVE ORIGINAL MEANING: The rewritten content must convey the same information as the original, just more clearly and concisely.

6. ATTRIBUTE SKILLS: Only mention skills that the user has demonstrated through actual experience.

7. NO EMOJIS: Never include emojis in professional content.

8. KEEP IT CONCISE: Rewritten content should be similar in length to the original, not significantly longer.
`.trim();
}
