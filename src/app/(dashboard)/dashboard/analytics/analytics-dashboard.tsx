"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Mail,
  Briefcase,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalJobsAnalyzed: number;
    totalResumesGenerated: number;
    totalCoverLettersGenerated: number;
    totalApplications: number;
    applicationsByStatus: Record<string, number>;
    interviewRate: number;
    recentActivity: { eventType: string; createdAt: string }[];
  };
  dailyUsage: {
    llmRewrites: number;
    coverLetters: number;
    linkedInGenerations: number;
    pdfExports: number;
    docxExports: number;
    jobsAnalyzed: number;
  };
  templateStats: { templateId: string; count: number }[];
  activityTimeline: { date: string; count: number }[];
}

const STATUS_CONFIG = {
  applied: { label: "Applied", color: "bg-blue-500", icon: Clock },
  screening: { label: "Screening", color: "bg-yellow-500", icon: Clock },
  interview: { label: "Interview", color: "bg-purple-500", icon: Briefcase },
  offer: { label: "Offer", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-gray-500", icon: XCircle },
};

const TEMPLATE_NAMES: Record<string, string> = {
  "us-tech": "US Tech",
  "eu-uk": "EU/UK Professional",
  germany: "German (Lebenslauf)",
  creative: "Creative Portfolio",
  unknown: "Unknown",
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/analytics");
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, dailyUsage, templateStats, activityTimeline } = data;

  // Calculate max activity for chart scaling
  const maxActivity = Math.max(...activityTimeline.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jobs Analyzed"
          value={summary.totalJobsAnalyzed}
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="Resumes Generated"
          value={summary.totalResumesGenerated}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Cover Letters"
          value={summary.totalCoverLettersGenerated}
          icon={Mail}
          color="purple"
        />
        <StatCard
          title="Interview Rate"
          value={`${summary.interviewRate}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Application Pipeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Application Pipeline
        </h2>
        {summary.totalApplications > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = summary.applicationsByStatus[status] || 0;
                const percentage =
                  summary.totalApplications > 0
                    ? Math.round((count / summary.totalApplications) * 100)
                    : 0;

                return (
                  <div
                    key={status}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2"
                  >
                    <config.icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {config.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pipeline Bar */}
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = summary.applicationsByStatus[status] || 0;
                const percentage =
                  summary.totalApplications > 0
                    ? (count / summary.totalApplications) * 100
                    : 0;

                if (percentage === 0) return null;

                return (
                  <div
                    key={status}
                    className={`${config.color} h-full transition-all`}
                    style={{ width: `${percentage}%` }}
                    title={`${config.label}: ${count}`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No applications tracked yet. Start by marking jobs as applied.
          </p>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Activity (Last 30 Days)
          </h2>
        </div>
        <div className="h-32 flex items-end gap-1">
          {activityTimeline.map((day, index) => {
            const height = (day.count / maxActivity) * 100;
            const date = new Date(day.date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    day.count > 0
                      ? "bg-blue-500 hover:bg-blue-600"
                      : isWeekend
                        ? "bg-gray-100"
                        : "bg-gray-200"
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    : {day.count} events
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Usage */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Template Usage
            </h2>
          </div>
          {templateStats.length > 0 ? (
            <div className="space-y-3">
              {templateStats.map((stat) => {
                const totalUsage = templateStats.reduce(
                  (sum, s) => sum + s.count,
                  0
                );
                const percentage = Math.round((stat.count / totalUsage) * 100);

                return (
                  <div key={stat.templateId}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {TEMPLATE_NAMES[stat.templateId] || stat.templateId}
                      </span>
                      <span className="text-sm text-gray-500">
                        {stat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No resumes generated yet.
            </p>
          )}
        </div>

        {/* Today's Usage */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today&apos;s Usage
          </h2>
          <div className="space-y-3">
            <UsageRow label="Jobs Analyzed" value={dailyUsage.jobsAnalyzed} />
            <UsageRow label="LLM Rewrites" value={dailyUsage.llmRewrites} />
            <UsageRow label="Cover Letters" value={dailyUsage.coverLetters} />
            <UsageRow
              label="LinkedIn Summaries"
              value={dailyUsage.linkedInGenerations}
            />
            <UsageRow label="PDF Exports" value={dailyUsage.pdfExports} />
            <UsageRow label="DOCX Exports" value={dailyUsage.docxExports} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        {summary.recentActivity.length > 0 ? (
          <div className="space-y-2">
            {summary.recentActivity.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-700">
                  {formatEventType(event.eventType)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function formatEventType(eventType: string): string {
  const eventLabels: Record<string, string> = {
    profile_created: "Profile created",
    profile_updated: "Profile updated",
    document_uploaded: "Document uploaded",
    document_parsed: "Document parsed",
    job_analyzed: "Job analyzed",
    coverage_map_viewed: "Coverage map viewed",
    gap_questions_answered: "Gap questions answered",
    resume_generated: "Resume generated",
    cover_letter_generated: "Cover letter generated",
    linkedin_generated: "LinkedIn summary generated",
    pdf_exported: "PDF exported",
    docx_exported: "DOCX exported",
    application_created: "Application tracked",
    application_status_updated: "Application status updated",
  };

  return eventLabels[eventType] || eventType.replace(/_/g, " ");
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
