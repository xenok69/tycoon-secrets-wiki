import { FALLBACK_COMMITS, FALLBACK_CONTRIBUTORS } from "@/lib/github-fallback-data"

export const GITHUB_REPO = "xenok69/tycoon-secrets-wiki"
export const GITHUB_BRANCH = "main"

const GITHUB_API = "https://api.github.com"

export interface RepoSummary {
  name: string
  htmlUrl: string
  stars: number
}

export interface Contributor {
  login: string
  htmlUrl: string
  avatarUrl: string
  contributions: number
  topRepos: RepoSummary[]
}

export interface CommitEntry {
  sha: string
  message: string
  authorName: string
  date: string
  htmlUrl: string
}

export type FallbackReason = "rate-limited" | "unavailable"

export type GithubResult<T> =
  | { status: "live"; data: T }
  | { status: "fallback"; data: T; reason: FallbackReason }

export function fallbackMessage(reason: FallbackReason): string {
  return reason === "rate-limited"
    ? "Rate limit erreicht, Daten können nicht aktuell sein."
    : "Live-Daten von GitHub nicht verfügbar – Beispieldaten werden angezeigt."
}

function githubFetch(path: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  })
}

function isRateLimited(res: Response): boolean {
  return res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0"
}

interface RawContributor {
  login: string
  html_url: string
  avatar_url: string
  contributions: number
}

interface RawRepo {
  name: string
  html_url: string
  stargazers_count: number
}

interface RawCommit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
}

async function fetchTopRepos(username: string): Promise<RepoSummary[]> {
  try {
    const res = await githubFetch(
      `/users/${username}/repos?sort=stars&direction=desc&per_page=3`
    )
    if (!res.ok) return []
    const repos: RawRepo[] = await res.json()
    return repos.map((r) => ({
      name: r.name,
      htmlUrl: r.html_url,
      stars: r.stargazers_count,
    }))
  } catch {
    return []
  }
}

export async function fetchContributors(): Promise<GithubResult<Contributor[]>> {
  try {
    const res = await githubFetch(`/repos/${GITHUB_REPO}/contributors?per_page=20`)
    if (!res.ok) {
      return {
        status: "fallback",
        data: FALLBACK_CONTRIBUTORS,
        reason: isRateLimited(res) ? "rate-limited" : "unavailable",
      }
    }
    const contributors: RawContributor[] = await res.json()
    const withTopRepos = await Promise.all(
      contributors.map(async (c) => ({
        login: c.login,
        htmlUrl: c.html_url,
        avatarUrl: c.avatar_url,
        contributions: c.contributions,
        topRepos: await fetchTopRepos(c.login),
      }))
    )
    return { status: "live", data: withTopRepos }
  } catch {
    return { status: "fallback", data: FALLBACK_CONTRIBUTORS, reason: "unavailable" }
  }
}

export async function fetchRecentCommits(): Promise<GithubResult<CommitEntry[]>> {
  try {
    const res = await githubFetch(
      `/repos/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&per_page=20`
    )
    if (!res.ok) {
      return {
        status: "fallback",
        data: FALLBACK_COMMITS,
        reason: isRateLimited(res) ? "rate-limited" : "unavailable",
      }
    }
    const commits: RawCommit[] = await res.json()
    return {
      status: "live",
      data: commits.map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        authorName: c.commit.author.name,
        date: c.commit.author.date,
        htmlUrl: c.html_url,
      })),
    }
  } catch {
    return { status: "fallback", data: FALLBACK_COMMITS, reason: "unavailable" }
  }
}
