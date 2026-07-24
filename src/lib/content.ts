export interface WikiPageMeta {
  tags?: string[]
  visible?: boolean
}

export interface WikiPage {
  /** URL path segments, e.g. ["factories", "automation"] */
  path: string[]
  /** Joined path, e.g. "factories/automation" ("" for the root) */
  slug: string
  title: string
  hasContent: boolean
  content: string
  /** From this page's meta.json, defaults to [] */
  tags: string[]
  /** From this page's meta.json, defaults to true. Hidden pages are still
   * reachable by direct link but are left out of nav, search, and listings. */
  visible: boolean
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

function getOrCreateChild(parent: WikiPage, segment: string): WikiPage {
  const existing = parent.children.find((c) => c.path.at(-1) === segment)
  if (existing) return existing
  const child: WikiPage = {
    path: [...parent.path, segment],
    slug: [...parent.path, segment].join("/"),
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
    title: "Home",
    hasContent: false,
    content: "",
    tags: [],
    visible: true,
    children: [],
  }

  for (const [key, content] of Object.entries(rawModules)) {
    const segments = pathFromModuleKey(key)
    let node = root
    for (const segment of segments) {
      node = getOrCreateChild(node, segment)
    }
    node.hasContent = true
    node.content = content
    node.title = titleFromContent(content, node.title)
  }

  for (const [key, meta] of Object.entries(metaModules)) {
    const segments = pathFromModuleKey(key)
    let node = root
    for (const segment of segments) {
      node = getOrCreateChild(node, segment)
    }
    node.tags = meta.tags ?? []
    node.visible = meta.visible ?? true
  }

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

/** Pages before folders, alphabetical within each group. */
export function visibleChildren(node: WikiPage): WikiPage[] {
  return node.children
    .filter((child) => child.visible)
    .sort((a, b) => {
      const aIsFolder = a.children.length > 0
      const bIsFolder = b.children.length > 0
      if (aIsFolder !== bIsFolder) return aIsFolder ? 1 : -1
      return a.title.localeCompare(b.title)
    })
}

/**
 * Resolves a markdown-relative image path (e.g. "assets/foo.png" or
 * "./assets/foo.png") against the page it appears on to the bundled asset URL.
 */
export function resolveAssetUrl(
  pagePath: string[],
  relativeSrc: string
): string | undefined {
  if (/^([a-z]+:)?\/\//i.test(relativeSrc) || relativeSrc.startsWith("data:")) {
    return relativeSrc
  }
  const cleaned = relativeSrc.replace(/^\.\//, "")
  const key = `/src/content/${[...pagePath, cleaned].join("/")}`
  return assetModules[key]
}
