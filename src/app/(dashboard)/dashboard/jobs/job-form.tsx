"use client";

import { useState } from "react";
import type { ParsedJobDescription } from "@/types/job";

export default function JobForm() {
  const [rawDescription, setRawDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    job: { id: string };
    parsed: ParsedJobDescription;
    usedLLM: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to parse job description");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Failed to parse job description. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="jobDescription"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            rows={12}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Paste the job description here..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !rawDescription.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isLoading ? "Analyzing..." : "Analyze Job Description"}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Analysis Results
            </h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {result.usedLLM ? "AI-powered" : "Rule-based"}
            </span>
          </div>

          {/* Job Info */}
          {(result.parsed.title || result.parsed.company) && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500">Position</h3>
              <p className="text-zinc-900 dark:text-zinc-100">
                {result.parsed.title || "Unknown Title"}
                {result.parsed.company && ` at ${result.parsed.company}`}
              </p>
              {result.parsed.seniorityLevel && (
                <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {result.parsed.seniorityLevel}
                </span>
              )}
            </div>
          )}

          {/* Required Skills */}
          {result.parsed.requiredSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500">
                Required Skills ({result.parsed.requiredSkills.length})
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.parsed.requiredSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {skill.name}
                    <span className="ml-1 text-xs opacity-70">
                      ({skill.category})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {result.parsed.preferredSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500">
                Preferred Skills ({result.parsed.preferredSkills.length})
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.parsed.preferredSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {result.parsed.responsibilities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500">
                Responsibilities ({result.parsed.responsibilities.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {result.parsed.responsibilities.slice(0, 5).map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    - {r}
                  </li>
                ))}
                {result.parsed.responsibilities.length > 5 && (
                  <li className="text-sm text-zinc-500">
                    ...and {result.parsed.responsibilities.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {result.parsed.requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500">
                Requirements ({result.parsed.requirements.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {result.parsed.requirements.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span
                      className={`mr-2 text-xs ${r.isRequired ? "text-red-600" : "text-yellow-600"}`}
                    >
                      [{r.isRequired ? "Required" : "Preferred"}]
                    </span>
                    {r.text}
                    {r.yearsRequired && ` (${r.yearsRequired}+ years)`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <a
              href={`/dashboard/jobs/${result.job.id}`}
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View Coverage Map
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
