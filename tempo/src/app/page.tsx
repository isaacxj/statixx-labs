import Link from "next/link";
import { Sparkline } from "@/components/dashboard/sparkline";
import { buildDashboard } from "@/lib/dashboard";
import { localDay } from "@/lib/entries";
import { formatDuration } from "@/lib/format";
import { weekDays, weekRange, weekStart } from "@/lib/timesheet";
import { listProjects, listReportEntries } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card rounded-card flex flex-col gap-1 border p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}

export default async function HomePage() {
  const start = weekStart(localDay(new Date().toISOString()));
  const { from, to } = weekRange(start);
  const [entries, projects] = await Promise.all([listReportEntries(from, to), listProjects()]);
  const d = buildDashboard(entries, start);
  const colors = new Map(projects.map((p) => [p.id, p.color]));
  const days = weekDays(start);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">This week</h1>
        <p className="text-muted-foreground">
          {start} to {days[6]}, everyone&apos;s finished time. <Link href="/week" className="text-primary underline-offset-4 hover:underline">Open the timesheet</Link>
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Hours logged" value={formatDuration(d.totalMinutes)} />
        <Stat label="Billable" value={formatDuration(d.billableMinutes)} hint={`${d.billableShare}% of logged time`} />
        <Stat label="Non-billable" value={formatDuration(d.totalMinutes - d.billableMinutes)} />
      </div>
      <section className="bg-card rounded-card border">
        <h2 className="border-b px-4 py-3 text-base font-semibold">Hours per day</h2>
        <div className="flex flex-col gap-2 p-4">
          <Sparkline points={d.daily} />
          <ol className="grid grid-cols-7 text-center">
            {d.daily.map((p) => (
              <li key={p.day} className="flex flex-col">
                <span className="text-muted-foreground text-xs">{DAY_FORMAT.format(new Date(`${p.day}T12:00:00Z`))}</span>
                <span className="font-mono text-xs tabular-nums">{formatDuration(p.minutes)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="bg-card rounded-card border">
        <h2 className="border-b px-4 py-3 text-base font-semibold">Hours by project</h2>
        {d.byProject.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-start gap-2 px-4 py-6 text-sm">
            <p>No time logged this week yet.</p>
            <Link href="/today" className="text-primary underline-offset-4 hover:underline">Add time on Today</Link>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {d.byProject.map((p) => (
              <li key={p.projectId} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={`/projects/${p.projectId}`} className="flex min-w-0 items-center gap-2 font-medium hover:underline">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.get(p.projectId) }} />
                    <span className="truncate">{p.label}</span>
                  </Link>
                  <span className="font-mono tabular-nums">{formatDuration(p.minutes)}</span>
                </div>
                <div className="bg-secondary h-1.5 overflow-hidden rounded-full" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${Math.round((p.minutes / d.totalMinutes) * 100)}%`, backgroundColor: colors.get(p.projectId) }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
