import { AppShell } from "@/components/shell/app-shell";
import { formatCheckedAt } from "@/lib/monitors";
import { formatDuration } from "@/lib/status";
import { listIncidents } from "@/server/db/queries";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const rows = await listIncidents();
  return (
    <AppShell title="Incidents">
      <p className="text-muted-foreground mb-6">Outages are opened automatically after two failed checks in a row and resolved on the first success.</p>
      {rows.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-lg border px-6 py-12 text-center">
          <p className="font-medium">No incidents</p>
          <p className="text-muted-foreground text-sm">When a monitor fails two checks in a row, the outage shows up here.</p>
        </div>
      ) : (
        <ul className="bg-card divide-y rounded-lg border">
          {rows.map(({ incident, client }) => {
            const open = incident.resolvedAt === null;
            const Icon = open ? XCircle : CheckCircle2;
            return (
              <li key={incident.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{incident.title}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {client} · Started {formatCheckedAt(incident.startedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${open ? "text-status-down" : "text-status-up"}`}>
                    <Icon className="size-4" aria-hidden />
                    {open ? "Ongoing" : "Resolved"}
                  </span>
                  <p className="text-muted-foreground font-mono text-xs tabular-nums">{formatDuration(incident.startedAt, incident.resolvedAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
