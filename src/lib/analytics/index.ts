import { prisma } from "@/lib/prisma";

// Event types for tracking
export type AnalyticsEventType =
  | "profile_created"
  | "profile_updated"
  | "document_uploaded"
  | "document_parsed"
  | "job_analyzed"
  | "coverage_map_viewed"
  | "gap_questions_answered"
  | "resume_generated"
  | "cover_letter_generated"
  | "linkedin_generated"
  | "pdf_exported"
  | "docx_exported"
  | "application_created"
  | "application_status_updated";

export interface TrackEventOptions {
  userId: string;
  eventType: AnalyticsEventType;
  eventData?: Record<string, unknown>;
  jobId?: string;
  resumeId?: string;
  templateId?: string;
}

// Track an analytics event
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: options.userId,
        eventType: options.eventType,
        eventData: options.eventData ? JSON.parse(JSON.stringify(options.eventData)) : {},
        jobId: options.jobId,
        resumeId: options.resumeId,
        templateId: options.templateId,
      },
    });
  } catch (error) {
    // Log but don't throw - analytics should not break core functionality
    console.error("Failed to track event:", error);
  }
}

// Increment daily usage counter
export async function incrementDailyUsage(
  userId: string,
  field: "llmRewrites" | "coverLetters" | "linkedInGenerations" | "pdfExports" | "docxExports" | "jobsAnalyzed"
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.dailyUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        [field]: 1,
      },
      update: {
        [field]: { increment: 1 },
      },
    });
  } catch (error) {
    console.error("Failed to increment daily usage:", error);
  }
}

// Get daily usage for a user
export async function getDailyUsage(userId: string): Promise<{
  llmRewrites: number;
  coverLetters: number;
  linkedInGenerations: number;
  pdfExports: number;
  docxExports: number;
  jobsAnalyzed: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usage = await prisma.dailyUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  return {
    llmRewrites: usage?.llmRewrites || 0,
    coverLetters: usage?.coverLetters || 0,
    linkedInGenerations: usage?.linkedInGenerations || 0,
    pdfExports: usage?.pdfExports || 0,
    docxExports: usage?.docxExports || 0,
    jobsAnalyzed: usage?.jobsAnalyzed || 0,
  };
}

// Get user analytics summary
export async function getUserAnalyticsSummary(userId: string): Promise<{
  totalJobsAnalyzed: number;
  totalResumesGenerated: number;
  totalCoverLettersGenerated: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  interviewRate: number;
  recentActivity: { eventType: string; createdAt: Date }[];
}> {
  // Get event counts
  const [
    jobsAnalyzed,
    resumesGenerated,
    coverLettersGenerated,
    applications,
    recentEvents,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { userId, eventType: "job_analyzed" },
    }),
    prisma.analyticsEvent.count({
      where: { userId, eventType: "resume_generated" },
    }),
    prisma.analyticsEvent.count({
      where: { userId, eventType: "cover_letter_generated" },
    }),
    prisma.application.findMany({
      where: { userId },
      select: { status: true, interviewCount: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { eventType: true, createdAt: true },
    }),
  ]);

  // Calculate application stats
  const applicationsByStatus = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalApplications = applications.length;
  const applicationsWithInterviews = applications.filter((a) => a.interviewCount > 0).length;
  const interviewRate = totalApplications > 0
    ? Math.round((applicationsWithInterviews / totalApplications) * 100)
    : 0;

  return {
    totalJobsAnalyzed: jobsAnalyzed,
    totalResumesGenerated: resumesGenerated,
    totalCoverLettersGenerated: coverLettersGenerated,
    totalApplications,
    applicationsByStatus,
    interviewRate,
    recentActivity: recentEvents,
  };
}

// Get template usage statistics
export async function getTemplateUsageStats(userId?: string): Promise<
  { templateId: string; count: number }[]
> {
  const where = userId ? { userId, eventType: "resume_generated" } : { eventType: "resume_generated" };

  const events = await prisma.analyticsEvent.findMany({
    where,
    select: { templateId: true },
  });

  const templateCounts = events.reduce(
    (acc, event) => {
      const templateId = event.templateId || "unknown";
      acc[templateId] = (acc[templateId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(templateCounts)
    .map(([templateId, count]) => ({ templateId, count }))
    .sort((a, b) => b.count - a.count);
}

// Get user activity over time
export async function getUserActivityTimeline(
  userId: string,
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: { createdAt: true },
  });

  // Group by date
  const activityByDate = events.reduce(
    (acc, event) => {
      const date = event.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Fill in missing dates
  const result: { date: string; count: number }[] = [];
  const currentDate = new Date(startDate);
  const endDate = new Date();

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      count: activityByDate[dateStr] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}
