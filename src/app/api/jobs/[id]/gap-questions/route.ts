import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateCoverageMap } from "@/lib/matching";
import { generateGapQuestions, processGapResponses, type GapQuestionResponse } from "@/lib/gap-questions";
import { NextResponse } from "next/server";
import type { CareerData } from "@/types/json-resume";
import type { ParsedJobDescription, ExtractedSkill, ExtractedRequirement } from "@/types/job";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get job
    const job = await prisma.job.findFirst({
      where: { id, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || !profile.careerData) {
      return NextResponse.json(
        { error: "Please complete your profile first" },
        { status: 400 }
      );
    }

    // Reconstruct parsed job description
    const parsedJob: ParsedJobDescription = {
      title: job.title || undefined,
      company: job.company || undefined,
      seniorityLevel: job.seniorityLevel as ParsedJobDescription["seniorityLevel"],
      requiredSkills: (job.requiredSkills as unknown as ExtractedSkill[]) || [],
      preferredSkills: (job.preferredSkills as unknown as ExtractedSkill[]) || [],
      responsibilities: (job.responsibilities as unknown as string[]) || [],
      requirements: (job.requirements as unknown as ExtractedRequirement[]) || [],
    };

    // Generate coverage map
    const coverageMap = generateCoverageMap(
      profile.careerData as CareerData,
      parsedJob
    );

    // Check if LLM should be used (from query param)
    const url = new URL(request.url);
    const useLLM = url.searchParams.get("useLLM") !== "false";

    // Generate gap questions
    const gapAnalysis = await generateGapQuestions(
      coverageMap,
      profile.careerData as CareerData,
      useLLM
    );

    return NextResponse.json({
      gapAnalysis,
      coverageMap: {
        overallScore: coverageMap.overallScore,
        totalGaps: gapAnalysis.totalGaps,
        criticalGaps: gapAnalysis.criticalGaps,
      },
    });
  } catch (err) {
    console.error("Failed to generate gap questions:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to submit gap question responses
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { responses } = body as { responses: GapQuestionResponse[] };

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Get job to verify ownership
    const job = await prisma.job.findFirst({
      where: { id, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || !profile.careerData) {
      return NextResponse.json(
        { error: "Please complete your profile first" },
        { status: 400 }
      );
    }

    // Process responses and update career data
    const updatedCareerData = processGapResponses(
      responses,
      profile.careerData as CareerData
    );

    // Update profile with new career data
    await prisma.profile.update({
      where: { userId: user.id },
      data: { careerData: JSON.parse(JSON.stringify(updatedCareerData)) },
    });

    // Regenerate coverage map with updated data
    const parsedJob: ParsedJobDescription = {
      title: job.title || undefined,
      company: job.company || undefined,
      seniorityLevel: job.seniorityLevel as ParsedJobDescription["seniorityLevel"],
      requiredSkills: (job.requiredSkills as unknown as ExtractedSkill[]) || [],
      preferredSkills: (job.preferredSkills as unknown as ExtractedSkill[]) || [],
      responsibilities: (job.responsibilities as unknown as string[]) || [],
      requirements: (job.requirements as unknown as ExtractedRequirement[]) || [],
    };

    const newCoverageMap = generateCoverageMap(updatedCareerData, parsedJob);

    return NextResponse.json({
      success: true,
      message: "Gap responses processed successfully",
      newScore: newCoverageMap.overallScore,
      skillsAdded: responses.filter((r) => r.hasExperience).length,
    });
  } catch (err) {
    console.error("Failed to process gap responses:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
