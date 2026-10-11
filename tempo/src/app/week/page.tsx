import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Timesheet } from "@/components/week/timesheet";
import { localDay } from "@/lib/entries";
import { addDays, buildGrid, weekDays, weekRange, weekStart } from "@/lib/timesheet";
import { listActiveProjectOptions, listEntriesInRange } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

export const dynamic = "force-dynamic";

export default async function WeekPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const today = localDay(new Date().toISOString());
  const start = weekStart(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : today);
  const days = weekDays(start);
  const user = await getCurrentUser();
  const { from, to } = weekRange(start);
  const [entries, projects] = await Promise.all([listEntriesInRange(user.email, from, to), listActiveProjectOptions()]);
  const grid = buildGrid(entries, days);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
  const range = `${label.format(new Date(`${days[0]}T12:00:00Z`))} – ${label.format(new Date(`${days[6]}T12:00:00Z`))}`;
  const link = "text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-9 items-center justify-center rounded-input transition-colors duration-150 max-md:size-11";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Week</h1>
        <nav aria-label="Week" className="flex items-center gap-1">
          <Link href={`/week?week=${addDays(start, -7)}`} className={link} aria-label="Previous week">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-36 text-center text-sm font-medium">{range}</span>
          <Link href={`/week?week=${addDays(start, 7)}`} className={link} aria-label="Next week">
            <ChevronRight className="size-4" />
          </Link>
          <Link href="/week" className="text-muted-foreground hover:text-foreground ml-2 text-sm">
            This week
          </Link>
        </nav>
      </header>
      <Timesheet key={start} days={days} today={today} projects={projects} rows={grid.rows} columnTotals={grid.columnTotals} total={grid.total} />
    </div>
  );
}
