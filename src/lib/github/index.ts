export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  isForked: boolean;
}

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  avatarUrl: string;
  profileUrl: string;
}

export interface GitHubData {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  topLanguages: { language: string; bytes: number; percentage: number }[];
  contributionStats: {
    totalCommits: number;
    totalPRs: number;
  };
}

const GITHUB_API_BASE = "https://api.github.com";

async function fetchGitHub(
  endpoint: string,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });
}

export async function fetchGitHubProfile(
  username: string,
  token?: string
): Promise<GitHubProfile | null> {
  const response = await fetchGitHub(`/users/${username}`, token);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return {
    username: data.login,
    name: data.name,
    bio: data.bio,
    company: data.company,
    location: data.location,
    blog: data.blog,
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
    avatarUrl: data.avatar_url,
    profileUrl: data.html_url,
  };
}

export async function fetchGitHubRepos(
  username: string,
  token?: string
): Promise<GitHubRepo[]> {
  const response = await fetchGitHub(
    `/users/${username}/repos?sort=updated&per_page=100`,
    token
  );

  if (!response.ok) {
    return [];
  }

  const repos = await response.json();

  // Fetch languages for each repo (limited to avoid rate limits)
  const reposWithLanguages = await Promise.all(
    repos.slice(0, 20).map(async (repo: Record<string, unknown>) => {
      const langResponse = await fetchGitHub(
        `/repos/${username}/${repo.name}/languages`,
        token
      );
      const languages = langResponse.ok ? await langResponse.json() : {};

      return {
        name: repo.name as string,
        description: repo.description as string | null,
        url: repo.html_url as string,
        language: repo.language as string | null,
        languages: languages as Record<string, number>,
        stars: repo.stargazers_count as number,
        forks: repo.forks_count as number,
        topics: (repo.topics || []) as string[],
        createdAt: repo.created_at as string,
        updatedAt: repo.updated_at as string,
        isForked: repo.fork as boolean,
      };
    })
  );

  return reposWithLanguages;
}

export async function fetchGitHubData(
  username: string,
  token?: string
): Promise<GitHubData | null> {
  const profile = await fetchGitHubProfile(username, token);

  if (!profile) {
    return null;
  }

  const repos = await fetchGitHubRepos(username, token);

  // Calculate top languages across all repos
  const languageTotals: Record<string, number> = {};
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
    }
  }

  const totalBytes = Object.values(languageTotals).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(languageTotals)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);

  return {
    profile,
    repos,
    topLanguages,
    contributionStats: {
      totalCommits: 0, // Would need GraphQL API for accurate count
      totalPRs: 0,
    },
  };
}

// Map GitHub languages to skill names
export function mapLanguagesToSkills(
  languages: { language: string; percentage: number }[]
): { name: string; category: "technical"; proficiency: string }[] {
  return languages
    .filter((l) => l.percentage >= 5) // Only include languages with >= 5% usage
    .map((l) => ({
      name: l.language,
      category: "technical" as const,
      proficiency:
        l.percentage >= 30
          ? "advanced"
          : l.percentage >= 15
            ? "intermediate"
            : "beginner",
    }));
}
