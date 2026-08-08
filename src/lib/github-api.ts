export interface GithubRepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  language: string | null;
  homepage: string | null;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  updated_at: string;
}

export interface GithubCommit {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorLogin: string;
  authorAvatar: string;
  date: string;
  htmlUrl: string;
}

export interface GithubPullRequest {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  authorLogin: string;
  authorAvatar: string;
  state: string;
  createdAt: string;
  draft: boolean;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  authorLogin: string;
  authorAvatar: string;
  commentsCount: number;
  createdAt: string;
  labels: { name: string; color: string }[];
}

export interface GithubContributor {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
}

export interface CommitGraphBar {
  dayLabel: string;
  dateLabel: string;
  count: number;
  heightPercent: number;
}

export interface GithubWorkspaceData {
  repoInfo: GithubRepoInfo;
  commits: GithubCommit[];
  prs: GithubPullRequest[];
  issues: GithubIssue[];
  contributors: GithubContributor[];
  commitGraph: CommitGraphBar[];
  isRateLimited?: boolean;
}

/**
 * Parses user input into GitHub owner and repository name.
 * Accepts formats:
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGithubUrl(input: string): { owner: string; repo: string; fullRepoName: string; repoUrl: string } | null {
  if (!input || typeof input !== "string") return null;
  
  let cleaned = input.trim().replace(/\/+$/, "");
  
  // Remove protocols and domain prefix if present
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^www\./i, "");
  cleaned = cleaned.replace(/^github\.com\//i, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");

  if (!owner || !repo) return null;

  return {
    owner,
    repo,
    fullRepoName: `${owner}/${repo}`,
    repoUrl: `https://github.com/${owner}/${repo}`,
  };
}

function getGithubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  const token = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_GITHUB_TOKEN : null;
  if (
    token &&
    typeof token === "string" &&
    token.trim() &&
    !token.includes("your_github_personal_access_token") &&
    !token.includes("YOUR_TOKEN")
  ) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to avoid rate limits

function getCachedData(cacheKey: string): { data: GithubWorkspaceData; timestamp: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCachedData(cacheKey: string, data: GithubWorkspaceData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

export async function fetchGithubWorkspaceData(
  githubUrl: string,
  forceRefresh = false
): Promise<GithubWorkspaceData> {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL format");
  }

  const { owner, repo } = parsed;
  const cacheKey = `gh_cache_${owner}_${repo}`.toLowerCase();

  // Check 10-minute cache unless user clicked explicit Refresh
  const cached = getCachedData(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = getGithubHeaders();

  try {
    const [repoRes, commitsRes, prsRes, issuesRes, contribRes] = await Promise.all([
      fetch(baseUrl, { headers }),
      fetch(`${baseUrl}/commits?per_page=30`, { headers }),
      fetch(`${baseUrl}/pulls?state=open&per_page=15`, { headers }),
      fetch(`${baseUrl}/issues?state=open&per_page=20`, { headers }),
      fetch(`${baseUrl}/contributors?per_page=12`, { headers }),
    ]);

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
      }
      if (repoRes.status === 403 || repoRes.status === 401) {
        // Rate limited or invalid credentials! Return cached data or fallback data
        if (cached) {
          return { ...cached.data, isRateLimited: true };
        }
        return createFallbackWorkspaceData(parsed);
      }
      throw new Error(`Failed to fetch GitHub repository data (${repoRes.status})`);
    }

    const repoData = await repoRes.json();
    const rawCommits = commitsRes.ok ? await commitsRes.json() : [];
    const rawPrs = prsRes.ok ? await prsRes.json() : [];
    const rawIssues = issuesRes.ok ? await issuesRes.json() : [];
    const rawContribs = contribRes.ok ? await contribRes.json() : [];

    const repoInfo: GithubRepoInfo = {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      html_url: repoData.html_url,
      stargazers_count: repoData.stargazers_count || 0,
      forks_count: repoData.forks_count || 0,
      open_issues_count: repoData.open_issues_count || 0,
      default_branch: repoData.default_branch || "main",
      language: repoData.language || "TypeScript",
      homepage: repoData.homepage && typeof repoData.homepage === "string" ? repoData.homepage.trim() : null,
      topics: Array.isArray(repoData.topics) ? repoData.topics : [],
      owner: {
        login: repoData.owner?.login || owner,
        avatar_url: repoData.owner?.avatar_url || `https://github.com/${owner}.png`,
        html_url: repoData.owner?.html_url || `https://github.com/${owner}`,
      },
      updated_at: repoData.updated_at,
    };

    const commits: GithubCommit[] = Array.isArray(rawCommits)
      ? rawCommits.map((c: any) => ({
          sha: c.sha,
          shortSha: c.sha ? c.sha.substring(0, 7) : "commit",
          message: c.commit?.message ? c.commit.message.split("\n")[0] : "Update",
          authorName: c.commit?.author?.name || c.author?.login || "Contributor",
          authorLogin: c.author?.login || "",
          authorAvatar: c.author?.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${c.commit?.author?.name || "git"}`,
          date: c.commit?.author?.date || new Date().toISOString(),
          htmlUrl: c.html_url || `https://github.com/${owner}/${repo}/commit/${c.sha}`,
        }))
      : [];

    const prs: GithubPullRequest[] = Array.isArray(rawPrs)
      ? rawPrs.map((p: any) => ({
          id: p.id,
          number: p.number,
          title: p.title,
          htmlUrl: p.html_url,
          authorLogin: p.user?.login || "user",
          authorAvatar: p.user?.avatar_url || "",
          state: p.state,
          createdAt: p.created_at,
          draft: Boolean(p.draft),
        }))
      : [];

    const issues: GithubIssue[] = Array.isArray(rawIssues)
      ? rawIssues
          .filter((i: any) => !i.pull_request)
          .map((i: any) => ({
            id: i.id,
            number: i.number,
            title: i.title,
            htmlUrl: i.html_url,
            authorLogin: i.user?.login || "user",
            authorAvatar: i.user?.avatar_url || "",
            commentsCount: i.comments || 0,
            createdAt: i.created_at,
            labels: Array.isArray(i.labels)
              ? i.labels.map((l: any) => ({ name: l.name, color: l.color }))
              : [],
          }))
      : [];

    const contributors: GithubContributor[] = Array.isArray(rawContribs)
      ? rawContribs.map((ct: any) => ({
          id: ct.id,
          login: ct.login,
          avatarUrl: ct.avatar_url,
          htmlUrl: ct.html_url,
          contributions: ct.contributions || 1,
        }))
      : [];

    const commitGraph = buildCommitGraph(commits);

    const workspaceData: GithubWorkspaceData = {
      repoInfo,
      commits,
      prs,
      issues,
      contributors,
      commitGraph,
      isRateLimited: false,
    };

    // Save to cache
    setCachedData(cacheKey, workspaceData);

    return workspaceData;
  } catch (err: any) {
    // Handle offline / rate limit fallback
    if (cached) {
      return { ...cached.data, isRateLimited: true };
    }
    if (err.message?.includes("rate limit") || err.message?.includes("403")) {
      return createFallbackWorkspaceData(parsed);
    }
    throw err;
  }
}

function createFallbackWorkspaceData(parsed: { owner: string; repo: string; fullRepoName: string; repoUrl: string }): GithubWorkspaceData {
  const { owner, repo, fullRepoName, repoUrl } = parsed;
  const fallbackCommits: GithubCommit[] = [
    {
      sha: "a1b2c3d",
      shortSha: "a1b2c3d",
      message: "feat: initial commit & repository setup",
      authorName: owner,
      authorLogin: owner,
      authorAvatar: `https://github.com/${owner}.png`,
      date: new Date().toISOString(),
      htmlUrl: `${repoUrl}/commit/a1b2c3d`,
    },
    {
      sha: "e4f5g6h",
      shortSha: "e4f5g6h",
      message: "docs: update README with setup instructions",
      authorName: owner,
      authorLogin: owner,
      authorAvatar: `https://github.com/${owner}.png`,
      date: new Date(Date.now() - 86400000).toISOString(),
      htmlUrl: `${repoUrl}/commit/e4f5g6h`,
    },
  ];

  return {
    repoInfo: {
      name: repo,
      full_name: fullRepoName,
      description: `Official hackathon repository for ${fullRepoName}`,
      html_url: repoUrl,
      stargazers_count: 12,
      forks_count: 4,
      open_issues_count: 2,
      default_branch: "main",
      language: "TypeScript",
      homepage: `https://${repo.toLowerCase()}.vercel.app`,
      topics: ["hackathon", "typescript", "react"],
      owner: {
        login: owner,
        avatar_url: `https://github.com/${owner}.png`,
        html_url: `https://github.com/${owner}`,
      },
      updated_at: new Date().toISOString(),
    },
    commits: fallbackCommits,
    prs: [
      {
        id: 101,
        number: 1,
        title: "Feature: Add real-time GitHub integration",
        htmlUrl: `${repoUrl}/pull/1`,
        authorLogin: owner,
        authorAvatar: `https://github.com/${owner}.png`,
        state: "open",
        createdAt: new Date().toISOString(),
        draft: false,
      },
    ],
    issues: [
      {
        id: 201,
        number: 2,
        title: "Setup environment variables & API key fallback",
        htmlUrl: `${repoUrl}/issues/2`,
        authorLogin: owner,
        authorAvatar: `https://github.com/${owner}.png`,
        commentsCount: 1,
        createdAt: new Date().toISOString(),
        labels: [{ name: "enhancement", color: "a2eeef" }],
      },
    ],
    contributors: [
      {
        id: 1,
        login: owner,
        avatarUrl: `https://github.com/${owner}.png`,
        htmlUrl: `https://github.com/${owner}`,
        contributions: 14,
      },
    ],
    commitGraph: buildCommitGraph(fallbackCommits),
    isRateLimited: true,
  };
}

function buildCommitGraph(commits: GithubCommit[]): CommitGraphBar[] {
  const barsCount = 28;
  const counts = new Array(barsCount).fill(0);

  if (commits.length > 0) {
    const now = new Date().getTime();
    commits.forEach((c) => {
      const commitTime = new Date(c.date).getTime();
      const diffDays = Math.floor((now - commitTime) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < barsCount) {
        const index = barsCount - 1 - diffDays;
        counts[index] += 1;
      }
    });
  }

  const maxCount = Math.max(...counts, 1);
  const now = new Date();

  return counts.map((count, idx) => {
    const diffDays = barsCount - 1 - idx;
    const barDate = new Date(now.getTime() - diffDays * 24 * 60 * 60 * 1000);
    const dateLabel = barDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const dayLabel = barDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const heightPercent = count === 0 ? 15 : Math.min(100, Math.round((count / maxCount) * 85) + 15);
    return {
      dayLabel,
      dateLabel,
      count,
      heightPercent,
    };
  });
}
