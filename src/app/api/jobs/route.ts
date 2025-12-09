import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { parseJobDescription } from "@/lib/jd-parser";
import { isOllamaAvailable } from "@/lib/ollama";
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

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("Failed to get jobs:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { rawDescription } = body;

    if (!rawDescription || typeof rawDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email || "" },
      create: { id: user.id, email: user.email || "" },
    });

    // Check if Ollama is available
    const ollamaAvailable = await isOllamaAvailable();

    // Parse the job description
    const parsed = await parseJobDescription(rawDescription, ollamaAvailable);

    // Save to database
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        rawDescription,
        title: parsed.title,
        company: parsed.company,
        seniorityLevel: parsed.seniorityLevel,
        requiredSkills: parsed.requiredSkills as object,
        preferredSkills: parsed.preferredSkills as object,
        responsibilities: parsed.responsibilities as object,
        requirements: parsed.requirements as object,
      },
    });

    return NextResponse.json({
      success: true,
      job,
      parsed,
      usedLLM: ollamaAvailable,
    });
  } catch (err) {
    console.error("Failed to create job:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
