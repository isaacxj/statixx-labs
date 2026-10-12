import { Check, Circle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { milestoneProgress, milestoneState } from "@/lib/milestones";
import { formatDate } from "@/lib/status";
import type { Milestone } from "@/server/db/schema";
import { addMilestoneAction, deleteMilestoneAction, toggleMilestoneAction } from "@/app/projects/actions";

/** Ordered milestone list for a project. Team gets controls; clients see the same timeline read-only. */
export function MilestoneTimeline({ projectId, items, today, canEdit }: { projectId: number; items: Milestone[]; today: string; canEdit: boolean }) {
  const { done, total } = milestoneProgress(items);
  return (
    <section className="flex flex-col gap-3" aria-labelledby="milestones-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="milestones-heading" className="text-base font-semibold">Milestones</h2>
        {total > 0 && <span className="text-muted-foreground font-mono text-xs tabular-nums">{done} of {total} done</span>}
      </div>
      {total === 0 ? (
        <p className="text-muted-foreground bg-card rounded-md border p-4 text-sm">
          {canEdit ? "No milestones yet. Add the first one below." : "No milestones have been added to this project yet."}
        </p>
      ) : (
        <ol className="bg-card divide-y rounded-md border">
          {items.map((m) => {
            const state = milestoneState(m, today);
            return (
              <li key={m.id} className="flex items-center gap-3 p-3">
                {canEdit ? (
                  <form action={toggleMilestoneAction.bind(null, projectId, m.id, state !== "done")}>
                    <Button type="submit" variant="ghost" size="icon" aria-label={state === "done" ? `Reopen ${m.title}` : `Complete ${m.title}`}>
                      {state === "done" ? <Check className="text-success" /> : <Circle className="text-muted-foreground" />}
                    </Button>
                  </form>
                ) : (
                  <span className="flex size-9 items-center justify-center max-sm:size-11" aria-hidden>
                    {state === "done" ? <Check className="text-success size-4" /> : <Circle className="text-muted-foreground size-4" />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={state === "done" ? "text-muted-foreground truncate text-sm line-through" : "truncate text-sm font-medium"}>{m.title}</p>
                  <p className="text-muted-foreground font-mono text-xs tabular-nums">
                    {state === "done" ? `Done ${formatDate(m.doneOn)}` : `Due ${formatDate(m.dueOn)}`}
                  </p>
                </div>
                {state === "overdue" && <Badge tone="danger">Overdue</Badge>}
                {state === "done" && <Badge tone="success">Done</Badge>}
                {canEdit && (
                  <form action={deleteMilestoneAction.bind(null, projectId, m.id)}>
                    <Button type="submit" variant="ghost" size="icon" aria-label={`Remove ${m.title}`}>
                      <Trash2 />
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {canEdit && (
        <form action={addMilestoneAction.bind(null, projectId)} className="bg-card grid gap-3 rounded-md border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            New milestone
            <Input name="title" required placeholder="Design approved" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Due
            <Input name="dueOn" type="date" />
          </label>
          <Button type="submit">Add milestone</Button>
        </form>
      )}
    </section>
  );
}
