import { useLocation } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  FileIcon,
  FileQuestionIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react"

import {
  findPage,
  resolveAssetUrl,
  visibleChildren,
  type WikiPage,
} from "@/lib/content"
import { LinkButton } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spoiler } from "@/components/spoiler"
import { SolutionSpoiler } from "@/components/solution-spoiler"
import { SolutionBlock } from "@/components/solution-block"
import { remarkSpoiler } from "@/lib/remark-spoiler"
import type { Components } from "react-markdown"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div className="not-prose mb-4 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

function SubpageList({ children }: { children: WikiPage[] }) {
  return (
    <ul className="not-prose flex w-full flex-col gap-2">
      {children.map((child) => (
        <li key={child.slug}>
          <a
            href={`#/${child.slug}`}
            className="flex items-center gap-2 rounded-none border p-3 text-left text-sm hover:bg-muted"
          >
            {child.children.length > 0 ? (
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span>{child.title}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function WikiPage() {
  const location = useLocation()
  const segments = location.pathname
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent)
  const page = findPage(segments)

  if (!page) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestionIcon />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            There&apos;s no wiki page at &quot;/{segments.join("/")}&quot;.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton href="#/" variant="outline">
            Go back home
          </LinkButton>
        </EmptyContent>
      </Empty>
    )
  }

  if (!page.hasContent) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon />
          </EmptyMedia>
          <EmptyTitle>{page.title}</EmptyTitle>
          <EmptyDescription>This page has no content yet.</EmptyDescription>
        </EmptyHeader>
        <TagList tags={page.tags} />
        {visibleChildren(page).length > 0 && (
          <EmptyContent>
            <SubpageList children={visibleChildren(page)} />
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <TagList tags={page.tags} />
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkSpoiler]}
        components={
          {
            img: ({ src, alt }) => {
              const resolved =
                typeof src === "string"
                  ? (resolveAssetUrl(page.path, src) ?? src)
                  : src
              return <img src={resolved} alt={alt ?? ""} />
            },
            spoiler: Spoiler,
            solution: SolutionSpoiler,
            "solution-block": SolutionBlock,
          } as Components
        }
      >
        {page.content}
      </ReactMarkdown>
      {visibleChildren(page).length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2>Subpages</h2>
          <SubpageList children={visibleChildren(page)} />
        </div>
      )}
    </article>
  )
}
