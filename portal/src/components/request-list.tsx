import Markdown from "react-markdown";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileTypeIcon } from "@/components/file-list";
import { MAX_ATTACHMENTS, formatFileSize } from "@/lib/files";
import { REQUEST_LABELS, REQUEST_TITLE_MAX, REQUEST_TONES } from "@/lib/requests";
import { formatPostedAt } from "@/lib/updates";
import { CommentThread } from "@/components/comment-thread";
import { commentKey } from "@/lib/comments";
import { REQUEST_STATUSES, type ClientRequest, type Comment, type ProjectFile } from "@/server/db/schema";
import { setRequestStatusAction, submitRequestAction } from "@/app/projects/actions";

/**
 * Requests on a project. Client users send them (with attachments) and follow the status;
 * the team moves them between open, in progress and done.
 */
export function RequestList({ projectId, items, attachments, comments, teamEmails, isTeam, canSubmit }: { projectId: number; items: ClientRequest[]; attachments: Map<number, ProjectFile[]>; comments: Map<string, Comment[]>; teamEmails: string[]; isTeam: boolean; canSubmit: boolean }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="requests-heading">
      <h2 id="requests-heading" className="text-base font-semibold">Requests</h2>
      {canSubmit && (
        <form action={submitRequestAction.bind(null, projectId)} className="bg-card flex flex-col gap-3 rounded-md border p-4">
          <label className="flex flex-col gap-1 text-sm">
            Ask for something
            <Input name="title" required maxLength={REQUEST_TITLE_MAX} placeholder="Swap the hero photo on the homepage" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Details (optional)
            <textarea
              name="body"
              rows={3}
              maxLength={5000}
              className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Attachments (optional, up to {MAX_ATTACHMENTS})
            <input
              type="file"
              name="attachments"
              multiple
              className="border-input bg-background file:bg-secondary file:text-secondary-foreground focus-visible:ring-ring w-full rounded-md border text-sm file:mr-3 file:h-9 file:border-0 file:px-3 file:text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </label>
          <div>
            <Button type="submit">
              <Send /> Send request
            </Button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-md border p-4 text-sm">
          {isTeam ? "No requests from this client yet." : "You haven't sent any requests yet. Use the form above to ask for something."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id} className="bg-card flex flex-col gap-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium">{r.title}</h3>
                <Badge tone={REQUEST_TONES[r.status]}>{REQUEST_LABELS[r.status]}</Badge>
              </div>
              <p className="text-muted-foreground font-mono text-xs tabular-nums">
                {r.authorEmail} · {formatPostedAt(r.createdAt)}
              </p>
              {r.bodyMd && (
                <div className="flex flex-col gap-2 text-sm [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                  <Markdown>{r.bodyMd}</Markdown>
                </div>
              )}
              {(attachments.get(r.id) ?? []).length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Attachments">
                  {(attachments.get(r.id) ?? []).map((f) => (
                    <li key={f.id}>
                      <a
                        href={`/files/${f.id}`}
                        download
                        className="bg-secondary text-secondary-foreground hover:bg-accent focus-visible:ring-ring flex min-h-11 items-center gap-2 rounded-md px-3 text-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-9"
                      >
                        <FileTypeIcon name={f.name} className="size-4 shrink-0" />
                        <span className="max-w-48 truncate">{f.name}</span>
                        <span className="text-muted-foreground font-mono text-xs tabular-nums">{formatFileSize(f.size)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <CommentThread projectId={projectId} parentType="request" parentId={r.id} items={comments.get(commentKey("request", r.id)) ?? []} teamEmails={teamEmails} />
              {isTeam && (
                <form action={setRequestStatusAction.bind(null, projectId, r.id)} className="flex items-end gap-2 border-t pt-3">
                  <label className="flex flex-col gap-1 text-sm">
                    Status
                    <Select name="status" defaultValue={r.status}>
                      {REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>{REQUEST_LABELS[s]}</option>
                      ))}
                    </Select>
                  </label>
                  <Button type="submit" variant="outline">Update</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
