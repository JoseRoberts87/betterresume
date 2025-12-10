import { Suspense } from "react";
import { ApplicationsTracker } from "./applications-tracker";

export default function ApplicationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="mt-2 text-gray-600">
          Track your job applications and their outcomes
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ApplicationsTracker />
      </Suspense>
    </div>
  );
}
