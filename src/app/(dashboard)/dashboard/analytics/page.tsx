import { Suspense } from "react";
import { AnalyticsDashboard } from "./analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track your job search progress and outcomes
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
