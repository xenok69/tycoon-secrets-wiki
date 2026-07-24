import { useState, type ComponentProps, type KeyboardEvent } from "react"
import { SearchCheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { SolutionConfirmDialog } from "@/components/solution-confirm-dialog"

/** Block-level counterpart to `SolutionSpoiler`, for solutions that span
 * multiple lines or include images (`??>` ... `<??` in markdown). */
export function SolutionBlock({ className, children, ...props }: ComponentProps<"div">) {
  const [revealed, setRevealed] = useState(false)
  const [open, setOpen] = useState(false)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <>
      <div
        // No `not-prose` here: Tailwind Typography's prose selectors exclude
        // *any* descendant of a `not-prose` ancestor, even through a nested
        // `prose` wrapper, so re-adding `prose` inside it wouldn't undo the
        // exclusion. Since this box only wraps plain divs otherwise, prose
        // styling on the surrounding article can just reach through to the
        // paragraphs/images inside directly.
        className={cn(
          "relative my-4 flex min-h-20 w-full items-center justify-center rounded-sm bg-sidebar",
          !revealed && "cursor-pointer select-none hover:bg-sidebar-accent",
          className
        )}
        {...(!revealed && {
          role: "button",
          tabIndex: 0,
          "aria-label": "Solution, click to reveal",
          onClick: () => setOpen(true),
          onKeyDown: handleKeyDown,
        })}
        {...props}
      >
        {revealed ? (
          <div className="w-full p-4">{children}</div>
        ) : (
          <>
            {/* Reserves the box's size to match the hidden content
                (including any images), without showing it. Same classes as
                the revealed branch above so the box never resizes on reveal. */}
            <div aria-hidden="true" className="invisible w-full p-4">
              {children}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sidebar-foreground">
              <SearchCheckIcon className="size-5" />
              <span className="text-sm font-medium">Solution</span>
            </div>
          </>
        )}
      </div>
      <SolutionConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          setRevealed(true)
          setOpen(false)
        }}
      />
    </>
  )
}
