import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateResumeDOCX } from "@/lib/docx-generator";
import { NextResponse } from "next/server";
import type { CareerData } from "@/types/json-resume";

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
    const { jobId } = body as { jobId?: string };

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

    const careerData = profile.careerData as CareerData;

    // If jobId provided, get target skills from that job
    let targetSkills: string[] = [];
    if (jobId) {
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId: user.id },
      });
      if (job) {
        const requiredSkills = (job.requiredSkills as { name: string }[]) || [];
        const preferredSkills = (job.preferredSkills as { name: string }[]) || [];
        targetSkills = [
          ...requiredSkills.map((s) => s.name),
          ...preferredSkills.map((s) => s.name),
        ];
      }
    }

    // Generate DOCX
    const { buffer, filename } = await generateResumeDOCX({
      careerData,
      targetSkills,
    });

    return NextResponse.json({
      docx: buffer.toString("base64"),
      filename,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } catch (err) {
    console.error("DOCX generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
