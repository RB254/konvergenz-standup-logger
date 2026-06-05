import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, FileText, Inbox, Loader2, RefreshCw } from "lucide-react";
import { standupsApi, type StandupPost } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const POLL_MS = 10_000;

export function ActivityFeed({ refreshKey }: { refreshKey: number }) {
  const [posts, setPosts] = useState<StandupPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await standupsApi.list();
      setPosts(data);
      setError(null);
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? "Session expired. Please sign in again."
          : "Couldn't reach the API."
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const id = setInterval(fetchPosts, POLL_MS);
    return () => clearInterval(id);
  }, [fetchPosts, refreshKey]);

  return (
    <Card className="border border-border bg-white shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border">
        <div>
          <CardTitle className="text-[color:var(--primary-deep)] text-base font-bold uppercase tracking-wide">
            Live activity
          </CardTitle>
          <p className="text-xs text-muted-foreground">Refreshes every 10s</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPosts}
          disabled={refreshing}
          aria-label="Refresh feed"
          className="text-[color:var(--primary-deep)]"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {posts === null && !error && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading standups…
          </div>
        )}

        {error && (
          <div className="rounded-md border border-[color:var(--brand-red)]/30 bg-[color:var(--brand-red)]/5 p-4 text-sm text-[color:var(--brand-red)]">
            {error}
          </div>
        )}

        {posts && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8" />
            No standups yet — be the first to post above.
          </div>
        )}

        {posts?.map((p, idx) => {
          const isRed = idx % 2 === 1;
          const avatarBg = isRed ? "bg-[color:var(--brand-red)]" : "bg-[color:var(--primary-deep)]";
          return (
            <article
              key={p.id}
              className="rounded-md border border-border bg-white p-4 transition hover:border-[color:var(--primary)]/40 hover:shadow-[var(--shadow-card)]"
            >
              <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBg}`}
                  >
                    {p.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[color:var(--primary-deep)]">
                      {p.author}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(p.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                {p.has_blocker && (
                  <Badge className="gap-1 bg-[color:var(--brand-red)] text-white uppercase tracking-wide font-bold hover:bg-[color:var(--brand-red)]/90">
                    <AlertTriangle className="h-3 w-3" /> Blocked
                  </Badge>
                )}
              </header>

              <dl className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--primary-deep)]">
                    Yesterday
                  </dt>
                  <dd className="whitespace-pre-wrap text-foreground">{p.yesterday || "—"}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--primary-deep)]">
                    Today
                  </dt>
                  <dd className="whitespace-pre-wrap text-foreground">{p.today || "—"}</dd>
                </div>
                <div>
                  <dt className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--primary-deep)]">
                    Blockers
                  </dt>
                  <dd className="whitespace-pre-wrap text-muted-foreground">
                    {p.blockers || "None"}
                  </dd>
                </div>
              </dl>

              {p.file_attachment && (
                <a
                  href={p.file_attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--primary-deep)] hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> View attachment
                </a>
              )}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
