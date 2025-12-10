"use client";

import Link from "next/link";
import {
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  Percent,
  Plus,
} from "lucide-react";

interface Resume {
  id: string;
  matchScore: number | null;
  createdAt: Date;
  coverLetter: string | null;
  linkedInSummary: string | null;
  job: {
    id: string;
    title: string | null;
    company: string | null;
  } | null;
}

interface ResumesListProps {
  resumes: Resume[];
}

export function ResumesList({ resumes }: ResumesListProps) {
  if (resumes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No resumes yet
        </h3>
        <p className="text-gray-500 mb-6">
          Generate your first tailored resume by analyzing a job posting.
        </p>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Analyze a Job
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {resume.job?.title || "Untitled Position"}
                </h3>
                {resume.matchScore && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded-full">
                    <Percent className="h-3 w-3" />
                    {Math.round(resume.matchScore)}% match
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                {resume.job?.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {resume.job.company}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(resume.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {resume.coverLetter && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    Cover Letter
                  </span>
                )}
                {resume.linkedInSummary && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    LinkedIn
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {resume.job && (
                <Link
                  href={`/dashboard/jobs/${resume.job.id}/generate`}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
