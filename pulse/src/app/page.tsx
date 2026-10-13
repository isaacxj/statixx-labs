import Link from "next/link";
import { MonitorActions } from "@/components/monitor-actions";
import { MonitorFilters } from "@/components/monitor-filters";
import { MonitorSheet } from "@/components/monitor-sheet";
import { Sparkline } from "@/components/sparkline";
import { AppShell } from "@/components/shell/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatCheckedAt } from "@/lib/monitors";
import { formatUptime, latencySeries, nowMs, uptimePercent, type CheckPoint } from "@/lib/uptime";
import { listChecksSince, listMonitorsWithLatestCheck } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600_000;

export default async function Home({ searchParams }: { searchParams: Promise<{ status?: string; client?: string }> }) {
  const { status = "", client = "" } = await searchParams;
  const now = nowMs();
  const [all, checkRows] = await Promise.all([
    listMonitorsWithLatestCheck(),
    listChecksSince(new Date(now - 30 * DAY).toISOString().slice(0, 19).replace("T", " ")),
  ]);
  const byMonitor = new Map<number, CheckPoint[]>();
  for (const c of checkRows) byMonitor.set(c.monitorId, [...(byMonitor.get(c.monitorId) ?? []), c]);

  const counts: Record<string, number> = { all: all.length, up: 0, down: 0, paused: 0, pending: 0 };
  for (const m of all) counts[m.status]++;
  const clients = [...new Set(all.map((m) => m.client))];
  const monitors = all.filter((m) => (!status || m.status === status) && (!client || m.client === client));

  return (
    <AppShell title="Monitors">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-muted-foreground">Monitors for client sites and APIs.</p>
        <MonitorSheet />
      </div>
      {all.length > 0 && (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([["up", "Up"], ["down", "Down"], ["paused", "Paused"], ["pending", "Pending"]] as const).map(([key, label]) => (
              <div key={key} className="bg-card rounded-lg border px-4 py-3">
                <dt className="text-muted-foreground text-sm">{label}</dt>
                <dd className="font-mono text-2xl tabular-nums">{counts[key]}</dd>
              </div>
            ))}
          </dl>
          <MonitorFilters filters={{ status, client }} clients={clients} counts={counts} />
        </>
      )}
      {all.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-lg border px-6 py-12 text-center">
          <p className="font-medium">No monitors yet</p>
          <p className="text-muted-foreground text-sm">Add a client site or API and the first check runs within a minute.</p>
          <MonitorSheet />
        </div>
      ) : monitors.length === 0 ? (
        <div className="bg-card rounded-lg border px-6 py-10 text-center">
          <p className="font-medium">No monitors match these filters</p>
          <p className="text-muted-foreground text-sm">Choose “All” above to see every monitor.</p>
        </div>
      ) : (
        <ul className="bg-card divide-y rounded-lg border">
          {monitors.map((m) => {
            const pts = byMonitor.get(m.id) ?? [];
            const series = latencySeries(pts, now, DAY);
            return (
              <li key={m.id} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
                <div className="min-w-0 lg:flex-1">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={m.status} />
                    <Link href={`/monitors/${m.id}`} className="hover:underline focus-visible:ring-ring truncate rounded-sm font-medium outline-none focus-visible:ring-2">{m.name}</Link>
                  </div>
                  <p className="text-muted-foreground truncate text-sm">{m.client ? `${m.client} · ` : ""}{m.url}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs tabular-nums lg:shrink-0">
                  <div className="w-14">
                    <p className="text-muted-foreground">24 h</p>
                    <p className="text-sm">{formatUptime(uptimePercent(pts, now, DAY))}</p>
                  </div>
                  <div className="w-14">
                    <p className="text-muted-foreground">30 d</p>
                    <p className="text-sm">{formatUptime(uptimePercent(pts, now, 30 * DAY))}</p>
                  </div>
                  <Sparkline values={series} label={`${m.name} response time, last 24 hours`} className="text-muted-foreground" />
                  <p className="text-muted-foreground w-28">{formatCheckedAt(m.lastCheckedAt)}</p>
                  <MonitorActions
                    paused={m.status === "paused"}
                    monitor={{ id: m.id, name: m.name, client: m.client, url: m.url, method: m.method, intervalSec: m.intervalSec, timeoutMs: m.timeoutMs, expectedStatus: m.expectedStatus, keyword: m.keyword }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
