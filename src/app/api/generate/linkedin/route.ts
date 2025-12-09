import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateLinkedInSummary, formatForLinkedIn } from "@/lib/linkedin-generator";
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
    const { targetRole, tone } = body as {
      targetRole?: string;
      tone?: "professional" | "conversational" | "technical";
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

    // Generate LinkedIn content
    const result = await generateLinkedInSummary({
      careerData,
      targetRole,
      tone,
    });

    // Format for easy copy-paste
    const formatted = formatForLinkedIn(result);

    return NextResponse.json({
      headline: result.headline,
      summary: result.summary,
      formatted,
      guardrailsPassed: result.guardrailsPassed,
      violations: result.violations,
    });
  } catch (err) {
    console.error("LinkedIn generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate LinkedIn content" },
      { status: 500 }
    );
  }
}
