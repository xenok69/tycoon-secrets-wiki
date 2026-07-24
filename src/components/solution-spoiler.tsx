import { useState, type ComponentProps } from "react"
import { SearchCheckIcon } from "lucide-react"

import { SpoilerBox } from "@/components/spoiler"
import { SolutionConfirmDialog } from "@/components/solution-confirm-dialog"

export function SolutionSpoiler({ className, children, ...props }: ComponentProps<"span">) {
  const [revealed, setRevealed] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <>
      <SpoilerBox
        icon={SearchCheckIcon}
        label="Solution"
        revealed={revealed}
        onActivate={() => setOpen(true)}
        className={className}
        {...props}
      >
        {children}
      </SpoilerBox>
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
