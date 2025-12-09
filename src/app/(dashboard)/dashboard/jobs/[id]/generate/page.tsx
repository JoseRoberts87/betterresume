import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ResumeGeneratorClient from "./resume-generator-client";

export default async function GenerateResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

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
            <Link
              href="/dashboard/jobs"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Jobs
            </Link>
            <span className="text-zinc-400">/</span>
            <Link
              href={`/dashboard/jobs/${id}`}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Analysis
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-600 dark:text-zinc-400">Generate</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <ResumeGeneratorClient jobId={id} />
      </main>
    </div>
  );
}
