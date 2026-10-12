import Markdown from "react-markdown";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPostedAt } from "@/lib/updates";
import type { Update } from "@/server/db/schema";
import { deleteUpdateAction, postUpdateAction } from "@/app/projects/actions";

/** Newest-first updates for a project. Team gets a composer and remove buttons; clients read only. */
export function UpdateFeed({ projectId, items, canEdit }: { projectId: number; items: Update[]; canEdit: boolean }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="updates-heading">
      <h2 id="updates-heading" className="text-base font-semibold">Updates</h2>
      {canEdit && (
        <form action={postUpdateAction.bind(null, projectId)} className="bg-card flex flex-col gap-3 rounded-md border p-4">
          <label className="flex flex-col gap-1 text-sm">
            Post an update
            <textarea
              name="body"
              required
              rows={4}
              maxLength={10000}
              placeholder="What changed? Markdown works: **bold**, lists, links."
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <div>
            <Button type="submit">Post update</Button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-md border p-4 text-sm">
          {canEdit ? "No updates yet. Post the first one above." : "No updates have been posted to this project yet."}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((u) => (
            <li key={u.id} className="bg-card rounded-md border p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <time className="text-muted-foreground font-mono text-xs tabular-nums" dateTime={`${u.createdAt.replace(" ", "T")}Z`}>
                  {formatPostedAt(u.createdAt)}
                </time>
                {canEdit && (
                  <form action={deleteUpdateAction.bind(null, projectId, u.id)}>
                    <Button type="submit" variant="ghost" size="icon" aria-label="Remove update">
                      <Trash2 />
                    </Button>
                  </form>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:rounded-sm [&_code]:px-1 [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                <Markdown>{u.bodyMd}</Markdown>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
