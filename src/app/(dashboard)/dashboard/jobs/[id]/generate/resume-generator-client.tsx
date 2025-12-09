"use client";

import { useState, useEffect } from "react";
import { LexicalEditor } from "@/components/editor";
import type { CoverageMap } from "@/lib/matching";
import type { ParsedJobDescription } from "@/types/job";

interface ResumeGeneratorClientProps {
  jobId: string;
}

type TabType = "preview" | "edit" | "cover-letter" | "linkedin";
type ExportFormat = "pdf" | "docx";

export default function ResumeGeneratorClient({ jobId }: ResumeGeneratorClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverageMap, setCoverageMap] = useState<CoverageMap | null>(null);
  const [job, setJob] = useState<ParsedJobDescription | null>(null);

  // Generated content
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [linkedInContent, setLinkedInContent] = useState<{
    headline: string;
    summary: string;
  } | null>(null);

  // Editor content
  const [editedContent, setEditedContent] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/jobs/${jobId}/coverage`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load job data");
          return;
        }

        setCoverageMap(data.coverageMap);
        setJob(data.job);
      } catch (err) {
        setError("Failed to load job data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [jobId]);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setError(null);

    try {
      const endpoint = format === "pdf" ? "/api/resume/generate" : "/api/resume/generate-docx";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, template: "us-tech" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to generate ${format.toUpperCase()}`);
        return;
      }

      // Download the file
      const blob = base64ToBlob(
        format === "pdf" ? data.pdf : data.docx,
        data.mimeType
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to export ${format.toUpperCase()}`);
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          tone: "enthusiastic",
          addressGaps: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate cover letter");
        return;
      }

      setCoverLetter(data.formatted);
      setActiveTab("cover-letter");
    } catch (err) {
      setError("Failed to generate cover letter");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLinkedIn = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: job?.title,
          tone: "professional",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate LinkedIn content");
        return;
      }

      setLinkedInContent({
        headline: data.headline,
        summary: data.summary,
      });
      setActiveTab("linkedin");
    } catch (err) {
      setError("Failed to generate LinkedIn content");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (error && !coverageMap) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  const tabs = [
    { id: "preview" as const, label: "Resume Preview" },
    { id: "edit" as const, label: "Edit Content" },
    { id: "cover-letter" as const, label: "Cover Letter" },
    { id: "linkedin" as const, label: "LinkedIn" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Generate Resume
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {job?.title}
            {job?.company && ` at ${job.company}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {coverageMap && (
            <div className="rounded-lg bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400">Match: </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {coverageMap.overallScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport("pdf")}
          disabled={isExporting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Download PDF"}
        </button>
        <button
          onClick={() => handleExport("docx")}
          disabled={isExporting}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Download DOCX"}
        </button>
        <button
          onClick={handleGenerateCoverLetter}
          disabled={isGenerating}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isGenerating ? "Generating..." : "Generate Cover Letter"}
        </button>
        <button
          onClick={handleGenerateLinkedIn}
          disabled={isGenerating}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isGenerating ? "Generating..." : "Generate LinkedIn"}
        </button>
      </div>

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
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {activeTab === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your resume will be generated using the US Tech template, tailored to highlight
              skills relevant to this position.
            </p>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
              <div className="text-zinc-500 dark:text-zinc-400">
                Resume preview would be rendered here using react-pdf viewer.
                <br />
                Click &quot;Download PDF&quot; to get your tailored resume.
              </div>
            </div>
            {coverageMap && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Skills highlighted in this resume:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coverageMap.items
                    .filter((i) => i.status === "FULL")
                    .map((item, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        {item.requirement}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Use the editor below to make changes to your resume content before exporting.
            </p>
            <LexicalEditor
              initialContent={editedContent}
              onChange={(html, text) => setEditedContent(html)}
              placeholder="Paste or type your resume content here to edit..."
              minHeight="400px"
            />
          </div>
        )}

        {activeTab === "cover-letter" && (
          <div className="space-y-4">
            {coverLetter ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Generated Cover Letter
                  </h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(coverLetter)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Copy to clipboard
                  </button>
                </div>
                <div className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                  {coverLetter}
                </div>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGenerating}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                >
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </button>
              </>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                Click &quot;Generate Cover Letter&quot; to create a tailored cover letter for this position.
              </div>
            )}
          </div>
        )}

        {activeTab === "linkedin" && (
          <div className="space-y-6">
            {linkedInContent ? (
              <>
                {/* Headline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      LinkedIn Headline
                    </h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(linkedInContent.headline)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                    {linkedInContent.headline}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {linkedInContent.headline.length}/120 characters
                  </p>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      LinkedIn About Section
                    </h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(linkedInContent.summary)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                    {linkedInContent.summary}
                  </div>
                </div>

                <button
                  onClick={handleGenerateLinkedIn}
                  disabled={isGenerating}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                >
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </button>
              </>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                Click &quot;Generate LinkedIn&quot; to create optimized LinkedIn content.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="flex justify-between">
        <a
          href={`/dashboard/jobs/${jobId}`}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Back to Job Analysis
        </a>
        <a
          href="/dashboard/jobs"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          All Jobs
        </a>
      </div>
    </div>
  );
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
