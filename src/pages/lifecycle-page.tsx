import { useEffect, useState } from "react"
import { GitCommitVerticalIcon } from "lucide-react"

import {
  fallbackMessage,
  fetchRecentCommits,
  type CommitEntry,
  type FallbackReason,
} from "@/lib/github"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"

export function LifecyclePage() {
  const [commits, setCommits] = useState<CommitEntry[]>([])
  const [fallbackReason, setFallbackReason] = useState<FallbackReason | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchRecentCommits().then((result) => {
      if (cancelled) return
      setCommits(result.data)
      setFallbackReason(result.status === "fallback" ? result.reason : null)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-lg font-medium">Lifecycle</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Recent activity from the project&rsquo;s git history.
      </p>

      {fallbackReason && (
        <Alert variant="default" className="mt-6">
          <AlertTitle>{fallbackMessage(fallbackReason)}</AlertTitle>
        </Alert>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading commits…</p>
      ) : commits.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No commits found.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {commits.map((commit) => (
            <Marker key={commit.sha} variant="border">
              <MarkerIcon>
                <GitCommitVerticalIcon />
              </MarkerIcon>
              <MarkerContent>
                <a href={commit.htmlUrl} target="_blank" rel="noreferrer" className="text-foreground">
                  {commit.message}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{commit.authorName}</span>
                  <span>{new Date(commit.date).toLocaleDateString()}</span>
                  <Badge variant="outline">{commit.sha.slice(0, 7)}</Badge>
                </div>
              </MarkerContent>
            </Marker>
          ))}
        </div>
      )}
    </div>
  )
}
