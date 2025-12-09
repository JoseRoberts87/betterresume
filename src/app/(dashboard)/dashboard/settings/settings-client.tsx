"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  email: string;
}

interface UsageData {
  tier: string;
  usage: {
    jobs: { current: number; limit?: number; allowed: boolean };
    resumes: { current: number; limit?: number; allowed: boolean };
    documents: { current: number; limit?: number; allowed: boolean };
    pdfExports: { allowed: boolean };
    docxExports: { allowed: boolean };
  };
  premiumFeatures: string[];
}

interface DeletionPreview {
  email: string;
  dataToBeDeleted: {
    profile: boolean;
    resumes: number;
    jobs: number;
    documents: number;
    skills: number;
  };
}

export default function SettingsClient({ email }: SettingsClientProps) {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/account/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (err) {
        console.error("Failed to fetch usage:", err);
      }
    }

    fetchUsage();
  }, []);

  const handleShowDeleteConfirm = async () => {
    try {
      const response = await fetch("/api/account/delete");
      if (response.ok) {
        const data = await response.json();
        setDeletionPreview(data);
        setShowDeleteConfirm(true);
      }
    } catch (err) {
      setError("Failed to load account information");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
      });

      if (response.ok) {
        // Redirect to home page after deletion
        router.push("/");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete account");
      }
    } catch (err) {
      setError("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Account Settings
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Manage your account and subscription
        </p>
      </div>

      {/* Account Info */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Account Information
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Email</span>
            <span className="text-zinc-900 dark:text-zinc-100">{email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Plan</span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {usage?.tier === "premium" ? (
                <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Premium
                </span>
              ) : (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                  Free
                </span>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Usage */}
      {usage && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Usage
          </h2>
          <div className="mt-4 space-y-4">
            <UsageBar
              label="Jobs"
              current={usage.usage.jobs.current}
              limit={usage.usage.jobs.limit}
            />
            <UsageBar
              label="Resumes"
              current={usage.usage.resumes.current}
              limit={usage.usage.resumes.limit}
            />
            <UsageBar
              label="Documents"
              current={usage.usage.documents.current}
              limit={usage.usage.documents.limit}
            />
          </div>

          {/* Features */}
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Features
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <FeatureStatus label="PDF Export" enabled={usage.usage.pdfExports.allowed} />
              <FeatureStatus label="DOCX Export" enabled={usage.usage.docxExports.allowed} />
            </div>
          </div>

          {/* Premium features */}
          {usage.premiumFeatures.length > 0 && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Upgrade to Premium
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {usage.premiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-600">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Upgrade Now
              </button>
            </div>
          )}
        </section>
      )}

      {/* Danger Zone */}
      <section className="rounded-lg border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={handleShowDeleteConfirm}
            className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete Account
          </button>
        ) : (
          <div className="mt-4 space-y-4">
            {deletionPreview && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  The following data will be permanently deleted:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-500">
                  {deletionPreview.dataToBeDeleted.profile && <li>Your profile</li>}
                  {deletionPreview.dataToBeDeleted.resumes > 0 && (
                    <li>{deletionPreview.dataToBeDeleted.resumes} resume(s)</li>
                  )}
                  {deletionPreview.dataToBeDeleted.jobs > 0 && (
                    <li>{deletionPreview.dataToBeDeleted.jobs} job(s)</li>
                  )}
                  {deletionPreview.dataToBeDeleted.documents > 0 && (
                    <li>{deletionPreview.dataToBeDeleted.documents} document(s)</li>
                  )}
                  {deletionPreview.dataToBeDeleted.skills > 0 && (
                    <li>{deletionPreview.dataToBeDeleted.skills} skill(s)</li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="DELETE"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== "DELETE"}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setError(null);
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Navigation */}
      <div className="flex justify-between text-sm">
        <a
          href="/dashboard"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Back to Dashboard
        </a>
        <a
          href="/auth/signout"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Sign Out
        </a>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit?: number;
}) {
  const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
  const isUnlimited = !limit || limit === -1;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="text-zinc-900 dark:text-zinc-100">
          {current} {isUnlimited ? "" : `/ ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-2 rounded-full ${
              percentage >= 90
                ? "bg-red-500"
                : percentage >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function FeatureStatus({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <span className="text-green-600 dark:text-green-400">&#10003;</span>
      ) : (
        <span className="text-zinc-400">&#10007;</span>
      )}
      <span className={enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}>
        {label}
      </span>
    </div>
  );
}
