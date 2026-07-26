# Difficulty Tag Colors & Difficulty-Folder Collapsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle wiki tags to gray/black except for a color-coded difficulty tag, and make `<n>-stud-difficulty` content folders structural-only — hoisted into their parent's URL/sidebar position with a small color dot instead of being a visitable tree level.

**Architecture:** A new `src/lib/difficulty.ts` module is the single source of truth for the 1–7 difficulty color palette and for recognizing `"n stud"` tags; a new `TagBadge` component and CSS classes consume it for rendering. Separately, `src/lib/content.ts`'s tree builder is extended to strip `<n>-stud-difficulty` path segments while walking `import.meta.glob` keys, attaching the parsed level to the next real page node instead of creating a node for the folder itself. The two features share only the color/pattern module — they can be built and verified independently.

**Tech Stack:** React 19 + TypeScript, Vite 8, Tailwind CSS v4 (oklch theme, `color-mix`), Vitest (new — no test runner exists in this repo yet).

## Global Constraints

- Difficulty tag pattern is exactly `"n stud"` (case-insensitive), n = 1–7. Values outside 1–7 (e.g. `"8 stud"`) are treated as ordinary tags — no color, no reordering.
- Difficulty color assignments: 1=Green, 2=Yellow, 3=Red, 4=Rose, 5=Blue, 6=White, 7=Black.
- The difficulty tag, wherever a tag list is rendered, is always sorted first.
- Ordinary (non-difficulty) tags render with the site's existing gray/secondary badge style — never the purple `primary` color currently used by default `<Badge>`.
- Difficulty-folder detection is name-pattern-only (`^([1-7])-stud-difficulty$`, case-insensitive) — no new `meta.json` files are created for the folders themselves.
- A hoisted page's own `meta.json` `"n stud"` tag (if present) is ignored/stripped; the tag shown is always derived from the folder it was hoisted out of.
- The difficulty dot indicator appears only in the sidebar tree (not the subpage list, not search results).
- No conflict detection for name collisions after hoisting (documented constraint, not solved).

---

## File Structure

- `src/lib/difficulty.ts` (new) — `DIFFICULTY_COLORS`, `parseDifficultyTag`, `sortDifficultyFirst`. Pure logic, unit tested.
- `src/lib/difficulty.test.ts` (new)
- `src/index.css` (modify) — `.tag-difficulty-N` / `.dot-difficulty-N` / `.text-difficulty-N` classes for N=1–7.
- `src/components/tag-badge.tsx` (new) — `TagBadge` component used everywhere a tag pill is rendered.
- `src/components/difficulty.tsx` (modify) — inline prose `<Difficulty>` component switches to the shared color map.
- `src/pages/wiki-page.tsx` (modify) — `TagList` uses `TagBadge` + `sortDifficultyFirst`.
- `src/pages/search-page.tsx` (modify) — tag pills and the "filtering by tag" badge use `TagBadge` + `sortDifficultyFirst`.
- `src/lib/content.ts` (modify) — `WikiPage` gains `difficultyLevel?` and `sourcePath`; `buildTree` hoists difficulty-folder children; `resolveAssetUrl` resolves against `sourcePath`.
- `src/lib/content.test.ts` (new)
- `src/components/app-sidebar.tsx` (modify) — `WikiTreeItem` renders a difficulty dot.
- 5 existing `meta.json` files under `1-stud-difficulty` folders (modify) — remove the now-redundant `"1 stud"` tag.
- `src/content/white-palace/index.md` (modify) — update the aspirational `Rich` link to the hoisted URL form.
- `vitest.config.ts` (new), `package.json` (modify) — add Vitest as the project's first test runner.

---

### Task 1: Shared difficulty color system

