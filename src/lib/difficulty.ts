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
