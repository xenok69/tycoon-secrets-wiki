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