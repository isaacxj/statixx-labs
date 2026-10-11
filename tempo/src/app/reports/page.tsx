import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDuration } from "@/lib/format";
import { buildReport, type Group } from "@/lib/reports";
import { loadReport } from "./range";

export const dynamic = "force-dynamic";

function GroupTable({ title, groups, total }: { title: string; groups: Group[]; total: number }) {
  return (
    <section className="bg-card rounded-card border">
      <h2 className="border-b px-4 py-3 text-base font-semibold">{title}</h2>
      {groups.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">No time logged in this range.</p>
      ) : (
        <ul className="divide-border divide-y">
          {groups.map((g) => (
            <li key={g.key} className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{g.label}</span>
                <span className="font-mono tabular-nums">
                  {formatDuration(g.minutes)}
                  <span className="text-muted-foreground"> · {formatDuration(g.billableMinutes)} billable</span>
                </span>
              </div>
              <div className="bg-secondary h-1.5 overflow-hidden rounded-full" aria-hidden>
                <div className="bg-primary h-full rounded-full" style={{ width: `${total ? Math.round((g.minutes / total) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const q = await searchParams;
  const { range, entries } = await loadReport(q.from, q.to);
  const r = buildReport(entries);
  const nonBillable = r.totalMinutes - r.billableMinutes;
  const share = r.totalMinutes ? Math.round((r.billableMinutes / r.totalMinutes) * 100) : 0;
  const stat = "bg-card rounded-card flex flex-col gap-1 border p-4";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Hours logged by everyone, by client, project, and week.</p>
        </div>
        <form className="flex flex-wrap items-end gap-2" action="/reports">
          <div className="flex flex-col gap-1">
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={range.from} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={range.to} />
          </div>
          <Button type="submit" variant="outline">
            Apply
          </Button>
          <Button asChild variant="outline">
            <a href={`/reports/export?from=${range.from}&to=${range.to}`} download>
              <Download className="size-4" /> CSV
            </a>
          </Button>
        </form>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={stat}>
          <span className="text-muted-foreground text-sm">Total hours</span>
          <span className="font-mono text-2xl tabular-nums">{formatDuration(r.totalMinutes)}</span>
        </div>
        <div className={stat}>
          <span className="text-muted-foreground text-sm">Billable</span>
          <span className="font-mono text-2xl tabular-nums">
            {formatDuration(r.billableMinutes)} <span className="text-muted-foreground text-base">{share}%</span>
          </span>
        </div>
        <div className={stat}>
          <span className="text-muted-foreground text-sm">Non-billable</span>
          <span className="font-mono text-2xl tabular-nums">{formatDuration(nonBillable)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GroupTable title="By client" groups={r.byClient} total={r.totalMinutes} />
        <GroupTable title="By project" groups={r.byProject} total={r.totalMinutes} />
      </div>
      <GroupTable title="By week (starting Monday)" groups={r.byWeek} total={r.totalMinutes} />
    </div>
  );
}
