"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  Plus,
  Filter,
} from "lucide-react";

interface Application {
  id: string;
  jobId: string;
  resumeId: string | null;
  companyName: string;
  jobTitle: string;
  appliedAt: string;
  status: string;
  statusUpdatedAt: string;
  interviewCount: number;
  notes: string | null;
}

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied", color: "bg-blue-100 text-blue-700" },
  { value: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-700" },
  { value: "interview", label: "Interview", color: "bg-purple-100 text-purple-700" },
  { value: "offer", label: "Offer", color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-700" },
];

export function ApplicationsTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const url = filterStatus
        ? `/api/applications?status=${filterStatus}`
        : "/api/applications";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setApplications((apps) =>
        apps.map((app) =>
          app.id === id
            ? { ...app, status: newStatus, statusUpdatedAt: new Date().toISOString() }
            : app
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const updateInterviewCount = async (id: string, count: number) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewCount: count }),
      });

      if (!response.ok) {
        throw new Error("Failed to update interview count");
      }

      setApplications((apps) =>
        apps.map((app) => (app.id === id ? { ...app, interviewCount: count } : app))
      );
    } catch (err) {
      console.error("Failed to update interview count:", err);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to update notes");
      }

      setApplications((apps) =>
        apps.map((app) => (app.id === id ? { ...app, notes } : app))
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete application");
      }

      setApplications((apps) => apps.filter((app) => app.id !== id));
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === filterStatus);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus(null)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterStatus === null
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterStatus === status.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {!filterStatus && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {STATUS_OPTIONS.map((status) => {
            const count = applications.filter(
              (app) => app.status === status.value
            ).length;
            return (
              <div
                key={status.value}
                className="bg-white border border-gray-200 rounded-lg p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{status.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus
              ? `No ${statusConfig?.label.toLowerCase()} applications`
              : "No applications tracked yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {filterStatus
              ? "Try selecting a different filter."
              : "Track your job applications to monitor your progress."}
          </p>
          <a
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Analyze a Job
          </a>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Company / Position
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">
                  Applied
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">
                  Interviews
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">
                  Notes
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.companyName}
                      </p>
                      <p className="text-sm text-gray-500">{app.jobTitle}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 border-0 cursor-pointer ${
                        STATUS_OPTIONS.find((s) => s.value === app.status)
                          ?.color || "bg-gray-100"
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(app.appliedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          updateInterviewCount(
                            app.id,
                            Math.max(0, app.interviewCount - 1)
                          )
                        }
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                        disabled={app.interviewCount === 0}
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-medium">
                        {app.interviewCount}
                      </span>
                      <button
                        onClick={() =>
                          updateInterviewCount(app.id, app.interviewCount + 1)
                        }
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {editingId === app.id ? (
                      <input
                        type="text"
                        defaultValue={app.notes || ""}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        onBlur={(e) => updateNotes(app.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateNotes(app.id, e.currentTarget.value);
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(app.id)}
                        className="text-sm text-gray-500 hover:text-gray-700 text-left w-full truncate max-w-[200px]"
                      >
                        {app.notes || "Add notes..."}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpenId(menuOpenId === app.id ? null : app.id)
                        }
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                      {menuOpenId === app.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button
                              onClick={() => {
                                setEditingId(app.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Notes
                            </button>
                            <a
                              href={`/dashboard/jobs/${app.jobId}`}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Briefcase className="h-4 w-4" />
                              View Job
                            </a>
                            <button
                              onClick={() => {
                                deleteApplication(app.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
