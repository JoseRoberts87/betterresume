import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateCoverageMap } from "@/lib/matching";
import { generateCoverLetter, formatCoverLetter } from "@/lib/cover-letter-generator";
import { NextResponse } from "next/server";
import type { CareerData } from "@/types/json-resume";
import type { ParsedJobDescription, ExtractedSkill, ExtractedRequirement } from "@/types/job";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, recipientName, emphasizeSkills, addressGaps, tone } = body as {
      jobId: string;
      recipientName?: string;
      emphasizeSkills?: string[];
      addressGaps?: boolean;
      tone?: "formal" | "enthusiastic" | "conversational";
    };

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
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

    // Get job
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const careerData = profile.careerData as CareerData;

    // Reconstruct parsed job description
    const jobDescription: ParsedJobDescription = {
      title: job.title || undefined,
      company: job.company || undefined,
      seniorityLevel: job.seniorityLevel as ParsedJobDescription["seniorityLevel"],
      requiredSkills: (job.requiredSkills as unknown as ExtractedSkill[]) || [],
      preferredSkills: (job.preferredSkills as unknown as ExtractedSkill[]) || [],
      responsibilities: (job.responsibilities as unknown as string[]) || [],
      requirements: (job.requirements as unknown as ExtractedRequirement[]) || [],
    };

    // Generate coverage map for context
    const coverageMap = generateCoverageMap(careerData, jobDescription);

    // Generate cover letter
    const result = await generateCoverLetter({
      careerData,
      jobDescription,
      coverageMap,
      customizations: {
        emphasizeSkills,
        addressGaps,
        tone,
      },
    });

    // Format with greeting and signature
    const formatted = formatCoverLetter(
      result,
      recipientName,
      careerData.basics?.name
    );

    return NextResponse.json({
      content: result.content,
      formatted,
      wordCount: result.wordCount,
      guardrailsPassed: result.guardrailsPassed,
      violations: result.violations,
      matchScore: coverageMap.overallScore,
    });
  } catch (err) {
    console.error("Cover letter generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
