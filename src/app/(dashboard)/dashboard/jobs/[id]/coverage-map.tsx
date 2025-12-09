"use client";

import { useEffect, useState } from "react";
import type { CoverageMap, CoverageItem } from "@/lib/matching";
import type { ParsedJobDescription } from "@/types/job";

interface CoverageMapViewProps {
  jobId: string;
}

export default function CoverageMapView({ jobId }: CoverageMapViewProps) {
  const [coverageMap, setCoverageMap] = useState<CoverageMap | null>(null);
  const [job, setJob] = useState<ParsedJobDescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoverage() {
      try {
        const response = await fetch(`/api/jobs/${jobId}/coverage`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load coverage map");
          return;
        }

        setCoverageMap(data.coverageMap);
        setJob(data.job);
      } catch (err) {
        setError("Failed to load coverage map");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCoverage();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500">Loading coverage map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {error}
        {error.includes("profile") && (
          <a
            href="/dashboard/profile"
            className="ml-2 underline hover:no-underline"
          >
            Complete your profile
          </a>
        )}
      </div>
    );
  }

  if (!coverageMap || !job) {
    return null;
  }

  const requiredItems = coverageMap.items.filter((i) => i.priority === "P1");
  const preferredItems = coverageMap.items.filter((i) => i.priority !== "P1");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Coverage Map
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {job.title}
            {job.company && ` at ${job.company}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {coverageMap.overallScore}%
          </div>
          <div className="text-sm text-zinc-500">Match Score</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Required - Full"
          value={coverageMap.requiredCoverage.full}
          total={requiredItems.length}
          color="green"
        />
        <StatCard
          label="Required - Partial"
          value={coverageMap.requiredCoverage.partial}
          total={requiredItems.length}
          color="yellow"
        />
        <StatCard
          label="Required - Gap"
          value={coverageMap.requiredCoverage.gap}
          total={requiredItems.length}
          color="red"
        />
        <StatCard
          label="Preferred - Full"
          value={coverageMap.preferredCoverage.full}
          total={preferredItems.length}
          color="blue"
        />
      </div>

      {/* Coverage Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Detailed Coverage
          </h2>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* Required Skills */}
          {requiredItems.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="mb-4 text-sm font-medium text-zinc-500">
                Required ({requiredItems.length})
              </h3>
              <div className="space-y-3">
                {requiredItems.map((item, i) => (
                  <CoverageRow key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {preferredItems.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="mb-4 text-sm font-medium text-zinc-500">
                Preferred ({preferredItems.length})
              </h3>
              <div className="space-y-3">
                {preferredItems.map((item, i) => (
                  <CoverageRow key={i} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gap Summary */}
      {coverageMap.items.filter((i) => i.status === "GAP").length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900/50 dark:bg-yellow-900/20">
          <h3 className="mb-2 font-medium text-yellow-800 dark:text-yellow-400">
            Skills to Address
          </h3>
          <p className="mb-4 text-sm text-yellow-700 dark:text-yellow-500">
            Consider highlighting related experience or addressing these gaps in
            your cover letter.
          </p>
          <div className="flex flex-wrap gap-2">
            {coverageMap.items
              .filter((i) => i.status === "GAP")
              .map((item, i) => (
                <span
                  key={i}
                  className="rounded-full bg-yellow-200 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400"
                >
                  {item.requirement}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <a
          href={`/dashboard/jobs/${jobId}/generate`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Generate Tailored Resume
        </a>
        <a
          href="/dashboard/jobs"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Back to Jobs
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: "green" | "yellow" | "red" | "blue";
}) {
  const colorClasses = {
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">
        {value}/{total}
      </div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function CoverageRow({ item }: { item: CoverageItem }) {
  const statusConfig = {
    FULL: {
      icon: "✓",
      label: "Full",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    PARTIAL: {
      icon: "~",
      label: "Partial",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    GAP: {
      icon: "✗",
      label: "Gap",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const status = statusConfig[item.status];

  return (
    <div className="flex items-start gap-4 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
      <span className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}>
        {status.icon} {status.label}
      </span>
      <div className="flex-1">
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.requirement}
        </div>
        {item.evidence.length > 0 && (
          <div className="mt-1 text-sm text-zinc-500">
            {item.evidence.slice(0, 2).join(" | ")}
            {item.evidence.length > 2 && ` +${item.evidence.length - 2} more`}
          </div>
        )}
      </div>
    </div>
  );
}