**Files:**
- Create: `src/lib/difficulty.ts`
- Create: `src/lib/difficulty.test.ts`
- Modify: `src/index.css`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` devDependency + `"test"` script)

**Interfaces:**
- Produces: `parseDifficultyTag(tag: string): number | undefined`, `sortDifficultyFirst(tags: string[]): string[]`, `DIFFICULTY_COLORS: Record<number, { tag: string; dot: string; text: string }>` — all exported from `src/lib/difficulty.ts`, consumed by every later task.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Add the Vitest config**

Create `vitest.config.ts`:

```ts
import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
})
```

- [ ] **Step 3: Add the `test` script**

In `package.json`, inside `"scripts"`, add (after `"lint"`):

```json
    "test": "vitest run",
```

- [ ] **Step 4: Write the failing tests**

Create `src/lib/difficulty.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { DIFFICULTY_COLORS, parseDifficultyTag, sortDifficultyFirst } from "./difficulty"

describe("parseDifficultyTag", () => {
  it.each([
    ["1 stud", 1],
    ["2 stud", 2],
    ["7 stud", 7],
  ])("parses %s as level %d", (tag, level) => {
    expect(parseDifficultyTag(tag)).toBe(level)
  })

  it("is case-insensitive", () => {
    expect(parseDifficultyTag("3 Stud")).toBe(3)
  })

  it("ignores levels above 7", () => {
    expect(parseDifficultyTag("8 stud")).toBeUndefined()
  })

  it("ignores levels below 1", () => {
    expect(parseDifficultyTag("0 stud")).toBeUndefined()
  })

  it("ignores unrelated tags", () => {
    expect(parseDifficultyTag("secret")).toBeUndefined()
  })
})

describe("sortDifficultyFirst", () => {
  it("moves the difficulty tag to the front", () => {
    expect(
      sortDifficultyFirst(["secret", "easy", "1 stud", "plain text"])
    ).toEqual(["1 stud", "secret", "easy", "plain text"])
  })

  it("leaves order unchanged when there is no difficulty tag", () => {
    expect(sortDifficultyFirst(["secret", "easy"])).toEqual(["secret", "easy"])
  })

  it("leaves order unchanged when the difficulty tag is already first", () => {
    expect(sortDifficultyFirst(["1 stud", "secret"])).toEqual(["1 stud", "secret"])
  })
})

describe("DIFFICULTY_COLORS", () => {
  it("has an entry for every level 1-7", () => {
    for (let level = 1; level <= 7; level++) {
      expect(DIFFICULTY_COLORS[level]).toBeDefined()
    }
  })
})
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npx vitest run src/lib/difficulty.test.ts`
Expected: FAIL — `Cannot find module './difficulty'` (the module doesn't exist yet).

- [ ] **Step 6: Implement `src/lib/difficulty.ts`**

```ts
export interface DifficultyColor {
  /** Full badge: tinted background + border + text. */
  tag: string
  /** Solid dot fill, used at small sizes (sidebar). */
  dot: string
  /** Text-only tint, used for inline prose callouts. */
  text: string
}

export const DIFFICULTY_COLORS: Record<number, DifficultyColor> = {
  1: { tag: "tag-difficulty-1", dot: "dot-difficulty-1", text: "text-difficulty-1" },
  2: { tag: "tag-difficulty-2", dot: "dot-difficulty-2", text: "text-difficulty-2" },
  3: { tag: "tag-difficulty-3", dot: "dot-difficulty-3", text: "text-difficulty-3" },
  4: { tag: "tag-difficulty-4", dot: "dot-difficulty-4", text: "text-difficulty-4" },
  5: { tag: "tag-difficulty-5", dot: "dot-difficulty-5", text: "text-difficulty-5" },
  6: { tag: "tag-difficulty-6", dot: "dot-difficulty-6", text: "text-difficulty-6" },
  7: { tag: "tag-difficulty-7", dot: "dot-difficulty-7", text: "text-difficulty-7" },
}

const DIFFICULTY_TAG_PATTERN = /^([1-7]) stud$/i

/** Parses a tag like "3 stud" into its difficulty level, or undefined if it doesn't match. */
export function parseDifficultyTag(tag: string): number | undefined {
  const match = tag.match(DIFFICULTY_TAG_PATTERN)
  if (!match) return undefined
  return Number(match[1])
}

