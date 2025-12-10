import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserAnalyticsSummary,
  getDailyUsage,
  getTemplateUsageStats,
  getUserActivityTimeline,
} from "@/lib/analytics";

// GET /api/analytics - Get user analytics
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all analytics data in parallel
    const [summary, dailyUsage, templateStats, activityTimeline] = await Promise.all([
      getUserAnalyticsSummary(user.id),
      getDailyUsage(user.id),
      getTemplateUsageStats(user.id),
      getUserActivityTimeline(user.id, 30),
    ]);

    return NextResponse.json({
      summary,
      dailyUsage,
      templateStats,
      activityTimeline,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
