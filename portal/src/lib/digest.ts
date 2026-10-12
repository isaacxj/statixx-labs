import type { ApprovalStatus, RequestStatus } from "@/server/db/schema";
import { formatPostedAt } from "@/lib/updates";

export type DigestProject = { id: number; name: string; clientName: string };
export type DigestRequest = { id: number; projectId: number; title: string; authorEmail: string; status: RequestStatus; createdAt: string };
export type DigestApproval = { id: number; projectId: number; title: string; status: ApprovalStatus; decidedBy: string | null; decidedAt: string | null };
export type DigestMilestone = { id: number; projectId: number; title: string; dueOn: string | null; doneOn: string | null };

export type DigestData = {
  projects: DigestProject[];
  requests: DigestRequest[];
  approvals: DigestApproval[];
  milestones: DigestMilestone[];
};

export type DigestLine = { key: string; projectId: number; clientName: string; projectName: string; title: string; detail: string };

export type Digest = {
  newRequests: DigestLine[];
  decisions: DigestLine[];
  overdueMilestones: DigestLine[];
  total: number;
  subject: string;
  text: string;
};

/** "YYYY-MM-DD HH:MM:SS" (UTC, as stored) for the moment `hours` before `now`. */
export function sinceUtc(now: Date, hours = 24): string {
  return new Date(now.getTime() - hours * 3600_000).toISOString().slice(0, 19).replace("T", " ");
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400_000);
}

/**
 * The morning digest: requests submitted and approvals decided since `since` (UTC, as stored),
 * plus every milestone that is past its due day (America/Chicago `today`) and not done.
 */
export function buildDigest(data: DigestData, since: string, today: string): Digest {
  const byId = new Map(data.projects.map((p) => [p.id, p]));
  const line = (key: string, projectId: number, title: string, detail: string): DigestLine | null => {
    const p = byId.get(projectId);
    return p ? { key, projectId, clientName: p.clientName, projectName: p.name, title, detail } : null;
  };
  const keep = (l: DigestLine | null): l is DigestLine => l !== null;

  const newRequests = data.requests
    .filter((r) => r.createdAt >= since)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
    .map((r) => line(`request-${r.id}`, r.projectId, r.title, `from ${r.authorEmail} · ${formatPostedAt(r.createdAt)}`))
    .filter(keep);

  const decisions = data.approvals
    .filter((a) => a.status !== "pending" && a.decidedAt !== null && a.decidedAt >= since)
    .sort((a, b) => (a.decidedAt ?? "").localeCompare(b.decidedAt ?? "") || a.id - b.id)
    .map((a) =>
      line(`approval-${a.id}`, a.projectId, a.title, `${a.status === "approved" ? "Approved" : "Changes requested"} by ${a.decidedBy ?? "a client"} · ${formatPostedAt(a.decidedAt ?? "")}`),
    )
    .filter(keep);

  const overdueMilestones = data.milestones
    .filter((m) => !m.doneOn && m.dueOn !== null && m.dueOn < today)
    .sort((a, b) => (a.dueOn ?? "").localeCompare(b.dueOn ?? "") || a.id - b.id)
    .map((m) => {
      const late = daysBetween(m.dueOn ?? today, today);
      return line(`milestone-${m.id}`, m.projectId, m.title, `due ${m.dueOn} · ${late} day${late === 1 ? "" : "s"} late`);
    })
    .filter(keep);

  const total = newRequests.length + decisions.length + overdueMilestones.length;
  const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;
  const subject =
    total === 0
      ? "Portal digest: nothing new"
      : `Portal digest: ${[
          newRequests.length ? count(newRequests.length, "new request") : "",
          decisions.length ? count(decisions.length, "decision") : "",
          overdueMilestones.length ? `${overdueMilestones.length} overdue` : "",
        ]
          .filter(Boolean)
          .join(", ")}`;

  const section = (title: string, lines: DigestLine[]) =>
    lines.length === 0 ? [] : [title, ...lines.map((l) => `- ${l.clientName} / ${l.projectName}: ${l.title} (${l.detail})`), ""];
  const text = [
    ...section("New requests", newRequests),
    ...section("Approval decisions", decisions),
    ...section("Overdue milestones", overdueMilestones),
  ];
  return { newRequests, decisions, overdueMilestones, total, subject, text: total === 0 ? "Nothing new since yesterday." : text.join("\n").trim() };
}