/** Returns a copy of tags with the difficulty tag (if any) moved to the front. */
export function sortDifficultyFirst(tags: string[]): string[] {
  const index = tags.findIndex((tag) => parseDifficultyTag(tag) !== undefined)
  if (index <= 0) return tags
  const copy = [...tags]
  const [difficultyTag] = copy.splice(index, 1)
  copy.unshift(difficultyTag)
  return copy
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/lib/difficulty.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 8: Add the CSS color classes**

In `src/index.css`, insert this new block immediately after the `.dark { ... }` block and before `@layer base`:

```css
:root {
    --difficulty-1: oklch(0.723 0.219 149.579);
    --difficulty-2: oklch(0.795 0.184 86.047);
    --difficulty-3: oklch(0.637 0.237 25.331);
    --difficulty-4: oklch(0.645 0.246 16.439);
    --difficulty-5: oklch(0.546 0.245 262.881);
    --difficulty-6: oklch(1 0 0);
    --difficulty-7: oklch(0 0 0);
}

.tag-difficulty-1, .tag-difficulty-2, .tag-difficulty-3, .tag-difficulty-4,
.tag-difficulty-5, .tag-difficulty-6, .tag-difficulty-7 {
    border-width: 1px;
}
.tag-difficulty-1 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-1) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-1) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-1) 50%); }
.tag-difficulty-2 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-2) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-2) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-2) 50%); }
.tag-difficulty-3 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-3) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-3) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-3) 50%); }
.tag-difficulty-4 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-4) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-4) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-4) 50%); }
.tag-difficulty-5 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-5) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-5) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-5) 50%); }
.tag-difficulty-6 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-6) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-6) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-6) 50%); }
.tag-difficulty-7 { background: color-mix(in oklch, var(--background) 82%, var(--difficulty-7) 18%); color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-7) 45%); border-color: color-mix(in oklch, var(--border) 50%, var(--difficulty-7) 50%); }

.dot-difficulty-1 { background: color-mix(in oklch, var(--difficulty-1) 80%, var(--foreground) 20%); }
.dot-difficulty-2 { background: color-mix(in oklch, var(--difficulty-2) 80%, var(--foreground) 20%); }
.dot-difficulty-3 { background: color-mix(in oklch, var(--difficulty-3) 80%, var(--foreground) 20%); }
.dot-difficulty-4 { background: color-mix(in oklch, var(--difficulty-4) 80%, var(--foreground) 20%); }
.dot-difficulty-5 { background: color-mix(in oklch, var(--difficulty-5) 80%, var(--foreground) 20%); }
.dot-difficulty-6 { background: color-mix(in oklch, var(--difficulty-6) 80%, var(--foreground) 20%); }
.dot-difficulty-7 { background: color-mix(in oklch, var(--difficulty-7) 80%, var(--foreground) 20%); }

.text-difficulty-1 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-1) 45%); }
.text-difficulty-2 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-2) 45%); }
.text-difficulty-3 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-3) 45%); }
.text-difficulty-4 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-4) 45%); }
.text-difficulty-5 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-5) 45%); }
.text-difficulty-6 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-6) 45%); }
.text-difficulty-7 { color: color-mix(in oklch, var(--foreground) 55%, var(--difficulty-7) 45%); }
```

- [ ] **Step 9: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add src/lib/difficulty.ts src/lib/difficulty.test.ts src/index.css vitest.config.ts package.json package-lock.json
git commit -m "feat: add shared difficulty color system and Vitest"
```

---

### Task 2: `TagBadge` component

**Files:**
- Create: `src/components/tag-badge.tsx`

**Interfaces:**
- Consumes: `parseDifficultyTag` and `DIFFICULTY_COLORS` from `src/lib/difficulty.ts` (Task 1); `Badge` from `src/components/ui/badge.tsx`.
- Produces: `TagBadge({ tag: string }): JSX.Element`, consumed by Tasks 4 and 5.

- [ ] **Step 1: Implement the component**

Create `src/components/tag-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge"
import { DIFFICULTY_COLORS, parseDifficultyTag } from "@/lib/difficulty"

export function TagBadge({ tag }: { tag: string }) {
  const level = parseDifficultyTag(tag)

  if (level === undefined) {
    return <Badge variant="secondary">{tag}</Badge>
  }

  return (
    <Badge variant="outline" className={DIFFICULTY_COLORS[level].tag}>
      {tag}
    </Badge>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors. (No automated render test — this is a thin wrapper verified visually once wired into a page in Tasks 4/5.)

- [ ] **Step 3: Commit**

```bash
git add src/components/tag-badge.tsx
git commit -m "feat: add TagBadge component"
```

---

### Task 3: Refactor the inline prose `<Difficulty>` component

**Files:**
- Modify: `src/components/difficulty.tsx`

**Interfaces:**
- Consumes: `DIFFICULTY_COLORS` from `src/lib/difficulty.ts` (Task 1).

- [ ] **Step 1: Replace the hardcoded color map**

Replace the full contents of `src/components/difficulty.tsx`:

```tsx
import { DIFFICULTY_COLORS } from "@/lib/difficulty"

export function Difficulty({
  level,
  children,
}: {
  level?: string
  children: React.ReactNode
}) {
  const parsed = level ? Number(level) : undefined
  const colors = parsed !== undefined ? DIFFICULTY_COLORS[parsed] : undefined

  return (
    <span className={`not-prose ${colors?.text ?? "text-muted-foreground"}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the White Palace page (`#/white-palace`). Confirm each "N Stud difficulty" phrase in the "Difficulties" section is tinted using the new palette (green/yellow/red/rose/blue for 1–5) instead of the old `text-green-400`-style colors, in both light and dark mode (toggle via the sidebar theme button).

- [ ] **Step 4: Commit**

```bash
git add src/components/difficulty.tsx
git commit -m "refactor: share difficulty colors between prose callout and tags"
```

---

### Task 4: Restyle `TagList` on the wiki page

**Files:**
- Modify: `src/pages/wiki-page.tsx:19,35-60`

**Interfaces:**
- Consumes: `TagBadge` (Task 2), `sortDifficultyFirst` (Task 1).

- [ ] **Step 1: Replace the `Badge` import and `TagList` function**

In `src/pages/wiki-page.tsx`, remove:

```tsx
import { Badge } from "@/components/ui/badge"
```

Add in its place:

```tsx
import { TagBadge } from "@/components/tag-badge"
import { sortDifficultyFirst } from "@/lib/difficulty"
```

Replace the `TagList` function (currently lines 35–60, the one with the hardcoded `tagColors` record) with:

```tsx
function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null

  return (
    <div className="not-prose mb-4 flex flex-wrap gap-1.5">
      {sortDifficultyFirst(tags).map((tag) => (
        <TagBadge key={tag} tag={tag} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open `#/white-palace/1-stud-difficulty/Deeper` (still reachable at the old nested URL until Task 6 hoists it). Confirm:
- `secret`, `easy`, `plain text` tags render as plain gray badges, not purple.
- The `1 stud` tag renders first, with the new green tint, regardless of its position in `meta.json`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/wiki-page.tsx
git commit -m "refactor: restyle TagList with shared difficulty colors"
```

---

### Task 5: Restyle tags on the search page

**Files:**
- Modify: `src/pages/search-page.tsx:9,131-186`

**Interfaces:**
- Consumes: `TagBadge` (Task 2), `sortDifficultyFirst` (Task 1).

- [ ] **Step 1: Replace the `Badge` import**

Remove:

```tsx
import { Badge } from "@/components/ui/badge"
```

Add:

```tsx
import { TagBadge } from "@/components/tag-badge"
import { sortDifficultyFirst } from "@/lib/difficulty"
```

- [ ] **Step 2: Update the "filtering by tag" badge**

Replace:

```tsx
          <a href={hrefForTag(tag)}>
            <Badge>{tag}</Badge>
          </a>
```

with:

```tsx
          <a href={hrefForTag(tag)}>
            <TagBadge tag={tag} />
          </a>
```

- [ ] **Step 3: Update the per-result tag list**

Replace:

```tsx
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <a key={t} href={hrefForTag(t)}>
                        <Badge variant="secondary">{t}</Badge>
                      </a>
                    ))}
                  </div>
                )}
