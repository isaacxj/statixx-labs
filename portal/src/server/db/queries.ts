import { and, asc, desc, eq, sql } from "drizzle-orm";
import { sortMilestones, type MilestoneInput } from "@/lib/milestones";
import { canDecideApproval, canSeeClient, canSubmitRequest, type CurrentUser } from "@/lib/access";
import type { ApprovalDecision, ApprovalInput } from "@/lib/approvals";
import type { RequestInput } from "@/lib/requests";
import { getDb } from "./index";
import type { ProjectInput } from "@/lib/projects";
import { approvals, clientUsers, clients, comments, files, milestones, projects, requests, updates, type ClientUserRole, type CommentParentType, type RequestStatus } from "./schema";

export async function listClientsWithUsers() {
  const db = getDb();
  const [clientRows, userRows] = await Promise.all([
    db.select().from(clients).orderBy(asc(clients.name)),
    db.select().from(clientUsers).orderBy(asc(clientUsers.email)),
  ]);
  return clientRows.map((c) => ({ ...c, users: userRows.filter((u) => u.clientId === c.id) }));
}

export async function listProjectsWithClient() {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      summary: projects.summary,
      dueOn: projects.dueOn,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(asc(clients.name), asc(projects.name));
}

/** Projects the given client user may see: only their own client's, and only while their access is active. */
export async function listProjectsForClientEmail(email: string) {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      summary: projects.summary,
      dueOn: projects.dueOn,
      clientName: clients.name,
    })
    .from(clientUsers)
    .innerJoin(clients, eq(clientUsers.clientId, clients.id))
    .innerJoin(projects, eq(projects.clientId, clients.id))
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .orderBy(asc(projects.name));
}

/** Milestones across the projects an active client user may see; empty for anyone else. */
export async function listMilestonesForClientEmail(email: string) {
  return getDb()
    .select({ milestone: milestones })
    .from(clientUsers)
    .innerJoin(projects, eq(projects.clientId, clientUsers.clientId))
    .innerJoin(milestones, eq(milestones.projectId, projects.id))
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .then((rows) => rows.map((r) => r.milestone));
}

/** Newest updates across the projects an active client user may see; empty for anyone else. */
export async function listLatestUpdatesForClientEmail(email: string, limit: number) {
  return getDb()
    .select({ id: updates.id, projectId: projects.id, projectName: projects.name, bodyMd: updates.bodyMd, createdAt: updates.createdAt })
    .from(clientUsers)
    .innerJoin(projects, eq(projects.clientId, clientUsers.clientId))
    .innerJoin(updates, eq(updates.projectId, projects.id))
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .orderBy(desc(updates.createdAt), desc(updates.id))
    .limit(limit);
}

export async function hasActiveClientUser(email: string) {
  const rows = await getDb()
    .select({ id: clientUsers.id })
    .from(clientUsers)
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .limit(1);
  return rows.length > 0;
}

