import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateCoverageMap } from "@/lib/matching";
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

    // Reconstruct parsed job description from stored data
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

    return NextResponse.json({ coverageMap, job: parsedJob });
  } catch (err) {
    console.error("Failed to generate coverage map:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
