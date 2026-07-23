import { BookOpenIcon, FileIcon, FolderIcon } from "lucide-react"

import { getTree } from "@/lib/content"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function HomePage() {
  const tree = getTree()

  if (tree.children.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpenIcon />
          </EmptyMedia>
          <EmptyTitle>No pages yet</EmptyTitle>
          <EmptyDescription>
            Add a folder under src/content with an index.md to create your
            first page.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-lg font-medium">
        Tycoon Secrets Wiki
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a page to get started.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {tree.children.map((page) => (
          <li key={page.slug}>
            <a
              href={`#/${page.slug}`}
              className="flex items-center gap-2 rounded-none border p-4 text-sm hover:bg-muted"
            >
              {page.children.length > 0 ? (
                <FolderIcon className="size-4 shrink-0" />
              ) : (
                <FileIcon className="size-4 shrink-0" />
              )}
              {page.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
