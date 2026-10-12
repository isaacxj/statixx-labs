import Markdown from "react-markdown";
import { Check, MessageSquareWarning, Paperclip, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { APPROVAL_LABELS, APPROVAL_TITLE_MAX, APPROVAL_TONES } from "@/lib/approvals";
import { formatPostedAt } from "@/lib/updates";
import type { Approval, ProjectFile } from "@/server/db/schema";
import { decideApprovalAction, deleteApprovalAction, requestApprovalAction } from "@/app/projects/actions";

type Item = Approval & { fileName: string | null };

/**
 * Approvals on a project. Team requests and removes them; approvers decide pending ones;
 * viewers and the team see the state read-only.
 */
export function ApprovalList({ projectId, items, files, isTeam, canDecide }: { projectId: number; items: Item[]; files: ProjectFile[]; isTeam: boolean; canDecide: boolean }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="approvals-heading">
      <h2 id="approvals-heading" className="text-base font-semibold">Approvals</h2>
      {isTeam && (
        <form action={requestApprovalAction.bind(null, projectId)} className="bg-card grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Request an approval
            <Input name="title" required maxLength={APPROVAL_TITLE_MAX} placeholder="Homepage design, round 2" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            What should they check? (optional)
            <textarea
              name="description"
              rows={3}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Deliverable file (optional)
            <Select name="fileId" defaultValue="">
              <option value="">No file</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button type="submit">Request approval</Button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-md border p-4 text-sm">
          {isTeam ? "No approvals yet. Request one above when a deliverable is ready." : "Nothing is waiting for your approval."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => (
            <li key={a.id} className="bg-card flex flex-col gap-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium">{a.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge tone={APPROVAL_TONES[a.status]}>{APPROVAL_LABELS[a.status]}</Badge>
                  {isTeam && (
                    <form action={deleteApprovalAction.bind(null, projectId, a.id)}>
                      <Button type="submit" variant="ghost" size="icon" aria-label={`Remove approval ${a.title}`}>
                        <Trash2 />
                      </Button>
                    </form>
                  )}
                </div>
              </div>
              {a.descriptionMd && (
                <div className="text-muted-foreground flex flex-col gap-2 text-sm [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                  <Markdown>{a.descriptionMd}</Markdown>
                </div>
              )}
              {a.fileId && a.fileName && (
                <a
                  href={`/files/${a.fileId}`}
                  download
                  className="bg-secondary text-secondary-foreground hover:bg-accent focus-visible:ring-ring flex min-h-11 w-fit items-center gap-2 rounded-md px-3 text-sm focus-visible:ring-2 focus-visible:outline-none sm:min-h-9"
                >
                  <Paperclip className="size-4 shrink-0" aria-hidden />
                  <span className="max-w-64 truncate">{a.fileName}</span>
                </a>
              )}
              {a.status !== "pending" && a.decidedBy && a.decidedAt && (
                <div className="border-t pt-3 text-sm">
                  <p className="text-muted-foreground font-mono text-xs tabular-nums">
                    {a.status === "approved" ? "Approved" : "Changes requested"} by {a.decidedBy} · {formatPostedAt(a.decidedAt)}
                  </p>
                  {a.comment && <p className="mt-1 whitespace-pre-wrap">{a.comment}</p>}
                </div>
              )}
              {a.status === "pending" && canDecide && (
                <form action={decideApprovalAction.bind(null, projectId, a.id)} className="flex flex-col gap-2 border-t pt-3">
                  <label className="flex flex-col gap-1 text-sm">
                    Comment (required when asking for changes)
                    <textarea
                      name="comment"
                      rows={2}
                      className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" name="decision" value="approve">
                      <Check /> Approve
                    </Button>
                    <Button type="submit" name="decision" value="changes" variant="outline">
                      <MessageSquareWarning /> Request changes
                    </Button>
                  </div>
                </form>
              )}
              {a.status === "pending" && !isTeam && !canDecide && (
                <p className="text-muted-foreground border-t pt-3 text-xs">Only approvers on your team can decide this.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
