import Link from "next/link";
import { QuickStart } from "@/components/today/quick-start";
import { recentQuickStarts } from "@/lib/quick-start";
import { AddEntryForm } from "@/components/today/add-entry-form";
import { EntryRow } from "@/components/today/entry-row";
import { dayLabel, groupByDay, localDay } from "@/lib/entries";
import { formatDuration } from "@/lib/format";
import { listActiveProjectOptions, listEntries } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getCurrentUser();
  const [entries, projects] = await Promise.all([listEntries(user.email), listActiveProjectOptions()]);
  const quick = recentQuickStarts(entries).filter((q) => projects.some((p) => p.id === q.projectId));
  const today = localDay(new Date().toISOString());
  const groups = groupByDay(entries);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      </header>
      <QuickStart items={quick} />
      <AddEntryForm projects={projects} today={today} />
      {groups.length === 0 ? (
        <div className="bg-card rounded-card flex flex-col items-start gap-3 border p-6">
          <p className="font-medium">No time logged yet</p>
          <p className="text-muted-foreground text-sm">
            {projects.length === 0
              ? "Add a project first, then start a timer against it."
              : "Start the timer in the top bar, or add time you already worked above."}
          </p>
          {projects.length === 0 && (
            <Link href="/projects/new" className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-input px-4 font-medium max-md:h-11">
              Add a project
            </Link>
          )}
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.day} aria-labelledby={`day-${g.day}`} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 id={`day-${g.day}`} className="text-base font-medium">
                {dayLabel(g.day, today)}
              </h2>
              <span className="text-muted-foreground font-mono text-sm tabular-nums">{formatDuration(g.minutes)}</span>
            </div>
            <ul className="bg-card rounded-card divide-border divide-y border">
              {g.entries.map((en) => (
                <EntryRow key={en.id} entry={{ ...en, endedAt: en.endedAt! }} projects={projects} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
