import { parseDifficultyTag } from "@/lib/difficulty"

export interface WikiPageMeta {
  tags?: string[]
  visible?: boolean
}

export interface WikiPage {
  /** URL path segments, e.g. ["factories", "automation"] */
  path: string[]
  /** Joined path, e.g. "factories/automation" ("" for the root) */
  slug: string
  /** Real on-disk path segments, e.g. ["white-palace", "1-stud-difficulty",
   * "Deeper"]. Differs from `path` for pages hoisted out of a
   * <n>-stud-difficulty folder. Used only for asset resolution. */
  sourcePath: string[]
  title: string
  hasContent: boolean
  content: string
  /** From this page's meta.json, defaults to [] */
  tags: string[]
  /** From this page's meta.json, defaults to true. Hidden pages are still
   * reachable by direct link but are left out of nav, search, and listings. */
  visible: boolean
  /** Set when this page was hoisted out of a <n>-stud-difficulty folder. */
  difficultyLevel?: number
  children: WikiPage[]
}

const rawModules = import.meta.glob<string>("/src/content/**/index.md", {
  eager: true,
  query: "?raw",
  import: "default",
})

const metaModules = import.meta.glob<WikiPageMeta>(
  "/src/content/**/meta.json",
  { eager: true, import: "default" }
)

const assetModules = import.meta.glob<string>(
  "/src/content/**/assets/*.{png,jpg,jpeg,gif,svg,webp,avif}",
  { eager: true, import: "default" }
)

