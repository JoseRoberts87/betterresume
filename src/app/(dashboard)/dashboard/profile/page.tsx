import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DocumentUpload from "./document-upload";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
            >
              BetterResume
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-600 dark:text-zinc-400">Profile</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Build Your Profile
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload your existing resume or build your career profile step by step
          </p>
        </div>

        <div className="space-y-8">
          {/* Document Upload Section */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Upload Existing Resume
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Upload your existing resume (PDF, DOCX, or TXT) to automatically extract your experience.
            </p>
            <DocumentUpload />
          </section>

          {/* Manual Entry Section */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Or Build From Scratch
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Answer guided questions to build your career profile step by step.
            </p>
            <Link
              href="/dashboard/profile/wizard"
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Guided Setup
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
