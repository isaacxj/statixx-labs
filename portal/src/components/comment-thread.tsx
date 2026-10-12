import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { COMMENT_MAX } from "@/lib/comments";
import { formatPostedAt } from "@/lib/updates";
import type { Comment, CommentParentType } from "@/server/db/schema";
import { addCommentAction } from "@/app/projects/actions";

/** Comments on one approval or request, oldest first, with a reply box for anyone who can see it. */
export function CommentThread({ projectId, parentType, parentId, items, teamEmails }: { projectId: number; parentType: CommentParentType; parentId: number; items: Comment[]; teamEmails: string[] }) {
  return (
    <div className="flex flex-col gap-3 border-t pt-3" role="group" aria-label="Comments">
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id} className="bg-muted flex flex-col gap-1 rounded-md px-3 py-2 text-sm">
              <p className="text-muted-foreground font-mono text-xs tabular-nums">
                {c.authorEmail}{teamEmails.includes(c.authorEmail.toLowerCase()) ? " (team)" : ""} · {formatPostedAt(c.createdAt)}
              </p>
              <div className="flex flex-col gap-2 [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                <Markdown>{c.bodyMd}</Markdown>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form action={addCommentAction.bind(null, projectId, parentType, parentId)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          {items.length > 0 ? "Reply" : "Add a comment"}
          <textarea
            name="body"
            required
            rows={2}
            maxLength={COMMENT_MAX}
            className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          />
        </label>
        <Button type="submit" variant="outline">Send</Button>
      </form>
    </div>
  );
}
