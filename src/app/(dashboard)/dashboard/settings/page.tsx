import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
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
            <span className="text-zinc-600 dark:text-zinc-400">Settings</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <SettingsClient email={user.email || ""} />
      </main>
    </div>
  );
}
