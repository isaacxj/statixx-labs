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
  const today = localDay(new Date().toISOString());
  const groups = groupByDay(entries);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      </header>
      <AddEntryForm projects={projects} today={today} />
      {groups.length === 0 ? (
        <div className="bg-card rounded-card border p-6">
          <p className="text-muted-foreground">No time logged yet. Start the timer in the top bar, or add time you already worked.</p>
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