```

with:

```tsx
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sortDifficultyFirst(item.tags).map((t) => (
                      <a key={t} href={hrefForTag(t)}>
                        <TagBadge tag={t} />
                      </a>
                    ))}
                  </div>
                )}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open `#/search`, search for a term that matches multiple pages with tags. Confirm difficulty tags are colored and sorted first, ordinary tags are gray. Click a difficulty tag to filter by it and confirm the "Filtering by tag" badge is also colored correctly.

- [ ] **Step 6: Commit**

```bash
git add src/pages/search-page.tsx
git commit -m "refactor: restyle search page tags with shared difficulty colors"
```

---

### Task 6: Hoist `<n>-stud-difficulty` folders in `content.ts`

**Files:**
- Modify: `src/lib/content.ts`
- Create: `src/lib/content.test.ts`

**Interfaces:**
- Consumes: `parseDifficultyTag` from `src/lib/difficulty.ts` (Task 1).
- Produces: `WikiPage.difficultyLevel?: number`, `WikiPage.sourcePath: string[]` — consumed by Task 7 (sidebar dot) and by `resolveAssetUrl` callers.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/content.test.ts`. This exercises the real content tree under `src/content/` (white-palace and greenhouse already have `1-stud-difficulty` folders), so no fixtures are needed:

```ts
import { describe, expect, it } from "vitest"
import { findPage } from "./content"

