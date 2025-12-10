import { Suspense } from "react";
import { ResumesListServer } from "./resumes-list-server";

export default function ResumesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
        <p className="mt-2 text-gray-600">
          View and manage your generated resumes
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ResumesListServer />
      </Suspense>
    </div>
  );
}