/** The active client user behind an email, with their client, or null. */
export async function getActiveClientUser(email: string) {
  const rows = await getDb()
    .select({ clientId: clientUsers.clientId, clientName: clients.name, role: clientUsers.role })
    .from(clientUsers)
    .innerJoin(clients, eq(clientUsers.clientId, clients.id))
    .where(and(sql`lower(${clientUsers.email}) = ${email.trim().toLowerCase()}`, eq(clientUsers.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

/** One project, only if the user may see its client; null otherwise so callers answer 404. */
export async function getProjectForUser(user: CurrentUser, projectId: number) {
  if (user.kind === "none") return null;
  const rows = await getDb()
    .select({
      id: projects.id,
      clientId: projects.clientId,
      name: projects.name,
      status: projects.status,
      summary: projects.summary,
      startsOn: projects.startsOn,
      dueOn: projects.dueOn,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  const project = rows[0];
  return project && canSeeClient(user, project.clientId) ? project : null;
}

/** Team-only: one client with all of its users, or null. */
export async function getClientWithUsers(clientId: number) {
  const db = getDb();
  const [clientRows, userRows, projectRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, clientId)).limit(1),
    db.select().from(clientUsers).where(eq(clientUsers.clientId, clientId)).orderBy(asc(clientUsers.email)),
    db.select({ id: projects.id, name: projects.name, status: projects.status }).from(projects).where(eq(projects.clientId, clientId)).orderBy(asc(projects.name)),
  ]);
  const client = clientRows[0];
  return client ? { ...client, users: userRows, projects: projectRows } : null;
}

export async function insertClient(input: { name: string; slug: string; accent: string }) {
  const rows = await getDb().insert(clients).values(input).onConflictDoNothing().returning({ id: clients.id });
  return rows[0]?.id ?? null;
}

/** Returns false when the email already belongs to a client user (emails are unique across clients). */
export async function insertClientUser(clientId: number, input: { email: string; name: string; role: ClientUserRole }) {
  const rows = await getDb().insert(clientUsers).values({ clientId, ...input }).onConflictDoNothing().returning({ id: clientUsers.id });
  return rows.length > 0;
}

export async function updateClientUser(clientId: number, userId: number, patch: { role?: ClientUserRole; active?: boolean }) {
  await getDb()
    .update(clientUsers)
    .set({ ...patch, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(clientUsers.id, userId), eq(clientUsers.clientId, clientId)));
}

export async function insertProject(clientId: number, input: ProjectInput) {
  const rows = await getDb().insert(projects).values({ clientId, ...input }).returning({ id: projects.id });
  return rows[0].id;
}

/** Team-only write; callers check the role. */
export async function updateProject(projectId: number, input: ProjectInput) {
  await getDb()
    .update(projects)
    .set({ ...input, updatedAt: sql`(datetime('now'))` })
    .where(eq(projects.id, projectId));
}

/** Milestones of one project, in timeline order, only if the user may see its client; empty otherwise. */
export async function listMilestonesForUser(user: CurrentUser, projectId: number) {
  const project = await getProjectForUser(user, projectId);
  if (!project) return [];
  const rows = await getDb().select().from(milestones).where(eq(milestones.projectId, projectId));
  return sortMilestones(rows);
}

/** Team-only write; callers check the role. */
export async function insertMilestone(projectId: number, input: MilestoneInput) {
  const db = getDb();
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${milestones.position}), -1) + 1` })
    .from(milestones)
    .where(eq(milestones.projectId, projectId));
  await db.insert(milestones).values({ projectId, ...input, position: next });
}

/** Team-only: sets or clears the done day; scoped to the project so an id from another project is ignored. */
export async function setMilestoneDone(projectId: number, milestoneId: number, doneOn: string | null) {
  await getDb()
    .update(milestones)
    .set({ doneOn, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)));
}

export async function deleteMilestone(projectId: number, milestoneId: number) {
  await getDb().delete(milestones).where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)));
}

/** Updates of one project, newest first, only if the user may see its client; empty otherwise. */
export async function listUpdatesForUser(user: CurrentUser, projectId: number) {
  const project = await getProjectForUser(user, projectId);
  if (!project) return [];
  return getDb().select().from(updates).where(eq(updates.projectId, projectId)).orderBy(desc(updates.createdAt), desc(updates.id));
}

/** Team-only write; callers check the role. */
export async function insertUpdate(projectId: number, authorEmail: string, bodyMd: string) {
  const rows = await getDb().insert(updates).values({ projectId, authorEmail, bodyMd }).returning({ id: updates.id });
  return rows[0].id;
}

/** Team-only; scoped to the project. Removes the update and its attachments; returns the R2 keys to delete. */
export async function deleteUpdate(projectId: number, updateId: number) {
  const db = getDb();
  const owned = await db.select({ id: updates.id }).from(updates).where(and(eq(updates.id, updateId), eq(updates.projectId, projectId))).limit(1);
  if (!owned[0]) return [];
  const attached = await db.select({ r2Key: files.r2Key }).from(files).where(and(eq(files.updateId, updateId), eq(files.projectId, projectId)));
  await db.batch([
    db.update(approvals).set({ fileId: null }).where(sql`${approvals.fileId} in (select ${files.id} from ${files} where ${files.updateId} = ${updateId})`),
    db.delete(files).where(and(eq(files.updateId, updateId), eq(files.projectId, projectId))),
    db.delete(updates).where(and(eq(updates.id, updateId), eq(updates.projectId, projectId))),
  ]);
  return attached.map((f) => f.r2Key);
}

/** Files of one project, newest first, only if the user may see its client; empty otherwise. */
export async function listFilesForUser(user: CurrentUser, projectId: number) {
  const project = await getProjectForUser(user, projectId);
  if (!project) return [];
  return getDb().select().from(files).where(eq(files.projectId, projectId)).orderBy(desc(files.createdAt), desc(files.id));
}

/** One file, only if the user may see its project's client; null otherwise so the download answers 404. */
export async function getFileForUser(user: CurrentUser, fileId: number) {
  const rows = await getDb().select().from(files).where(eq(files.id, fileId)).limit(1);
  const file = rows[0];
  if (!file) return null;
  return (await getProjectForUser(user, file.projectId)) ? file : null;
}

/** Team-only write; callers check the role. */
export async function insertFile(input: { projectId: number; updateId?: number; requestId?: number; r2Key: string; name: string; size: number; contentType: string; uploadedBy: string }) {
  await getDb().insert(files).values(input);
}

/** Team-only; scoped to the project. Returns the R2 key to delete, or null when nothing matched. */
export async function deleteFile(projectId: number, fileId: number) {
  const db = getDb();
  const [, rows] = await db.batch([
    db.update(approvals).set({ fileId: null }).where(and(eq(approvals.fileId, fileId), eq(approvals.projectId, projectId))),
    db.delete(files).where(and(eq(files.id, fileId), eq(files.projectId, projectId))).returning({ r2Key: files.r2Key }),
  ]);
  return rows[0]?.r2Key ?? null;
}

/** Approvals of one project, pending first then newest, with the attached file's name; empty unless the user may see the project. */
export async function listApprovalsForUser(user: CurrentUser, projectId: number) {
  const project = await getProjectForUser(user, projectId);
  if (!project) return [];
  const rows = await getDb()
    .select({ approval: approvals, fileName: files.name })
    .from(approvals)
    .leftJoin(files, eq(approvals.fileId, files.id))
    .where(eq(approvals.projectId, projectId))
    .orderBy(desc(approvals.createdAt), desc(approvals.id));
  return rows
    .map((r) => ({ ...r.approval, fileName: r.fileName }))
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
}

/** Team-only write; callers check the role. The file, if any, must belong to the same project. */
export async function insertApproval(projectId: number, input: ApprovalInput) {
  const db = getDb();
  let fileId = input.fileId;
  if (fileId !== null) {
    const owned = await db.select({ id: files.id }).from(files).where(and(eq(files.id, fileId), eq(files.projectId, projectId))).limit(1);
    if (!owned[0]) fileId = null;
  }
  await db.insert(approvals).values({ projectId, title: input.title, descriptionMd: input.descriptionMd, fileId });
}

/** Team-only; scoped to the project. */
export async function deleteApproval(projectId: number, approvalId: number) {
  const db = getDb();
  await db.batch([
    db.delete(comments).where(and(eq(comments.parentType, "approval"), eq(comments.parentId, approvalId), sql`exists (select 1 from approvals where approvals.id = ${approvalId} and approvals.project_id = ${projectId})`)),
    db.delete(approvals).where(and(eq(approvals.id, approvalId), eq(approvals.projectId, projectId))),
  ]);
}

/**
 * An approver records a decision on a pending approval in their own client's project.
 * Returns false when the user can't decide, can't see the project, or it was already decided.
 */
export async function decideApproval(user: CurrentUser, projectId: number, approvalId: number, decision: ApprovalDecision) {
  if (!canDecideApproval(user)) return false;
  if (!(await getProjectForUser(user, projectId))) return false;
  const rows = await getDb()
    .update(approvals)
    .set({ status: decision.status, comment: decision.comment, decidedBy: user.email, decidedAt: sql`datetime('now')`, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(approvals.id, approvalId), eq(approvals.projectId, projectId), eq(approvals.status, "pending")))
    .returning({ id: approvals.id });
  return rows.length > 0;
}

/** Requests of one project, open ones first then newest, only if the user may see its client; empty otherwise. */
export async function listRequestsForUser(user: CurrentUser, projectId: number) {
  const project = await getProjectForUser(user, projectId);
  if (!project) return [];
  const rows = await getDb().select().from(requests).where(eq(requests.projectId, projectId)).orderBy(desc(requests.createdAt), desc(requests.id));
  return rows.sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
}

/** A client user files a request on a project of their own client. Returns the new id, or null when they may not. */
export async function insertRequest(user: CurrentUser, projectId: number, input: RequestInput) {
  if (!canSubmitRequest(user)) return null;
  if (!(await getProjectForUser(user, projectId))) return null;
  const rows = await getDb()
    .insert(requests)
    .values({ projectId, authorEmail: user.email, title: input.title, bodyMd: input.bodyMd })
    .returning({ id: requests.id });
  return rows[0].id;
}

/** Team-only; scoped to the project so an id from another project is ignored. */
export async function setRequestStatus(projectId: number, requestId: number, status: RequestStatus) {
  await getDb()
    .update(requests)
    .set({ status, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(requests.id, requestId), eq(requests.projectId, projectId)));
}

/** Comments on the approvals and requests of one project; empty unless the user may see the project. */
export async function listCommentsForUser(user: CurrentUser, projectId: number) {
  const project = await getProjectForUser(user, projectId);
  if (!project) return [];
  const db = getDb();
  const [onApprovals, onRequests] = await Promise.all([
    db.select({ comment: comments }).from(comments).innerJoin(approvals, and(eq(comments.parentType, "approval"), eq(comments.parentId, approvals.id))).where(eq(approvals.projectId, projectId)),
    db.select({ comment: comments }).from(comments).innerJoin(requests, and(eq(comments.parentType, "request"), eq(comments.parentId, requests.id))).where(eq(requests.projectId, projectId)),
  ]);
  return [...onApprovals, ...onRequests].map((r) => r.comment);
}

/**
 * The team or a client user comments on an approval or request of a project they can see.
 * Returns false when the user may not, or the parent isn't in that project.
 */
export async function insertComment(user: CurrentUser, projectId: number, parentType: CommentParentType, parentId: number, bodyMd: string) {
  if (user.kind === "none") return false;
  if (!(await getProjectForUser(user, projectId))) return false;
  const db = getDb();
  const table = parentType === "approval" ? approvals : requests;
  const parent = await db.select({ id: table.id }).from(table).where(and(eq(table.id, parentId), eq(table.projectId, projectId))).limit(1);
  if (!parent[0]) return false;
  await db.insert(comments).values({ parentType, parentId, authorEmail: user.email, bodyMd });
  return true;
}

/** Team-wide rows for the overview: every project, pending approval, unfinished request, and activity timestamp. */
export async function getTeamOverviewData() {
  const db = getDb();
  const [projectRows, approvalRows, requestRows, updateRows] = await Promise.all([
    db.select({ id: projects.id, clientId: projects.clientId, name: projects.name, status: projects.status }).from(projects).orderBy(asc(projects.name)),
    db.select({ id: approvals.id, projectId: approvals.projectId, title: approvals.title, status: approvals.status, createdAt: approvals.createdAt, updatedAt: approvals.updatedAt }).from(approvals),
    db.select({ id: requests.id, projectId: requests.projectId, title: requests.title, status: requests.status, createdAt: requests.createdAt, updatedAt: requests.updatedAt }).from(requests),
    db.select({ projectId: updates.projectId, at: updates.createdAt }).from(updates),
  ]);
  const clientOf = new Map(projectRows.map((p) => [p.id, p.clientId]));
  const activity: { clientId: number; at: string }[] = [];
  for (const u of updateRows) activity.push({ clientId: clientOf.get(u.projectId) ?? -1, at: u.at });
  for (const a of approvalRows) activity.push({ clientId: clientOf.get(a.projectId) ?? -1, at: a.updatedAt });
  for (const r of requestRows) activity.push({ clientId: clientOf.get(r.projectId) ?? -1, at: r.updatedAt });
  return { projects: projectRows, approvals: approvalRows.filter((a) => a.status === "pending"), requests: requestRows, activity };
}
