import Link from "next/link";
import { cn } from "@/lib/utils";

export type OverviewFilters = { status: string; client: string };

function href(f: OverviewFilters) {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.client) q.set("client", f.client);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "true" : undefined}
      className={cn(
        "focus-visible:ring-ring inline-flex min-h-11 items-center rounded-md border px-3 text-sm transition-colors outline-none focus-visible:ring-2 sm:min-h-8",
        active ? "bg-accent text-accent-foreground border-transparent font-medium" : "text-muted-foreground hover:bg-accent/60",
      )}
    >
      {children}
    </Link>
  );
}

export function MonitorFilters({ filters, clients, counts }: { filters: OverviewFilters; clients: string[]; counts: Record<string, number> }) {
  const statuses = ["up", "down", "paused", "pending"] as const;
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Chip to={href({ ...filters, status: "" })} active={!filters.status}>All {counts.all}</Chip>
        {statuses.map((s) => (
          <Chip key={s} to={href({ ...filters, status: s })} active={filters.status === s}>
            <span className="capitalize">{s}</span>&nbsp;{counts[s] ?? 0}
          </Chip>
        ))}
      </div>
      {clients.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by client">
          <Chip to={href({ ...filters, client: "" })} active={!filters.client}>All clients</Chip>
          {clients.map((c) => (
            <Chip key={c} to={href({ ...filters, client: c })} active={filters.client === c}>{c || "No client"}</Chip>
          ))}
        </div>
      )}
    </div>
  );
}
