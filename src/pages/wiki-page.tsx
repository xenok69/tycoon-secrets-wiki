import { useLocation } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import {
  FileIcon,
  FileQuestionIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react"

import { findPage, resolveAssetUrl, type WikiPage } from "@/lib/content"
import { LinkButton } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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
        {page.children.length > 0 && (
          <EmptyContent>
            <SubpageList children={page.children} />
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <ReactMarkdown
        components={{
          img: ({ src, alt }) => {
            const resolved =
              typeof src === "string"
                ? (resolveAssetUrl(page.path, src) ?? src)
                : src
            return <img src={resolved} alt={alt ?? ""} />
          },
        }}
      >
        {page.content}
      </ReactMarkdown>
      {page.children.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2>Subpages</h2>
          <SubpageList children={page.children} />
        </div>
      )}
    </article>
  )
}
