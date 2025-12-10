"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UploadResult {
  success: boolean;
  filename: string;
  parsedText: string;
  textLength: number;
}

interface ParseResult {
  success: boolean;
  summary: {
    name: string;
    workExperiences: number;
    educationEntries: number;
    skills: number;
    projects: number;
    certifications: number;
  };
}

export default function DocumentUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setResult(null);
    setParseResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Upload and extract text
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setResult(data);
      setIsUploading(false);

      // Step 2: Parse the extracted text into structured profile data
      setIsParsing(true);
      const parseResponse = await fetch("/api/profile/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: data.parsedText }),
      });

      const parseData = await parseResponse.json();

      if (!parseResponse.ok) {
        setError(parseData.error || "Failed to parse resume");
        return;
      }

      setParseResult(parseData);

      // Refresh the page to show updated profile
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  }, [router]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800"
            : "border-zinc-300 dark:border-zinc-700"
        } ${isUploading || isParsing ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isUploading || isParsing}
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isUploading
              ? "Uploading..."
              : isParsing
                ? "Analyzing resume with AI..."
                : "Drop your resume here or click to browse"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Supports PDF, DOCX, and TXT (max 10MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {isParsing && (
        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                Analyzing your resume...
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                Extracting work experience, education, skills, and more
              </p>
            </div>
          </div>
        </div>
      )}

      {parseResult && (
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">
            Profile updated successfully!
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {parseResult.summary.name && (
              <div className="col-span-2 text-green-700 dark:text-green-500">
                Name: <span className="font-medium">{parseResult.summary.name}</span>
              </div>
            )}
            <div className="text-green-600 dark:text-green-500">
              Work Experience: <span className="font-medium">{parseResult.summary.workExperiences}</span>
            </div>
            <div className="text-green-600 dark:text-green-500">
              Education: <span className="font-medium">{parseResult.summary.educationEntries}</span>
            </div>
            <div className="text-green-600 dark:text-green-500">
              Skills: <span className="font-medium">{parseResult.summary.skills}</span>
            </div>
            <div className="text-green-600 dark:text-green-500">
              Projects: <span className="font-medium">{parseResult.summary.projects}</span>
            </div>
            {parseResult.summary.certifications > 0 && (
              <div className="text-green-600 dark:text-green-500">
                Certifications: <span className="font-medium">{parseResult.summary.certifications}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {result && !parseResult && !isParsing && (
        <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
            Text extracted from: {result.filename}
          </p>
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500">
            {result.textLength.toLocaleString()} characters extracted
          </p>
        </div>
      )}
    </div>
  );
}
