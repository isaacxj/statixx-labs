import { describeEvent } from "@/lib/activity";
import type { ProposalEvent } from "@/server/db/schema";

const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const when = (utc: string) => fmt.format(new Date(`${utc.replace(" ", "T")}Z`));

export function ActivityTimeline({ events, viewCount }: { events: ProposalEvent[]; viewCount: number }) {
  return (
    <section aria-labelledby="activity-h" className="bg-card flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="activity-h" className="text-base font-semibold">Activity</h2>
        <span className="text-muted-foreground text-xs">
          {viewCount === 0 ? "Not opened yet" : `${viewCount} ${viewCount === 1 ? "view" : "views"}`}
        </span>
      </div>
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing yet. Sending the proposal starts the timeline.</p>
      ) : (
        <ol className="flex flex-col">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-1.5">
              <span aria-hidden className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
              <span className="flex-1 text-sm">{describeEvent(e.type, e.metaJson)}</span>
              <time dateTime={`${e.at.replace(" ", "T")}Z`} className="tabular text-muted-foreground font-mono text-xs">{when(e.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
