import { AppShell } from "@/components/shell/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatCheckedAt, formatInterval, formatLatency } from "@/lib/monitors";
import { listMonitorsWithLatestCheck } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const monitors = await listMonitorsWithLatestCheck();
  return (
    <AppShell title="Monitors">
      <p className="text-muted-foreground mb-6">Monitors for client sites and APIs.</p>
      <ul className="bg-card divide-y rounded-lg border">
        {monitors.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{m.name}</p>
              <p className="text-muted-foreground truncate text-sm">{m.client} · {m.url}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1 sm:items-end">
              <StatusBadge status={m.status} />
              <p className="text-muted-foreground font-mono text-xs tabular-nums">
                {formatInterval(m.intervalSec)} · {formatLatency(m.latest?.latencyMs ?? null)} · {formatCheckedAt(m.lastCheckedAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
