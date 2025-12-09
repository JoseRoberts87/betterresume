"use client";

import { useState } from "react";
import CoverageMapView from "./coverage-map";
import GapQuestionsView from "./gap-questions";

interface JobDetailClientProps {
  jobId: string;
}

type TabType = "coverage" | "gaps" | "generate";

export default function JobDetailClient({ jobId }: JobDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("coverage");
  const [updatedScore, setUpdatedScore] = useState<number | null>(null);

  const handleGapQuestionsComplete = (newScore: number) => {
    if (newScore > 0) {
      setUpdatedScore(newScore);
    }
    setActiveTab("coverage");
  };

  const tabs = [
    { id: "coverage" as const, label: "Coverage Map" },
    { id: "gaps" as const, label: "Address Gaps" },
    { id: "generate" as const, label: "Generate Resume" },
  ];

  return (
    <div className="space-y-6">
      {/* Score update notification */}
      {updatedScore !== null && (
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <span className="text-green-800 dark:text-green-400">
              Profile updated! Your new match score is {updatedScore}%
            </span>
            <button
              onClick={() => setUpdatedScore(null)}
              className="ml-auto text-green-600 hover:text-green-700 dark:text-green-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "coverage" && <CoverageMapView jobId={jobId} />}
      {activeTab === "gaps" && (
        <GapQuestionsView jobId={jobId} onComplete={handleGapQuestionsComplete} />
      )}
      {activeTab === "generate" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Resume Generation
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Coming soon - generate a tailored resume based on your coverage map.
          </p>
          <a
            href={`/dashboard/jobs/${jobId}/generate`}
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Resume Builder
          </a>
        </div>
      )}
    </div>
  );
}
