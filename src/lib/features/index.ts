// Feature gating system for free vs premium tiers

export type UserTier = "free" | "premium";

export interface FeatureLimits {
  maxJobs: number;
  maxResumes: number;
  maxDocuments: number;
  llmRewritesPerDay: number;
  coverLettersPerDay: number;
  linkedInGenerationsPerDay: number;
  pdfExports: boolean;
  docxExports: boolean;
  gapQuestions: boolean;
  advancedMatching: boolean;
}

export const TIER_LIMITS: Record<UserTier, FeatureLimits> = {
  free: {
    maxJobs: 3,
    maxResumes: 1,
    maxDocuments: 3,
    llmRewritesPerDay: 10,
    coverLettersPerDay: 1,
    linkedInGenerationsPerDay: 1,
    pdfExports: true,
    docxExports: false, // Premium only
    gapQuestions: true,
    advancedMatching: false, // Premium only
  },
  premium: {
    maxJobs: -1, // Unlimited
    maxResumes: -1, // Unlimited
    maxDocuments: -1, // Unlimited
    llmRewritesPerDay: -1, // Unlimited
    coverLettersPerDay: -1, // Unlimited
    linkedInGenerationsPerDay: -1, // Unlimited
    pdfExports: true,
    docxExports: true,
    gapQuestions: true,
    advancedMatching: true,
  },
};

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeMessage?: string;
}

export const FEATURE_DESCRIPTIONS: Record<keyof FeatureLimits, string> = {
  maxJobs: "Job descriptions you can save",
  maxResumes: "Resume versions you can create",
  maxDocuments: "Documents you can upload",
  llmRewritesPerDay: "AI-powered content rewrites per day",
  coverLettersPerDay: "Cover letters generated per day",
  linkedInGenerationsPerDay: "LinkedIn summaries generated per day",
  pdfExports: "Export resumes to PDF",
  docxExports: "Export resumes to DOCX (editable)",
  gapQuestions: "Gap analysis and questions",
  advancedMatching: "Advanced skill matching with semantic analysis",
};

// Check if a feature is available for a user tier
export function canUseFeature(
  tier: UserTier,
  feature: keyof FeatureLimits,
  currentUsage?: number
): FeatureCheckResult {
  const limits = TIER_LIMITS[tier];
  const limit = limits[feature];

  // Boolean features
  if (typeof limit === "boolean") {
    if (limit) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `${FEATURE_DESCRIPTIONS[feature]} is a premium feature`,
      upgradeMessage: "Upgrade to Premium to unlock this feature",
    };
  }

  // Unlimited (-1)
  if (limit === -1) {
    return { allowed: true };
  }

  // Limited features
  if (currentUsage !== undefined && currentUsage >= limit) {
    return {
      allowed: false,
      reason: `You've reached your ${FEATURE_DESCRIPTIONS[feature].toLowerCase()} limit`,
      currentUsage,
      limit,
      upgradeMessage: `Upgrade to Premium for unlimited ${FEATURE_DESCRIPTIONS[feature].toLowerCase()}`,
    };
  }

  return {
    allowed: true,
    currentUsage,
    limit,
  };
}

// Get remaining usage for a limited feature
export function getRemainingUsage(
  tier: UserTier,
  feature: keyof FeatureLimits,
  currentUsage: number
): number {
  const limits = TIER_LIMITS[tier];
  const limit = limits[feature];

  if (typeof limit === "boolean" || limit === -1) {
    return -1; // Unlimited
  }

  return Math.max(0, limit - currentUsage);
}

// Get user's feature summary
export function getFeatureSummary(tier: UserTier): {
  tier: UserTier;
  limits: FeatureLimits;
  premiumFeatures: string[];
} {
  const limits = TIER_LIMITS[tier];
  const premiumFeatures: string[] = [];

  if (tier === "free") {
    // List features that would be unlocked with premium
    const premiumLimits = TIER_LIMITS.premium;

    for (const [key, value] of Object.entries(limits)) {
      const feature = key as keyof FeatureLimits;
      const premiumValue = premiumLimits[feature];

      if (typeof value === "boolean" && !value && premiumValue === true) {
        premiumFeatures.push(FEATURE_DESCRIPTIONS[feature]);
      } else if (typeof value === "number" && value !== -1 && premiumValue === -1) {
        premiumFeatures.push(`Unlimited ${FEATURE_DESCRIPTIONS[feature].toLowerCase()}`);
      }
    }
  }

  return {
    tier,
    limits,
    premiumFeatures,
  };
}
