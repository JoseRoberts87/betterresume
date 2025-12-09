import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            BetterResume
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </span>
            <Link
              href="/dashboard/settings"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Settings
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Welcome to BetterResume
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Build your career profile and create tailored resumes
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/profile"
            className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Build Profile
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Upload your resume or build your career profile from scratch
            </p>
          </Link>

          <Link
            href="/dashboard/jobs"
            className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Match Jobs
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Paste a job description and see how well you match
            </p>
          </Link>

          <Link
            href="/dashboard/resumes"
            className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              My Resumes
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              View and download your tailored resumes
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
