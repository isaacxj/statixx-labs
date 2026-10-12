import { STATUS_LABELS, formatCheckedAt, formatInterval, formatLatency } from "@/lib/monitors";
import { listMonitorsWithLatestCheck } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const DOT: Record<string, string> = { up: "bg-success", down: "bg-danger", pending: "bg-warning", paused: "bg-muted-foreground" };

export default async function Home() {
  const monitors = await listMonitorsWithLatestCheck();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pulse</h1>
        <p className="text-muted-foreground">Monitors for client sites and APIs.</p>
      </header>
      <ul className="bg-card divide-border divide-y rounded-lg border">
        {monitors.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${DOT[m.status]}`} />
              <div className="min-w-0">
                <p className="truncate font-medium">{m.name}</p>
                <p className="text-muted-foreground truncate text-sm">{m.client} · {m.url}</p>
              </div>
            </div>
            <div className="text-muted-foreground shrink-0 pl-5 text-sm sm:pl-0 sm:text-right">
              <p>{STATUS_LABELS[m.status]} · {formatInterval(m.intervalSec)}</p>
              <p className="font-mono tabular-nums">{formatLatency(m.latest?.latencyMs ?? null)} · {formatCheckedAt(m.lastCheckedAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
