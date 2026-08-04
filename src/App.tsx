import { HashRouter, Route, Routes } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { PageClouds } from "@/components/empty-page-clouds"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { HomePage } from "@/pages/home-page"
import { LifecyclePage } from "@/pages/lifecycle-page"
import { SearchPage } from "@/pages/search-page"
import { TeamPage } from "@/pages/team-page"
import { WikiPage } from "@/pages/wiki-page"

export function App() {
  return (
    <HashRouter>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <a href="#/" className="text-xs font-medium">
              Tycoon Secrets Wiki
            </a>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <PageClouds>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/lifecycle" element={<LifecyclePage />} />
                <Route path="/*" element={<WikiPage />} />
              </Routes>
            </PageClouds>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HashRouter>
  )
}

export default App
