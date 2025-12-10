import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";

// GET /api/applications - List all applications for user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: { userId: string; status?: string } = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      total,
      hasMore: offset + applications.length < total,
    });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, resumeId, companyName, jobTitle, notes } = body;

    if (!jobId || !companyName || !jobTitle) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, companyName, jobTitle" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId,
        resumeId,
        companyName,
        jobTitle,
        notes,
      },
    });

    // Track the event
    await trackEvent({
      userId: user.id,
      eventType: "application_created",
      jobId,
      resumeId,
      eventData: { companyName, jobTitle },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Failed to create application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
