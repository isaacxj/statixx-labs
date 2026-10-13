import { MonitorActions } from "@/components/monitor-actions";
import { MonitorSheet } from "@/components/monitor-sheet";
import { AppShell } from "@/components/shell/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatCheckedAt, formatInterval, formatLatency } from "@/lib/monitors";
import { listMonitorsWithLatestCheck } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const monitors = await listMonitorsWithLatestCheck();
  return (
    <AppShell title="Monitors">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-muted-foreground">Monitors for client sites and APIs.</p>
        <MonitorSheet />
      </div>
      {monitors.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-lg border px-6 py-12 text-center">
          <p className="font-medium">No monitors yet</p>
          <p className="text-muted-foreground text-sm">Add a client site or API and the first check runs within a minute.</p>
          <MonitorSheet />
        </div>
      ) : (
      <ul className="bg-card divide-y rounded-lg border">
        {monitors.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{m.name}</p>
              <p className="text-muted-foreground truncate text-sm">{m.client} · {m.url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
            <div className="flex flex-col gap-1 sm:items-end">
              <StatusBadge status={m.status} />
              <p className="text-muted-foreground font-mono text-xs tabular-nums">
                {formatInterval(m.intervalSec)} · {formatLatency(m.latest?.latencyMs ?? null)} · {formatCheckedAt(m.lastCheckedAt)}
              </p>
            </div>
            <MonitorActions
              paused={m.status === "paused"}
              monitor={{ id: m.id, name: m.name, client: m.client, url: m.url, method: m.method, intervalSec: m.intervalSec, timeoutMs: m.timeoutMs, expectedStatus: m.expectedStatus, keyword: m.keyword }}
            />
            </div>
          </li>
        ))}
      </ul>
      )}
    </AppShell>
  );
}
