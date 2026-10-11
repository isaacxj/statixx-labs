import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { EntryInput } from "@/lib/entries";
import { minutesBetween } from "@/lib/timer";
import { getDb } from "./index";
import { businesses, clients, projects, timeEntries } from "./schema";

export async function listBusinesses() {
  return getDb().select().from(businesses).orderBy(asc(businesses.name));
}

export async function listClients() {
  return getDb()
    .select({ id: clients.id, name: clients.name, businessName: businesses.name })
    .from(clients)
    .innerJoin(businesses, eq(clients.businessId, businesses.id))
    .orderBy(asc(clients.name));
}

export async function listProjects() {
  return getDb()
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
      billing: projects.billing,
      rateCents: projects.rateCents,
      budgetMinutes: projects.budgetMinutes,
      fixedFeeCents: projects.fixedFeeCents,
      color: projects.color,
      status: projects.status,
      currency: businesses.currency,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .innerJoin(businesses, eq(clients.businessId, businesses.id))
    .orderBy(asc(clients.name), asc(projects.name));
}

export async function getProject(id: number) {
  const rows = await getDb()
    .select({
      id: projects.id,
      clientId: projects.clientId,
      name: projects.name,
      billing: projects.billing,
      rateCents: projects.rateCents,
      budgetMinutes: projects.budgetMinutes,
      fixedFeeCents: projects.fixedFeeCents,
      color: projects.color,
      status: projects.status,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listClientsWithCounts() {
  const rows = await listClients();
  const ps = await listProjects();
  return rows.map((c) => ({ ...c, projectCount: ps.filter((p) => p.clientName === c.name && p.status === "active").length }));
}

export async function createClient(businessId: number, name: string) {
  await getDb().insert(clients).values({ businessId, name });
}

export async function renameClient(id: number, name: string) {
  await getDb().update(clients).set({ name, updatedAt: sql`(datetime('now'))` }).where(eq(clients.id, id));
}

type ProjectValues = Omit<typeof projects.$inferInsert, "id" | "status" | "createdAt" | "updatedAt">;

export async function createProject(values: ProjectValues) {
  await getDb().insert(projects).values(values);
}

export async function updateProject(id: number, values: ProjectValues) {
  await getDb().update(projects).set({ ...values, updatedAt: sql`(datetime('now'))` }).where(eq(projects.id, id));
}

export async function setProjectStatus(id: number, status: "active" | "archived") {
  await getDb().update(projects).set({ status, updatedAt: sql`(datetime('now'))` }).where(eq(projects.id, id));
}

export async function listActiveProjectOptions() {
  const rows = await listProjects();
  return rows
    .filter((p) => p.status === "active")
    .map((p) => ({ id: p.id, name: p.name, clientName: p.clientName, color: p.color }));
}

export async function getRunningEntry(ownerEmail: string) {
  const rows = await getDb()
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      description: timeEntries.description,
      startedAt: timeEntries.startedAt,
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.ownerEmail, ownerEmail), isNull(timeEntries.endedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/** Stops the owner's running timer, if any, and returns the finished entry id. */
export async function stopTimer(ownerEmail: string, now = new Date()) {
  const running = await getRunningEntry(ownerEmail);
  if (!running) return null;
  const endedAt = now.toISOString();
  await getDb()
    .update(timeEntries)
    .set({ endedAt, minutes: minutesBetween(running.startedAt, endedAt), updatedAt: sql`(datetime('now'))` })
    .where(and(eq(timeEntries.id, running.id), isNull(timeEntries.endedAt)));
  return running.id;
}

/** Starts a timer, stopping any running one first, in one atomic batch. */
export async function startTimer(ownerEmail: string, projectId: number, description: string, now = new Date()) {
  const db = getDb();
  const running = await getRunningEntry(ownerEmail);
  const iso = now.toISOString();
  const [project] = await db.select({ billing: projects.billing }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Unknown project");
  const insert = db.insert(timeEntries).values({
    projectId,
    ownerEmail,
    description,
    startedAt: iso,
    billable: project.billing !== "non_billable",
  });
  if (running) {
    await db.batch([
      db
        .update(timeEntries)
        .set({ endedAt: iso, minutes: minutesBetween(running.startedAt, iso), updatedAt: sql`(datetime('now'))` })
        .where(eq(timeEntries.id, running.id)),
      insert,
    ]);
  } else {
    await insert;
  }
}

/** The owner's finished entries, newest first, with project and client names. */
export async function listEntries(ownerEmail: string, limit = 200) {
  return getDb()
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      projectName: projects.name,
      clientName: clients.name,
      color: projects.color,
      description: timeEntries.description,
      startedAt: timeEntries.startedAt,
      endedAt: timeEntries.endedAt,
      minutes: timeEntries.minutes,
      billable: timeEntries.billable,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(and(eq(timeEntries.ownerEmail, ownerEmail), isNotNull(timeEntries.endedAt)))
    .orderBy(desc(timeEntries.startedAt))
    .limit(limit);
}

export async function createManualEntry(ownerEmail: string, input: EntryInput) {
  const [project] = await getDb().select({ billing: projects.billing }).from(projects).where(eq(projects.id, input.projectId)).limit(1);
  if (!project) throw new Error("Unknown project");
  await getDb().insert(timeEntries).values({ ...input, ownerEmail, billable: project.billing !== "non_billable" });
}

/** Deletes one of the owner's finished entries. Billed entries stay. */
export async function deleteEntry(ownerEmail: string, id: number) {
  await getDb()
    .delete(timeEntries)
    .where(and(eq(timeEntries.id, id), eq(timeEntries.ownerEmail, ownerEmail), isNotNull(timeEntries.endedAt), isNull(timeEntries.billedAt)));
}

/** Starts a new timer on the same project and description as an earlier entry. */
export async function restartEntry(ownerEmail: string, id: number) {
  const [entry] = await getDb()
    .select({ projectId: timeEntries.projectId, description: timeEntries.description })
    .from(timeEntries)
    .where(and(eq(timeEntries.id, id), eq(timeEntries.ownerEmail, ownerEmail)))
    .limit(1);
  if (!entry) return;
  await startTimer(ownerEmail, entry.projectId, entry.description);
}