function humanize(segment: string): string {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function titleFromContent(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

function pathFromModuleKey(key: string): string[] {
  return key
    .replace(/^\/src\/content\//, "")
    .replace(/\/(index\.md|meta\.json)$/, "")
    .split("/")
    .filter(Boolean)
}

const DIFFICULTY_FOLDER_PATTERN = /^([1-7])-stud-difficulty$/i

/**
 * Drops <n>-stud-difficulty segments from a raw on-disk path, returning the
 * public segments plus which public-segment index (if any) the level
 * applies to — the segment immediately after the difficulty folder.
 */
function stripDifficultyFolders(rawSegments: string[]): {
  publicSegments: string[]
  levelBySegmentIndex: Map<number, number>
} {
  const publicSegments: string[] = []
  const levelBySegmentIndex = new Map<number, number>()
  let pendingLevel: number | undefined

  for (const segment of rawSegments) {
    const match = segment.match(DIFFICULTY_FOLDER_PATTERN)
    if (match) {
      pendingLevel = Number(match[1])
      continue
    }
    publicSegments.push(segment)
    if (pendingLevel !== undefined) {
      levelBySegmentIndex.set(publicSegments.length - 1, pendingLevel)
      pendingLevel = undefined
    }
  }

  return { publicSegments, levelBySegmentIndex }
}

/** Strips any manual "n stud" tag and prepends the correct one derived from
 * the folder-hoisted difficulty level (if any). Exported for testing. */
export function tagsWithDifficulty(
  level: number | undefined,
  metaTags: string[]
): string[] {
  const withoutManual = metaTags.filter((tag) => parseDifficultyTag(tag) === undefined)
  if (level === undefined) return withoutManual
  return [`${level} stud`, ...withoutManual]
}

function getOrCreateChild(parent: WikiPage, segment: string): WikiPage {
  const existing = parent.children.find((c) => c.path.at(-1) === segment)
  if (existing) return existing
  const path = [...parent.path, segment]
  const child: WikiPage = {
    path,
    slug: path.join("/"),
    sourcePath: path,
    title: humanize(segment),
    hasContent: false,
    content: "",
    tags: [],
    visible: true,
    children: [],
  }
  parent.children.push(child)
  return child
}

function buildTree(): WikiPage {
  const root: WikiPage = {
    path: [],
    slug: "",
    sourcePath: [],
    title: "Home",
    hasContent: false,
    content: "",
    tags: [],
    visible: true,
    children: [],
  }

  for (const [key, content] of Object.entries(rawModules)) {
    const rawSegments = pathFromModuleKey(key)
    const { publicSegments, levelBySegmentIndex } = stripDifficultyFolders(rawSegments)
    let node = root
    publicSegments.forEach((segment, i) => {
      node = getOrCreateChild(node, segment)
      const level = levelBySegmentIndex.get(i)
      if (level !== undefined) node.difficultyLevel = level
    })
    node.sourcePath = rawSegments
    node.hasContent = true
    node.content = content
    node.title = titleFromContent(content, node.title)
  }

  for (const [key, meta] of Object.entries(metaModules)) {
    const rawSegments = pathFromModuleKey(key)
    const { publicSegments, levelBySegmentIndex } = stripDifficultyFolders(rawSegments)
    let node = root
    publicSegments.forEach((segment, i) => {
      node = getOrCreateChild(node, segment)
      const level = levelBySegmentIndex.get(i)
      if (level !== undefined) node.difficultyLevel = level
    })
    node.sourcePath = rawSegments

    node.tags = meta.tags ?? []
    node.visible = meta.visible ?? true
  }

  const applyDifficultyTags = (node: WikiPage) => {
    node.tags = tagsWithDifficulty(node.difficultyLevel, node.tags)
    node.children.forEach(applyDifficultyTags)
  }
  applyDifficultyTags(root)

  const sortTree = (node: WikiPage) => {
    node.children.sort((a, b) => a.title.localeCompare(b.title))
    node.children.forEach(sortTree)
  }
  sortTree(root)

  return root
}

const tree = buildTree()

export function getTree(): WikiPage {
  return tree
}

export function findPage(path: string[]): WikiPage | undefined {
  let node = tree
  for (const segment of path) {
    const next = node.children.find((c) => c.path.at(-1) === segment)
    if (!next) return undefined
    node = next
  }
  return node
}

/** Excludes hidden pages and their entire subtree (still reachable by direct link). */
export function flattenPages(node: WikiPage = tree): WikiPage[] {
  const result: WikiPage[] = []
  if (node.path.length > 0) {
    if (!node.visible) return result
    result.push(node)
  }
  for (const child of node.children) {
    result.push(...flattenPages(child))
  }
  return result
}

/**
 * Leveled pages (hoisted out of a <n>-stud-difficulty folder) first, hardest
 * to easiest, alphabetical within a level. Unleveled pages/folders after:
 * pages before folders, alphabetical within each group.
 */
export function visibleChildren(node: WikiPage): WikiPage[] {
  return node.children
    .filter((child) => child.visible)
    .sort((a, b) => {
      const aLeveled = a.difficultyLevel !== undefined
      const bLeveled = b.difficultyLevel !== undefined
      if (aLeveled !== bLeveled) return aLeveled ? -1 : 1

      if (aLeveled && bLeveled && a.difficultyLevel !== b.difficultyLevel) {
        return b.difficultyLevel! - a.difficultyLevel!
      }

      if (!aLeveled) {
        const aIsFolder = a.children.length > 0
        const bIsFolder = b.children.length > 0
        if (aIsFolder !== bIsFolder) return aIsFolder ? 1 : -1
      }

      return a.title.localeCompare(b.title)
    })
}

/**
 * Resolves a markdown-relative image path (e.g. "assets/foo.png" or
 * "./assets/foo.png") against the page it appears on to the bundled asset URL.
 */
export function resolveAssetUrl(
  sourcePath: string[],
  relativeSrc: string
): string | undefined {
  if (/^([a-z]+:)?\/\//i.test(relativeSrc) || relativeSrc.startsWith("data:")) {
    return relativeSrc
  }
  const cleaned = relativeSrc.replace(/^\.\//, "")
  const key = `/src/content/${[...sourcePath, cleaned].join("/")}`
  return assetModules[key]
}
