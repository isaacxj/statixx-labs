import { Play, Trash2 } from "lucide-react";
import { AddEntryForm } from "@/components/today/add-entry-form";
import { Button } from "@/components/ui/button";
import { dayLabel, groupByDay, localDay, localTime } from "@/lib/entries";
import { formatDuration } from "@/lib/format";
import { listActiveProjectOptions, listEntries } from "@/server/db/queries";
import { getCurrentUser } from "@/server/user";
import { deleteEntryAction, restartEntryAction } from "./actions";

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
                <li key={en.id} className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: en.color }} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{en.description || en.projectName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {en.description && `${en.projectName} · `}
                      {en.clientName} · {localTime(en.startedAt)}–{localTime(en.endedAt!)}
                      {!en.billable && " · non-billable"}
                    </span>
                  </div>
                  <span className="font-mono text-sm tabular-nums">{formatDuration(en.minutes)}</span>
                  <form action={restartEntryAction.bind(null, en.id)}>
                    <Button variant="ghost" size="icon" type="submit" aria-label={`Restart ${en.description || en.projectName}`}>
                      <Play />
                    </Button>
                  </form>
                  <form action={deleteEntryAction.bind(null, en.id)}>
                    <Button variant="ghost" size="icon" type="submit" aria-label={`Delete ${en.description || en.projectName}`}>
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
