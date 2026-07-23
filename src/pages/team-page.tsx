import { useEffect, useState } from "react"
import { StarIcon } from "lucide-react"

import type { Contributor, GithubResult } from "@/lib/github"
import { fallbackMessage, fetchContributors } from "@/lib/github"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamPage() {
  const [result, setResult] = useState<GithubResult<Contributor[]> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchContributors().then((res) => {
      if (!cancelled) setResult(res)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-lg font-medium">Team</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Contributors to this wiki, pulled from GitHub.
      </p>

      {result === null ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <>
          {result.status === "fallback" && (
            <Alert variant="default" className="mt-6">
              <AlertTitle>Sample data</AlertTitle>
              <AlertDescription>{fallbackMessage(result.reason)}</AlertDescription>
            </Alert>
          )}

          {result.data.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No contributors found.</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {result.data.map((contributor) => (
                <li key={contributor.login} className="rounded-none border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={contributor.avatarUrl} alt={contributor.login} />
                      <AvatarFallback>
                        {contributor.login.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <a
                        href={contributor.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold hover:underline"
                      >
                        {contributor.login}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {contributor.contributions} contributions
                      </div>
                    </div>
                  </div>

                  {contributor.topRepos.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {contributor.topRepos.slice(0, 3).map((repo) => (
                        <li key={repo.htmlUrl} className="flex items-center gap-2 text-sm">
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {repo.name}
                          </a>
                          <Badge variant="secondary">
                            <StarIcon />
                            {repo.stars}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
