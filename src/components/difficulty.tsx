export function Difficulty({
  level,
  children,
}: {
  level?: string
  children: React.ReactNode
}) {
  const colors: Record<string, string> = {
    "1": "text-green-400",
    "2": "text-yellow-400",
    "3": "text-red-400",
    "4": "text-pink-400",
    "5": "text-blue-400",
    "6": "text-gray-400",
    "7": "text-gray-200",
  }

  return (
    <span className={`not-prose ${colors[level ?? ""] ?? "text-gray-400"}`}>
      {children}
    </span>
  )
}