import { useState } from "react"
import { useLocation } from "react-router-dom"
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  GitCommitVerticalIcon,
  HomeIcon,
  MessageCircleIcon,
  MoonIcon,
  MoreHorizontalIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react"

import { getTree, visibleChildren, type WikiPage } from "@/lib/content"
import { CommandMenu } from "@/components/command-menu"
import { useTheme } from "@/components/theme-provider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const MAX_TOP_LEVEL_PAGES = 5
const DISCORD_INVITE_URL = "https://discord.gg/9b9hXZu2g3"

function WikiTreeItem({
  page,
  currentSlug,
}: {
  page: WikiPage
  currentSlug: string
}) {
  const isActive = page.slug === currentSlug
  const isOnActivePath = currentSlug.startsWith(page.slug)
  const isTopLevel = page.path.length === 1
  const children = visibleChildren(page)

  if (children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton href={`#/${page.slug}`} isActive={isActive}>
          {isTopLevel && <FileIcon />}
          <span>{page.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible defaultExpanded={isOnActivePath}>
        <div className="flex items-center">
          <SidebarMenuButton href={`#/${page.slug}`} isActive={isActive}>
            <FolderIcon />
            <span>{page.title}</span>
          </SidebarMenuButton>
          <CollapsibleTrigger className="mr-1 flex size-6 shrink-0 items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground [&[aria-expanded=true]_svg]:rotate-90">
            <ChevronRightIcon className="size-4 transition-transform" />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <WikiTreeItem
                key={child.slug}
                page={child}
                currentSlug={currentSlug}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

function WikiNav({ currentSlug }: { currentSlug: string }) {
  const [expanded, setExpanded] = useState(false)
  const topLevel = visibleChildren(getTree())
  const hasOverflow = topLevel.length > MAX_TOP_LEVEL_PAGES

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Wiki</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {(expanded ? topLevel : topLevel.slice(0, MAX_TOP_LEVEL_PAGES)).map(
            (page) => (
              <WikiTreeItem
                key={page.slug}
                page={page}
                currentSlug={currentSlug}
              />
            )
          )}
          {hasOverflow && (
            <SidebarMenuItem>
              <SidebarMenuButton onPress={() => setExpanded((value) => !value)}>
                <MoreHorizontalIcon />
                <span>{expanded ? "Show less" : "Show all"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const currentSlug = decodeURIComponent(location.pathname.replace(/^\//, ""))
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="#/" size="lg">
              <img
                src={`${import.meta.env.BASE_URL}TycoonSecretsLogo.webp`}
                alt="Tycoon Secrets Wiki logo"
                className="size-6 shrink-0 object-cover"
              />
              <span className="font-medium">Tycoon Secrets Wiki</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton href="#/" isActive={currentSlug === ""}>
                  <HomeIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  href="#/team"
                  isActive={currentSlug === "team"}
                >
                  <UsersIcon />
                  <span>Team</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  href="#/lifecycle"
                  isActive={currentSlug === "lifecycle"}
                >
                  <GitCommitVerticalIcon />
                  <span>Lifecycle</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <WikiNav currentSlug={currentSlug} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator className="mb-1" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onPress={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
              <span>{isDark ? "Dark mode" : "Light mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <CommandMenu />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircleIcon />
              <span>Discord</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
