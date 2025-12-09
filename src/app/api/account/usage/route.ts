import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { canUseFeature, getFeatureSummary, type UserTier } from "@/lib/features";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to check tier
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // Default to free tier - in production, you'd check subscription status
    const tier: UserTier = "free";

    // Get current usage counts
    const [jobCount, resumeCount, documentCount] = await Promise.all([
      prisma.job.count({ where: { userId: user.id } }),
      prisma.resume.count({ where: { userId: user.id } }),
      prisma.document.count({ where: { userId: user.id } }),
    ]);

    // Get today's date for daily limits
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // For daily limits, we'd need to track usage in a separate table
    // For now, return 0 as placeholder
    const dailyRewrites = 0;
    const dailyCoverLetters = 0;
    const dailyLinkedIn = 0;

    // Get feature availability
    const featureSummary = getFeatureSummary(tier);

    const usage = {
      jobs: {
        current: jobCount,
        ...canUseFeature(tier, "maxJobs", jobCount),
      },
      resumes: {
        current: resumeCount,
        ...canUseFeature(tier, "maxResumes", resumeCount),
      },
      documents: {
        current: documentCount,
        ...canUseFeature(tier, "maxDocuments", documentCount),
      },
      llmRewrites: {
        current: dailyRewrites,
        ...canUseFeature(tier, "llmRewritesPerDay", dailyRewrites),
      },
      coverLetters: {
        current: dailyCoverLetters,
        ...canUseFeature(tier, "coverLettersPerDay", dailyCoverLetters),
      },
      linkedInGenerations: {
        current: dailyLinkedIn,
        ...canUseFeature(tier, "linkedInGenerationsPerDay", dailyLinkedIn),
      },
      pdfExports: canUseFeature(tier, "pdfExports"),
      docxExports: canUseFeature(tier, "docxExports"),
      gapQuestions: canUseFeature(tier, "gapQuestions"),
      advancedMatching: canUseFeature(tier, "advancedMatching"),
    };

    return NextResponse.json({
      tier,
      usage,
      limits: featureSummary.limits,
      premiumFeatures: featureSummary.premiumFeatures,
    });
  } catch (err) {
    console.error("Failed to get usage:", err);
    return NextResponse.json(
      { error: "Failed to get usage information" },
      { status: 500 }
    );
  }
}
