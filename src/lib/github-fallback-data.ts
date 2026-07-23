import type { CommitEntry, Contributor } from "@/lib/github"

const AVATAR_COLORS = ["#7c6f64", "#5b6f5a", "#5a6a7c", "#7c5a6a", "#6a5a7c"]

function seedIndex(seed: string): number {
  let hash = 0
  for (const char of seed) hash += char.charCodeAt(0)
  return hash
}

function initialsAvatar(seed: string): string {
  const color = AVATAR_COLORS[seedIndex(seed) % AVATAR_COLORS.length]
  const initials = seed.slice(0, 2).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}"/><text x="40" y="49" font-family="sans-serif" font-size="28" fill="white" text-anchor="middle">${initials}</text></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export const FALLBACK_CONTRIBUTORS: Contributor[] = [
  {
    login: "octo-builder",
    htmlUrl: "https://github.com/octo-builder",
    avatarUrl: initialsAvatar("octo-builder"),
    contributions: 128,
    topRepos: [
      { name: "factory-planner", htmlUrl: "https://github.com/octo-builder/factory-planner", stars: 342 },
      { name: "conveyor-sim", htmlUrl: "https://github.com/octo-builder/conveyor-sim", stars: 210 },
      { name: "tileset-tools", htmlUrl: "https://github.com/octo-builder/tileset-tools", stars: 87 },
    ],
  },
  {
    login: "pixel-forge",
    htmlUrl: "https://github.com/pixel-forge",
    avatarUrl: initialsAvatar("pixel-forge"),
    contributions: 96,
    topRepos: [
      { name: "isometric-toolkit", htmlUrl: "https://github.com/pixel-forge/isometric-toolkit", stars: 512 },
      { name: "sprite-batcher", htmlUrl: "https://github.com/pixel-forge/sprite-batcher", stars: 178 },
      { name: "save-file-inspector", htmlUrl: "https://github.com/pixel-forge/save-file-inspector", stars: 64 },
    ],
  },
  {
    login: "route-wrangler",
    htmlUrl: "https://github.com/route-wrangler",
    avatarUrl: initialsAvatar("route-wrangler"),
    contributions: 54,
    topRepos: [
      { name: "pathfinding-bench", htmlUrl: "https://github.com/route-wrangler/pathfinding-bench", stars: 130 },
      { name: "belt-router", htmlUrl: "https://github.com/route-wrangler/belt-router", stars: 45 },
      { name: "warehouse-layouts", htmlUrl: "https://github.com/route-wrangler/warehouse-layouts", stars: 12 },
    ],
  },
]

export const FALLBACK_COMMITS: CommitEntry[] = [
  {
    sha: "a1b2c3d",
    message: "Add automation subpage draft",
    authorName: "octo-builder",
    date: "2026-07-20T14:32:00Z",
    htmlUrl: "https://github.com/octo-builder/tycoon-secrets-wiki/commit/a1b2c3d",
  },
  {
    sha: "e4f5a6b",
    message: "Document known exploits section",
    authorName: "route-wrangler",
    date: "2026-07-18T09:12:00Z",
    htmlUrl: "https://github.com/octo-builder/tycoon-secrets-wiki/commit/e4f5a6b",
  },
  {
    sha: "c7d8e9f",
    message: "Fix broken image path on factories page",
    authorName: "pixel-forge",
    date: "2026-07-15T18:47:00Z",
    htmlUrl: "https://github.com/octo-builder/tycoon-secrets-wiki/commit/c7d8e9f",
  },
  {
    sha: "f0a1b2c",
    message: "Reorganize logistics tips into a list",
    authorName: "octo-builder",
    date: "2026-07-11T08:03:00Z",
    htmlUrl: "https://github.com/octo-builder/tycoon-secrets-wiki/commit/f0a1b2c",
  },
  {
    sha: "d3e4f5a",
    message: "Initial wiki scaffolding",
    authorName: "octo-builder",
    date: "2026-07-05T21:15:00Z",
    htmlUrl: "https://github.com/octo-builder/tycoon-secrets-wiki/commit/d3e4f5a",
  },
]
