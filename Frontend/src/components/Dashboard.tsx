import { useEffect, useState } from "react";
import { AlertTriangle, FileText, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { standupsApi, type StandupStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const POLL_MS = 15_000;

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: typeof FileText;
  tone?: "primary" | "destructive" | "success";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]",
  } as const;
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<StandupStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await standupsApi.stats();
        if (alive) {
          setStats(s);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [refreshKey]);

  if (error && !stats) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Stats unavailable — check the API connection.
        </CardContent>
      </Card>
    );
  }

  const chartData =
    stats?.posts_per_day.map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString(undefined, {
        weekday: "short",
      }),
    })) ?? [];

  const blockerRate =
    stats && stats.total_posts > 0
      ? Math.round((stats.total_blockers / stats.total_posts) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total posts"
          value={stats?.total_posts ?? "—"}
          icon={FileText}
        />
        <MetricCard
          label="Total blockers"
          value={stats?.total_blockers ?? "—"}
          icon={AlertTriangle}
          tone="destructive"
        />
        <MetricCard
          label="Active members"
          value={stats?.active_members ?? "—"}
          icon={Users}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Posts per day · last 7 days</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--color-accent)" }}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Blocker summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Last 7 days</span>
              <span className="text-2xl font-semibold tabular-nums">
                {stats?.blocker_count ?? "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">All-time blockers</span>
              <span className="text-lg font-medium tabular-nums">
                {stats?.total_blockers ?? "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Blocker rate</span>
              <span className="text-lg font-medium tabular-nums">{blockerRate}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-destructive transition-all"
                style={{ width: `${blockerRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
