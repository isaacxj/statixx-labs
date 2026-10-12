import type { ProjectStatus, RequestStatus } from "@/server/db/schema";

export type OverviewProject = { id: number; clientId: number; name: string; status: ProjectStatus };
export type OverviewApproval = { id: number; projectId: number; title: string; createdAt: string };
export type OverviewRequest = { id: number; projectId: number; title: string; status: RequestStatus; createdAt: string };

export type WaitingItem = {
  kind: "approval" | "request";
  id: number;
  projectId: number;
  projectName: string;
  clientId: number;
  title: string;
  since: string;
};

export type ClientSummary = {
  clientId: number;
  projectCounts: Record<ProjectStatus, number>;
  openApprovals: number;
  openRequests: number;
  lastActivity: string | null;
};

/**
 * Pending approvals wait on the client; requests not yet done wait on us.
 * Oldest first, so the longest wait is at the top.
 */
export function splitWaiting(projects: OverviewProject[], approvals: OverviewApproval[], requests: OverviewRequest[]) {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const waitingOnClient: WaitingItem[] = [];
  const waitingOnUs: WaitingItem[] = [];
  for (const a of approvals) {
    const p = byId.get(a.projectId);
    if (p) waitingOnClient.push({ kind: "approval", id: a.id, projectId: p.id, projectName: p.name, clientId: p.clientId, title: a.title, since: a.createdAt });
  }
  for (const r of requests) {
    const p = byId.get(r.projectId);
    if (p && r.status !== "done") waitingOnUs.push({ kind: "request", id: r.id, projectId: p.id, projectName: p.name, clientId: p.clientId, title: r.title, since: r.createdAt });
  }
  const oldest = (a: WaitingItem, b: WaitingItem) => a.since.localeCompare(b.since) || a.id - b.id;
  return { waitingOnClient: waitingOnClient.sort(oldest), waitingOnUs: waitingOnUs.sort(oldest) };
}

/** One summary per client id: project status counts, open items, and the newest activity timestamp. */
export function summarizeClients(
  clientIds: number[],
  projects: OverviewProject[],
  waiting: { waitingOnClient: WaitingItem[]; waitingOnUs: WaitingItem[] },
  activity: { clientId: number; at: string }[],
): ClientSummary[] {
  return clientIds.map((clientId) => {
    const projectCounts: Record<ProjectStatus, number> = { on_track: 0, at_risk: 0, blocked: 0, done: 0 };
    for (const p of projects) if (p.clientId === clientId) projectCounts[p.status] += 1;
    const times = activity.filter((a) => a.clientId === clientId).map((a) => a.at);
    return {
      clientId,
      projectCounts,
      openApprovals: waiting.waitingOnClient.filter((w) => w.clientId === clientId).length,
      openRequests: waiting.waitingOnUs.filter((w) => w.clientId === clientId).length,
      lastActivity: times.length ? times.reduce((a, b) => (a > b ? a : b)) : null,
    };
  });
}
