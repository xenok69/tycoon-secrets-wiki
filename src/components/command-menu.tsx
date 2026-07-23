import { useEffect, useState, type KeyboardEvent } from "react"
import { FileIcon, FolderIcon, SearchIcon } from "lucide-react"

import { flattenPages } from "@/lib/content"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { SidebarMenuButton } from "@/components/ui/sidebar"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const pages = flattenPages()

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function closeAndReset() {
    setOpen(false)
    setQuery("")
  }

  const searchHref = query
    ? `#/search?q=${encodeURIComponent(query)}`
    : "#/search"

  // Enter should always jump to the full search results page, regardless of
  // which item the collection would otherwise activate. A capture-phase
  // handler on an ancestor fires before the input's own Enter handling.
  function handleEnterCapture(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    event.stopPropagation()
    closeAndReset()
    window.location.hash = searchHref.slice(1)
  }

  return (
    <>
      <SidebarMenuButton onPress={() => setOpen(true)}>
        <SearchIcon />
        <span>Search</span>
      </SidebarMenuButton>
      <CommandDialog
        open={open}
        onOpenChange={(isOpen) => (isOpen ? setOpen(true) : closeAndReset())}
        title="Search"
        description="Search wiki pages"
      >
        <div onKeyDownCapture={handleEnterCapture}>
          <Command inputValue={query} onInputChange={setQuery}>
            <CommandInput placeholder="Search pages…" />
            <CommandList
              renderEmptyState={() => <CommandEmpty>No pages found.</CommandEmpty>}
            >
              <CommandGroup heading="Search">
                <CommandItem
                  id="__search__"
                  href={searchHref}
                  textValue={query || " "}
                  onAction={closeAndReset}
                >
                  <SearchIcon />
                  <span>{query ? `Search for "${query}"` : "Search all pages"}</span>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Pages">
                {pages.map((page) => (
                  <CommandItem
                    key={page.slug}
                    id={page.slug}
                    href={`#/${page.slug}`}
                    textValue={page.title}
                    onAction={closeAndReset}
                  >
                    {page.children.length > 0 ? <FolderIcon /> : <FileIcon />}
                    <span>{page.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </CommandDialog>
    </>
  )
}
