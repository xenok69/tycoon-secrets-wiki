import { useMemo } from "react"
import type { ChangeEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { SearchIcon } from "lucide-react"

import { flattenPages } from "@/lib/content"
import type { WikiPage } from "@/lib/content"
import { Input } from "@/components/ui/input"
import { TagBadge } from "@/components/tag-badge"
import { sortDifficultyFirst } from "@/lib/difficulty"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const PAGE_SIZE = 10

function excerpt(content: string): string {
  const stripped = content.replace(/[#*_[\]()]/g, "").replace(/\s+/g, " ").trim()
  return stripped.length > 120 ? `${stripped.slice(0, 120)}…` : stripped
}

function searchPages(pages: WikiPage[], query: string): WikiPage[] {
  const q = query.trim().toLowerCase()
  if (!q) return pages

  const matches = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(q) ||
      page.content.toLowerCase().includes(q)
  )

  return matches.sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()
    const aRank = aTitle === q ? 0 : aTitle.startsWith(q) ? 1 : aTitle.includes(q) ? 2 : 3
    const bRank = bTitle === q ? 0 : bTitle.startsWith(q) ? 1 : bTitle.includes(q) ? 2 : 3
    if (aRank !== bRank) return aRank - bRank
    return aTitle.localeCompare(bTitle)
  })
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis")
    result.push(p)
    prev = p
  }
  return result
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const tag = searchParams.get("tag") ?? ""
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const allPages = useMemo(() => flattenPages(), [])
  const results = useMemo(() => {
    const matches = searchPages(allPages, query)
    return tag ? matches.filter((page) => page.tags.includes(tag)) : matches
  }, [allPages, query, tag])

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleQueryChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (value) params.set("q", value)
      else params.delete("q")
      params.delete("page")
      return params
    })
  }

  function hrefForPage(pageNum: number): string {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (tag) params.set("tag", tag)
    params.set("page", String(pageNum))
    return `#/search?${params.toString()}`
  }

  function hrefForTag(tagName: string): string {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    params.set("tag", tagName)
    return `#/search?${params.toString()}`
  }

  function hrefClearTag(): string {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    return `#/search?${params.toString()}`
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-lg font-medium">Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find pages across the wiki.
      </p>

      <Input
        value={query}
        onChange={handleQueryChange}
        placeholder="Search pages…"
        aria-label="Search pages"
        className="mt-4"
      />

      {tag && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtering by tag:</span>
          <a href={hrefForTag(tag)}>
            <TagBadge tag={tag} />
          </a>
          <a
            href={hrefClearTag()}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear
          </a>
        </div>
      )}

      {results.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>
              {query
                ? `No pages match “${query}”`
                : `No pages tagged “${tag}”`}
            </EmptyTitle>
            <EmptyDescription>
              Try a different search term{tag ? " or clear the tag filter" : ""}.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-3">
            {pageItems.map((item) => (
              <li key={item.slug} className="rounded-none border p-4 text-sm">
                <a href={`#/${item.slug}`} className="block hover:underline">
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {item.slug}
                  </div>
                  {item.hasContent && item.content && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {excerpt(item.content)}
                    </p>
                  )}
                </a>
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sortDifficultyFirst(item.tags).map((t) => (
                      <a key={t} href={hrefForTag(t)}>
                        <TagBadge tag={t} />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination className="mt-6 justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={hrefForPage(Math.max(1, page - 1))}
                    isDisabled={page === 1}
                  />
                </PaginationItem>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink href={hrefForPage(p)} isActive={p === page}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href={hrefForPage(Math.min(totalPages, page + 1))}
                    isDisabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
