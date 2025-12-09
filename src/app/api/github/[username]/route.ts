import { createClient } from "@/lib/supabase/server";
import { fetchGitHubData, mapLanguagesToSkills } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;

    if (!username || username.length < 1) {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    const githubData = await fetchGitHubData(username);

    if (!githubData) {
      return NextResponse.json(
        { error: "GitHub user not found" },
        { status: 404 }
      );
    }

    // Extract skills from languages
    const skills = mapLanguagesToSkills(githubData.topLanguages);

    // Format repos as projects
    const projects = githubData.repos
      .filter((repo) => !repo.isForked && repo.description)
      .slice(0, 10)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.url,
        technologies: Object.keys(repo.languages),
        type: "open_source" as const,
        highlights: [
          repo.stars > 0 ? `${repo.stars} stars` : null,
          repo.forks > 0 ? `${repo.forks} forks` : null,
        ].filter(Boolean),
      }));

    return NextResponse.json({
      profile: githubData.profile,
      topLanguages: githubData.topLanguages,
      skills,
      projects,
      repoCount: githubData.repos.length,
    });
  } catch (err) {
    console.error("GitHub fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}
