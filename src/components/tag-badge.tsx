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
