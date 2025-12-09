"use client";

import { useState, useCallback } from "react";

interface UploadResult {
  success: boolean;
  filename: string;
  parsedText: string;
  textLength: number;
}

export default function DocumentUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
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
    } catch (err) {
      setError("Failed to upload file. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  }, []);

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
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isUploading}
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isUploading ? "Uploading..." : "Drop your resume here or click to browse"}
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

      {result && (
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">
            Successfully parsed: {result.filename}
          </p>
          <p className="mt-1 text-xs text-green-600 dark:text-green-500">
            Extracted {result.textLength.toLocaleString()} characters
          </p>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Preview:
            </p>
            <pre className="max-h-48 overflow-auto rounded bg-zinc-100 p-3 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {result.parsedText.slice(0, 2000)}
              {result.parsedText.length > 2000 && "..."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
