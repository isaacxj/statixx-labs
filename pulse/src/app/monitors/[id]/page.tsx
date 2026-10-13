import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import { MonitorActions } from "@/components/monitor-actions";
import { ResponseChart } from "@/components/response-chart";
import { AppShell } from "@/components/shell/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { UptimeBars } from "@/components/uptime-bars";
import { formatCheckedAt, formatInterval, formatLatency } from "@/lib/monitors";
import { formatDuration } from "@/lib/status";
import { dailyUptime, formatUptime, latencyBuckets, nowMs, parseUtc, uptimePercent } from "@/lib/uptime";
import { cn } from "@/lib/utils";
import { getMonitor, listMonitorCheckLog, listMonitorChecksSince, listMonitorIncidents } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600_000;
const RANGES = { "24h": { label: "24 hours", ms: DAY, buckets: 48 }, "7d": { label: "7 days", ms: 7 * DAY, buckets: 56 }, "30d": { label: "30 days", ms: 30 * DAY, buckets: 60 } } as const;
type Range = keyof typeof RANGES;

export default async function MonitorDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> }) {
  const [{ id }, { range: r }] = await Promise.all([params, searchParams]);
  const monitorId = Number(id);
  if (!Number.isInteger(monitorId)) notFound();
  const monitor = await getMonitor(monitorId);
  if (!monitor) notFound();

  const range: Range = r === "7d" || r === "30d" ? r : "24h";
  const now = nowMs();
  const [points, log, incidents] = await Promise.all([
    listMonitorChecksSince(monitorId, new Date(now - 90 * DAY).toISOString().slice(0, 19).replace("T", " ")),
    listMonitorCheckLog(monitorId, 15),
    listMonitorIncidents(monitorId),
  ]);
  const cfg = RANGES[range];
  const buckets = latencyBuckets(points, now, cfg.ms, cfg.buckets);
  const okLatencies = points.filter((p) => p.ok && p.latencyMs !== null && parseUtc(p.at) > now - cfg.ms).map((p) => p.latencyMs as number);
  const avg = okLatencies.length ? Math.round(okLatencies.reduce((a, b) => a + b, 0) / okLatencies.length) : null;

  return (
    <AppShell title={monitor.name}>
      <Link href="/" className="text-muted-foreground hover:text-foreground mb-4 inline-flex min-h-11 items-center gap-1 text-sm sm:min-h-8">
        <ChevronLeft className="size-4" aria-hidden /> All monitors
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="truncate text-xl font-semibold">{monitor.name}</h2>
            <StatusBadge status={monitor.status} />
          </div>
          <p className="text-muted-foreground mt-1 truncate font-mono text-sm">{monitor.method} {monitor.url}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {monitor.client ? `${monitor.client} · ` : ""}{formatInterval(monitor.intervalSec)} · expects {monitor.expectedStatus}{monitor.keyword ? ` · keyword “${monitor.keyword}”` : ""} · {formatCheckedAt(monitor.lastCheckedAt)}
          </p>
        </div>
        <MonitorActions
          paused={monitor.status === "paused"}
          afterDelete="/"
          monitor={{ id: monitor.id, name: monitor.name, client: monitor.client, url: monitor.url, method: monitor.method, intervalSec: monitor.intervalSec, timeoutMs: monitor.timeoutMs, expectedStatus: monitor.expectedStatus, keyword: monitor.keyword }}
        />
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["24 h uptime", formatUptime(uptimePercent(points, now, DAY))], ["30 d uptime", formatUptime(uptimePercent(points, now, 30 * DAY))], [`Avg response (${range})`, formatLatency(avg)], ["Incidents", String(incidents.length)]] as const).map(([k, v]) => (
          <div key={k} className="bg-card rounded-lg border px-4 py-3">
            <dt className="text-muted-foreground text-sm">{k}</dt>
            <dd className="font-mono text-xl tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="bg-card mb-6 rounded-lg border p-4" aria-labelledby="rt">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="rt" className="font-medium">Response time</h3>
          <div className="flex gap-2" role="group" aria-label="Time range">
            {(Object.keys(RANGES) as Range[]).map((k) => (
              <Link
                key={k}
                href={`/monitors/${monitor.id}?range=${k}`}
                aria-current={k === range ? "true" : undefined}
                className={cn(
                  "focus-visible:ring-ring inline-flex min-h-11 items-center rounded-md border px-3 text-sm outline-none focus-visible:ring-2 sm:min-h-8",
                  k === range ? "bg-accent text-accent-foreground border-transparent font-medium" : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                {k}
              </Link>
            ))}
          </div>
        </div>
        <ResponseChart buckets={buckets} label={`Average response time over the last ${cfg.label}`} withDate={range !== "24h"} />
        <p className="text-muted-foreground mt-2 text-xs">Dashed red markers show periods with failed checks.</p>
      </section>

      <section className="bg-card mb-6 rounded-lg border p-4" aria-labelledby="up">
        <h3 id="up" className="mb-3 font-medium">Uptime, 90 days</h3>
        <UptimeBars days={dailyUptime(points, now, 90)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rc" className="min-w-0">
          <h3 id="rc" className="mb-2 font-medium">Recent checks</h3>
          {log.length === 0 ? (
            <p className="bg-card text-muted-foreground rounded-lg border px-4 py-6 text-center text-sm">No checks yet. The first one runs within a minute.</p>
          ) : (
            <ul className="bg-card divide-y rounded-lg border">
              {log.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span className={cn("inline-flex items-center gap-1.5 font-medium", c.ok ? "text-status-up" : "text-status-down")}>
                    {c.ok ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
                    {c.ok ? "Up" : "Down"}
                  </span>
                  <span className="text-muted-foreground min-w-0 flex-1 truncate">{c.ok ? (c.statusCode ?? "") : (c.error ?? `HTTP ${c.statusCode ?? "?"}`)}</span>
                  <span className="font-mono text-xs tabular-nums">{formatLatency(c.latencyMs)}</span>
                  <span className="text-muted-foreground w-28 text-right font-mono text-xs tabular-nums">{formatCheckedAt(c.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="inc" className="min-w-0">
          <h3 id="inc" className="mb-2 font-medium">Incidents</h3>
          {incidents.length === 0 ? (
            <p className="bg-card text-muted-foreground rounded-lg border px-4 py-6 text-center text-sm">No incidents for this monitor.</p>
          ) : (
            <ul className="bg-card divide-y rounded-lg border">
              {incidents.map((i) => {
                const open = i.resolvedAt === null;
                return (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{i.title}</p>
                      <p className="text-muted-foreground text-xs">Started {formatCheckedAt(i.startedAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={cn("inline-flex items-center gap-1.5 font-medium", open ? "text-status-down" : "text-status-up")}>
                        {open ? <XCircle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
                        {open ? "Ongoing" : "Resolved"}
                      </span>
                      <p className="text-muted-foreground font-mono text-xs tabular-nums">{formatDuration(i.startedAt, i.resolvedAt, now)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
