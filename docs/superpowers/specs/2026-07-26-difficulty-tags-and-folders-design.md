# Difficulty tag colors & difficulty-folder collapsing

## Context

Each wiki page's `meta.json` carries a `tags` array (e.g. `["1 stud", "secret", "easy", "plain text"]`). One tag, matching the pattern `"n stud"` (n = 1–7), is the special "difficulty" tag. Today `TagList` (in `wiki-page.tsx`) renders every tag with loud, saturated colors (`bg-green-500`, `bg-yellow-500`, ...), and a separate, slightly different color map already exists in `components/difficulty.tsx` for an unrelated inline `<difficulty>` markdown tag used in prose (e.g. white-palace/index.md's "Any `<Difficulty level="1">`..."). Content is also physically organized into folders like `white-palace/1-stud-difficulty/Deeper/`, which show up in the sidebar and URL as a real, visitable tree level.

This spec covers two related changes:
1. Restyle the tag system so ordinary tags match the site's gray/black aesthetic, and only the difficulty tag gets a distinct (subtle) color, always sorted first.
2. Make `<n>-stud-difficulty` folders structural-only: invisible and unvisitable, with their children hoisted up one level in both the URL and the sidebar tree, marked instead with a small color-coded dot.

## 1. Tag color system

### Shared difficulty color module

New file `src/lib/difficulty.ts`:
- `DIFFICULTY_COLORS: Record<1|2|3|4|5|6|7, { bg: string; text: string; border: string; dot: string }>` — class names pointing at new CSS rules (see below). Mapping: 1=Green, 2=Yellow, 3=Red, 4=Rose, 5=Blue, 6=White, 7=Black.
- `parseDifficultyTag(tag: string): number | undefined` — matches `/^([1-7]) stud$/i`, returns the level or `undefined`.

### CSS

In `index.css`, add one rule per level, e.g.:

```css
.tag-difficulty-1 {
  background: color-mix(in oklch, var(--background) 82%, var(--color-green-500) 18%);
  color: color-mix(in oklch, var(--foreground) 55%, var(--color-green-500) 45%);
  border-color: color-mix(in oklch, var(--border) 50%, var(--color-green-500) 50%);
}
```

...repeated for 2–5 (yellow/red/rose/blue), and for 6/7 mixing toward `white`/`black` instead of a hue. Because these mix against the live `--background`/`--foreground`/`--border` theme variables, light and dark mode are both handled by the same rule — no `dark:` variants needed. This directly satisfies "slightly brighter than background with a tint of color." A `.dot-difficulty-N` variant (solid, higher-saturation fill, no background mixing) is used for the small sidebar dot, where subtlety would make it unreadable at 6–8px.

### Component changes

- `TagList` (`wiki-page.tsx`) and the tag rendering in `search-page.tsx`: switch ordinary tags to plain gray/secondary `Badge` styling (matching the rest of the site). For the one tag where `parseDifficultyTag` returns a level, apply `tag-difficulty-{level}` instead, and always render it first regardless of its position in `page.tags`.
- `components/difficulty.tsx` (the inline prose `<Difficulty level="N">` component): switch its hardcoded color map to `DIFFICULTY_COLORS`, so prose callouts and tag badges always agree.
- Tags outside the 1–7 range (e.g. a literal `"8 stud"` tag) are not treated as difficulty tags — no special color, no pin-to-front — same as any other tag.

## 2. Difficulty folders: hoisted, invisible, dot-marked

### Detection

Purely structural, no new `meta.json` files. Any folder path segment matching `^([1-7])-stud-difficulty$` (case-insensitive) is treated as a difficulty folder. A folder named outside that range (e.g. `8-stud-difficulty`) does **not** match and is left as an ordinary, visible folder — a safe default instead of silently mishandling an out-of-range name.

### Data model (`content.ts`)

- `WikiPage` gains `difficultyLevel?: number` (1–7, set when the page was hoisted out of a difficulty folder) and an internal `sourcePath: string[]` (the real on-disk path, distinct from `path`/`slug`).
- `buildTree`'s segment-walking logic: when a path segment matches the difficulty-folder pattern, no node is created for it. The parsed level is carried forward and attached (`difficultyLevel`) to the node created for the *next* segment (the actual secret page/folder), which becomes a direct child of the difficulty folder's parent. That node's `path`/`slug` (and therefore its URL and sidebar position) skip the difficulty-folder segment entirely — e.g. `white-palace/1-stud-difficulty/Deeper` on disk becomes reachable at `#/white-palace/deeper`.
- `sourcePath` keeps the real on-disk path including the difficulty-folder segment, and `resolveAssetUrl` is updated to resolve images against `sourcePath` instead of `path`, so image references in markdown keep working even though the public path is shorter.
- Difficulty-tag injection: when building a hoisted page's `tags`, any existing `"n stud"`-pattern tag from that page's own `meta.json` is dropped, and the correct `"n stud"` tag (from the folder-derived level) is injected at the front. This keeps `TagList` and tag-based search filtering working unchanged, with the folder name as the single source of truth.

### Sidebar rendering (`app-sidebar.tsx`)

`WikiTreeItem` renders a small dot (`.dot-difficulty-{level}`) to the left of the page title whenever `page.difficultyLevel` is set. This is the only place the dot appears — not the subpage list on parent pages, not search results.

### Known constraint (not solved here)

If a difficulty folder's parent already had another child with the same name as one of its hoisted pages, they'd collide (last one processed wins, silently). Not a real scenario with the current content (5 pages total), so no conflict detection is being built for it now — YAGNI.

### Content migration

- Remove the now-redundant manual `"1 stud"` tag from the 5 existing pages' `meta.json` files under `1-stud-difficulty` folders (Fusion, Have a good water!, Deeper, Truth, Welcome Home) — it's derived automatically now.
- Update the aspirational link in `white-palace/index.md` — `[Rich](#/white-palace/4-stud-difficulty/Rich)` → `#/white-palace/rich` — to match the hoisted URL scheme for when that page is created.

## Out of scope

- Conflict resolution for name collisions after hoisting.
- Dot indicators anywhere other than the sidebar tree.
- Changing folder structure/naming conventions beyond what's described above.