describe("difficulty folder hoisting", () => {
  it("hoists a page directly under its grandparent, skipping the difficulty folder", () => {
    const page = findPage(["white-palace", "Deeper"])
    expect(page).toBeDefined()
    expect(page?.difficultyLevel).toBe(1)
  })

  it("makes the raw difficulty-folder path unreachable", () => {
    expect(findPage(["white-palace", "1-stud-difficulty"])).toBeUndefined()
    expect(findPage(["white-palace", "1-stud-difficulty", "Deeper"])).toBeUndefined()
  })

  it("injects the difficulty tag first, ignoring any manual one in meta.json", () => {
    const page = findPage(["white-palace", "Deeper"])
    expect(page?.tags[0]).toBe("1 stud")
    expect(page?.tags.filter((t) => t === "1 stud")).toHaveLength(1)
  })

  it("does not list the difficulty folder as a child", () => {
    const whitePalace = findPage(["white-palace"])
    const childSegments = whitePalace?.children.map((c) => c.path.at(-1))
    expect(childSegments).toContain("Deeper")
    expect(childSegments).not.toContain("1-stud-difficulty")
  })

  it("keeps the real on-disk path separately for asset resolution", () => {
    const page = findPage(["white-palace", "Deeper"])
    expect(page?.sourcePath).toEqual(["white-palace", "1-stud-difficulty", "Deeper"])
  })

  it("hoists pages with punctuation in their folder name", () => {
    const page = findPage(["greenhouse", "Have a good water!"])
    expect(page).toBeDefined()
    expect(page?.difficultyLevel).toBe(1)
  })

  it("leaves pages outside a difficulty folder without a difficultyLevel", () => {
    const whitePalace = findPage(["white-palace"])
    expect(whitePalace?.difficultyLevel).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/content.test.ts`
Expected: FAIL — `findPage(["white-palace", "Deeper"])` is `undefined` (pages are still nested under `1-stud-difficulty`), and `page?.sourcePath` fails because `sourcePath` doesn't exist yet.

- [ ] **Step 3: Add `difficultyLevel` and `sourcePath` to the `WikiPage` type**

In `src/lib/content.ts`, update the `WikiPage` interface (currently lines 6–20):

```ts
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
```

- [ ] **Step 4: Add the import and the segment-stripping helper**

Add near the top of `src/lib/content.ts`, after the existing imports:

```ts
import { parseDifficultyTag } from "@/lib/difficulty"
```

Add near `pathFromModuleKey`:

```ts
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
```

- [ ] **Step 5: Update `getOrCreateChild` to default `sourcePath`**

Replace `getOrCreateChild` (currently lines 57–72):

```ts
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
```

- [ ] **Step 6: Rewrite `buildTree` to hoist difficulty-folder children**

Replace `buildTree` (currently lines 74–114):

```ts
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

    const tags = (meta.tags ?? []).filter((tag) => parseDifficultyTag(tag) === undefined)
    if (node.difficultyLevel !== undefined) {
      tags.unshift(`${node.difficultyLevel} stud`)
    }
    node.tags = tags
    node.visible = meta.visible ?? true
  }

  const sortTree = (node: WikiPage) => {
    node.children.sort((a, b) => a.title.localeCompare(b.title))
    node.children.forEach(sortTree)
  }
  sortTree(root)

  return root
}
```

- [ ] **Step 7: Update `resolveAssetUrl` to use `sourcePath`**

Replace the `resolveAssetUrl` signature and call (currently lines 161–171):

```ts
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
```

- [ ] **Step 8: Update the call site in `wiki-page.tsx`**

In `src/pages/wiki-page.tsx`, find:

```tsx
              const resolved =
                typeof src === "string"
                  ? (resolveAssetUrl(page.path, src) ?? src)
                  : src
```

Replace with:

```tsx
              const resolved =
                typeof src === "string"
                  ? (resolveAssetUrl(page.sourcePath, src) ?? src)
                  : src
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src/lib/content.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 10: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 11: Manually verify in the browser**

Run: `npm run dev`. Confirm:
- `#/white-palace/Deeper`, `#/white-palace/Truth`, `#/white-palace/Welcome Home` load their content.
- `#/white-palace/1-stud-difficulty/Deeper` (old URL) shows "Page not found".
- `#/greenhouse/Fusion` and `#/greenhouse/Have a good water!` load correctly.
- Tags on these pages still show `1 stud` first, colored, even without it in `meta.json` (confirmed fully once Task 8 removes it — for now it may appear twice if you haven't done Task 8 yet, which is expected and fixed there).

- [ ] **Step 12: Commit**

```bash
git add src/lib/content.ts src/lib/content.test.ts src/pages/wiki-page.tsx
git commit -m "feat: hoist <n>-stud-difficulty folders into their parent"
```

---

### Task 7: Difficulty dot in the sidebar tree

**Files:**
- Modify: `src/components/app-sidebar.tsx:1-17,42-63`

**Interfaces:**
- Consumes: `DIFFICULTY_COLORS` from `src/lib/difficulty.ts` (Task 1), `page.difficultyLevel` from `src/lib/content.ts` (Task 6).

- [ ] **Step 1: Add the import**

In `src/components/app-sidebar.tsx`, add near the other imports:

```tsx
import { DIFFICULTY_COLORS } from "@/lib/difficulty"
```

- [ ] **Step 2: Render the dot in the leaf branch**

In `WikiTreeItem`, replace the leaf-node return (currently lines 54–62):

```tsx
  if (children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton href={`#/${page.slug}`} isActive={isActive}>
          {isTopLevel && <FileIcon />}
          {page.difficultyLevel !== undefined && (
            <span
              aria-hidden="true"
              className={`size-1.5 shrink-0 rounded-full ${DIFFICULTY_COLORS[page.difficultyLevel].dot}`}
            />
          )}
          <span>{page.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }
```

- [ ] **Step 3: Render the dot in the folder branch**

In the same component, replace the folder-branch button (currently lines 69–72):

```tsx
          <SidebarMenuButton href={`#/${page.slug}`} isActive={isActive}>
            <FolderIcon />
            {page.difficultyLevel !== undefined && (
              <span
                aria-hidden="true"
                className={`size-1.5 shrink-0 rounded-full ${DIFFICULTY_COLORS[page.difficultyLevel].dot}`}
              />
            )}
            <span>{page.title}</span>
          </SidebarMenuButton>
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`. Expand "White Palace" in the sidebar. Confirm "Deeper", "Truth", and "Welcome Home" each show a small green dot to the left of their title, and there is no "1 Stud Difficulty" entry in the tree at all. Do the same for "Greenhouse" → "Fusion" / "Have a good water!".

- [ ] **Step 6: Commit**

```bash
git add src/components/app-sidebar.tsx
git commit -m "feat: show a difficulty dot for hoisted pages in the sidebar"
```

---

### Task 8: Content migration cleanup

**Files:**
- Modify: `src/content/greenhouse/1-stud-difficulty/Fusion/meta.json`
- Modify: `src/content/greenhouse/1-stud-difficulty/Have a good water!/meta.json`
- Modify: `src/content/white-palace/1-stud-difficulty/Deeper/meta.json`
- Modify: `src/content/white-palace/1-stud-difficulty/Truth/meta.json`
- Modify: `src/content/white-palace/1-stud-difficulty/Welcome Home/meta.json`
- Modify: `src/content/white-palace/index.md`

- [ ] **Step 1: Strip the redundant `"1 stud"` tag from all 5 `meta.json` files**

Each of the 5 files currently reads:

```json
{
  "tags": ["1 stud", "secret", "easy", "plain text"],
  "visible": true
}
```

Change each to:

```json
{
  "tags": ["secret", "easy", "plain text"],
  "visible": true
}
```

- [ ] **Step 2: Update the aspirational link in `white-palace/index.md`**

Find (near the end of the file):

```md
Some might even say this is easier than [Rich](#/white-palace/4-stud-difficulty/Rich).
```

Replace with:

```md
Some might even say this is easier than [Rich](#/white-palace/Rich).
```

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — in particular, `content.test.ts`'s "injects the difficulty tag first, ignoring any manual one in meta.json" test now reflects real `meta.json` content with no manual `"1 stud"` tag present at all.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, open `#/white-palace/Deeper`. Confirm the tag list shows exactly `1 stud`, `secret`, `easy`, `plain text` (no duplicate `1 stud`).

- [ ] **Step 5: Commit**

```bash
git add src/content
git commit -m "chore: drop redundant manual difficulty tags now that they're derived from folder names"
```

---

### Task 9: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Full test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: builds successfully (this also re-validates `import.meta.glob` content resolution in production mode, not just dev).

- [ ] **Step 5: End-to-end manual walkthrough**

Run: `npm run dev` and, in the browser:
- Confirm the sidebar tree has no `1-stud-difficulty`/`4-stud-difficulty` entries anywhere, and hoisted pages show their dot.
- Visit each hoisted page directly by its new URL (`#/white-palace/Deeper`, `#/white-palace/Truth`, `#/white-palace/Welcome Home`, `#/greenhouse/Fusion`, `#/greenhouse/Have a good water!`) and confirm content renders with the correct first-position difficulty tag.
- Confirm old nested URLs (e.g. `#/white-palace/1-stud-difficulty/Deeper`) 404.
- Toggle light/dark mode and confirm difficulty tag/dot colors remain legible in both.
- On `#/search`, filter by a difficulty tag and confirm both the result badges and the "Filtering by tag" indicator are colored correctly.

- [ ] **Step 6: Report completion**

Summarize to the user which manual checks were performed and confirm all automated checks (typecheck, lint, test, build) passed.

---

## Self-Review Notes

- **Spec coverage:** tag color restyling (§1) → Tasks 1–5; difficulty folder hoisting, hoisted-page tag injection, dot indicator, asset path fix (§2) → Tasks 6–7; content migration → Task 8; final validation → Task 9. No spec section is uncovered.
- **Placeholders:** none — every step has literal code, exact file paths, and runnable commands.
- **Type consistency:** `DIFFICULTY_COLORS`, `parseDifficultyTag`, `sortDifficultyFirst` (Task 1) are used with identical names/signatures in Tasks 2–7. `WikiPage.sourcePath`/`difficultyLevel` (Task 6) match the fields read in Task 7 (`page.difficultyLevel`) and Task 8's manual verification.
