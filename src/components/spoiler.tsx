import {
  useState,
  type ComponentProps,
  type ComponentType,
  type KeyboardEvent,
} from "react"
import { EyeIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpoilerBoxProps extends ComponentProps<"span"> {
  icon: ComponentType<{ className?: string }>
  label: string
  revealed: boolean
  onActivate: () => void
}

/** Shared box shell for `Spoiler` and `SolutionSpoiler` — only how the box
 * is activated (and what happens on activation) differs between them. */
export function SpoilerBox({
  icon: Icon,
  label,
  revealed,
  onActivate,
  className,
  children,
  ...props
}: SpoilerBoxProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (revealed) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onActivate()
    }
  }

  return (
    <span
      // Same box (inline-flex, same padding) revealed or not, so revealing
      // never changes the line height mid-paragraph. A plain inline <span>
      // would sit shorter than this once revealed (inline boxes paint only
      // their glyph area, not the full line-height an inline-flex gets).
      className={cn(
        "relative inline-flex min-w-[1lh] items-center rounded-sm bg-sidebar px-1.5",
        !revealed && "cursor-pointer select-none hover:bg-sidebar-accent",
        className
      )}
      {...(!revealed && {
        role: "button",
        tabIndex: 0,
        "aria-label": `${label}, click to reveal`,
        onClick: onActivate,
        onKeyDown: handleKeyDown,
      })}
      {...props}
    >
      {revealed ? (
        children
      ) : (
        <>
          {/* Reserves the box's size to match the hidden content, without
              showing it. Wraps like normal text so long spoilers grow
              downward instead of overflowing sideways. */}
          <span aria-hidden="true" className="invisible">
            {children}
          </span>
          {/* container-type lives here, not on the box above: that box's own
              width depends on the (invisible) content above, and inline-size
              containment on the same element would break that. */}
          <span className="@container absolute inset-0 flex items-center justify-center gap-1 text-sidebar-foreground">
            <Icon className="size-3.5 shrink-0" />
            <span className="hidden text-xs font-medium whitespace-nowrap @[6rem]:inline">
              {label}
            </span>
          </span>
        </>
      )}
    </span>
  )
}

export function Spoiler({ className, children, ...props }: ComponentProps<"span">) {
  const [revealed, setRevealed] = useState(false)

  return (
    <SpoilerBox
      icon={EyeIcon}
      label="Spoiler"
      revealed={revealed}
      onActivate={() => setRevealed(true)}
      className={className}
      {...props}
    >
      {children}
    </SpoilerBox>
  )
}
