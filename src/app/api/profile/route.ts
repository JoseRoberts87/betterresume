import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { CareerData } from "@/types/json-resume";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Failed to get profile:", err);
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
    const careerData = body.careerData as CareerData;

    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email || "" },
      create: { id: user.id, email: user.email || "" },
    });

    // Upsert profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        careerData: careerData as object,
        basics: careerData.basics as object,
        work: careerData.work as object,
        education: careerData.education as object,
        projects: careerData.projects as object,
        certifications: careerData.certifications as object,
      },
      create: {
        userId: user.id,
        careerData: careerData as object,
        basics: careerData.basics as object,
        work: careerData.work as object,
        education: careerData.education as object,
        projects: careerData.projects as object,
        certifications: careerData.certifications as object,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("Failed to save profile:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
