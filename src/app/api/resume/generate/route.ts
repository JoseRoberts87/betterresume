import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateResumePDFBase64 } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";
import type { CareerData } from "@/types/json-resume";
import type { TemplateId } from "@/lib/resume-templates";

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
    const { template = "us-tech", jobId } = body as {
      template?: TemplateId;
      jobId?: string;
    };

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

    // Generate PDF
    const pdfBase64 = await generateResumePDFBase64({
      template,
      careerData,
      targetSkills,
    });

    // Generate filename
    const name = careerData.basics?.name?.replace(/\s+/g, "_") || "resume";
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${name}_Resume_${timestamp}.pdf`;

    return NextResponse.json({
      pdf: pdfBase64,
      filename,
      mimeType: "application/pdf",
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
