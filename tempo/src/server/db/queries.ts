import { and, asc, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { centralToUtc, splitEntryTimes, type EntryInput } from "@/lib/entries";
import { addDays, planCellEdit } from "@/lib/timesheet";
import { defaultBillable, roundMinutes } from "@/lib/rounding";
import { minutesBetween } from "@/lib/timer";
import { getDb } from "./index";
import { businesses, clients, projects, timeEntries } from "./schema";

export async function listBusinesses() {
  return getDb().select().from(businesses).orderBy(asc(businesses.name));
}

export async function updateBusinessRounding(id: number, roundingMinutes: number) {
  await getDb().update(businesses).set({ roundingMinutes, updatedAt: sql`(datetime('now'))` }).where(eq(businesses.id, id));
}

/** The rounding increment (0, 6, or 15) of the business a project's client belongs to. */
export async function getRoundingForProject(projectId: number): Promise<number> {
  const rows = await getDb()
    .select({ rounding: businesses.roundingMinutes })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .innerJoin(businesses, eq(clients.businessId, businesses.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows[0]?.rounding ?? 0;
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
  const rounding = await getRoundingForProject(running.projectId);
  await getDb()
    .update(timeEntries)
    .set({ endedAt, minutes: roundMinutes(minutesBetween(running.startedAt, endedAt), rounding), updatedAt: sql`(datetime('now'))` })
    .where(and(eq(timeEntries.id, running.id), isNull(timeEntries.endedAt)));
  return running.id;
}

/** Starts a timer, stopping any running one first, in one atomic batch. */
export async function startTimer(ownerEmail: string, projectId: number, description: string, now = new Date()) {
  const db = getDb();
  const running = await getRunningEntry(ownerEmail);
  const iso = now.toISOString();
  const rounding = running ? await getRoundingForProject(running.projectId) : 0;
  const [project] = await db.select({ billing: projects.billing }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Unknown project");
  const insert = db.insert(timeEntries).values({
    projectId,
    ownerEmail,
    description,
    startedAt: iso,
    billable: defaultBillable(project.billing),
  });
  if (running) {
    await db.batch([
      db
        .update(timeEntries)
        .set({ endedAt: iso, minutes: roundMinutes(minutesBetween(running.startedAt, iso), rounding), updatedAt: sql`(datetime('now'))` })
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
      billedAt: timeEntries.billedAt,
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
  await getDb().insert(timeEntries).values({ ...input, ownerEmail, billable: defaultBillable(project.billing) });
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

/** Updates one of the owner's finished, unbilled entries. */
export async function updateEntry(ownerEmail: string, id: number, input: EntryInput) {
  await getDb()
    .update(timeEntries)
    .set({ ...input, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(timeEntries.id, id), eq(timeEntries.ownerEmail, ownerEmail), isNotNull(timeEntries.endedAt), isNull(timeEntries.billedAt)));
}

/** Splits a finished, unbilled entry in two at `firstMinutes`, atomically. Returns an error message or null. */
export async function splitEntry(ownerEmail: string, id: number, firstMinutes: number | null): Promise<string | null> {
  const db = getDb();
  const [en] = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.id, id), eq(timeEntries.ownerEmail, ownerEmail), isNotNull(timeEntries.endedAt), isNull(timeEntries.billedAt)))
    .limit(1);
  if (!en) return "Entry not found.";
  const r = splitEntryTimes(en.startedAt, en.minutes, firstMinutes);
  if (!r.ok) return r.error;
  await db.batch([
    db.update(timeEntries).set({ ...r.first, updatedAt: sql`(datetime('now'))` }).where(eq(timeEntries.id, id)),
    db.insert(timeEntries).values({
      projectId: en.projectId,
      ownerEmail,
      description: en.description,
      billable: en.billable,
      ...r.second,
    }),
  ]);
  return null;
}

/** The owner's finished entries starting in [from, to), for the week timesheet. */
export async function listEntriesInRange(ownerEmail: string, from: string, to: string) {
  return getDb()
    .select({ id: timeEntries.id, projectId: timeEntries.projectId, startedAt: timeEntries.startedAt, minutes: timeEntries.minutes })
    .from(timeEntries)
    .where(and(eq(timeEntries.ownerEmail, ownerEmail), isNotNull(timeEntries.endedAt), gte(timeEntries.startedAt, from), lt(timeEntries.startedAt, to)))
    .orderBy(asc(timeEntries.startedAt));
}

/** Sets a project's total for one Central day, adjusting entries per `planCellEdit`. Returns an error message or null. */
export async function setCellMinutes(ownerEmail: string, projectId: number, day: string, minutes: number): Promise<string | null> {
  const db = getDb();
  const [project] = await db.select({ billing: projects.billing }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return "Unknown project.";
  const dayStart = centralToUtc(day, "00:00");
  const dayEnd = centralToUtc(addDays(day, 1), "00:00");
  const existing = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.ownerEmail, ownerEmail),
        eq(timeEntries.projectId, projectId),
        isNotNull(timeEntries.endedAt),
        gte(timeEntries.startedAt, dayStart),
        lt(timeEntries.startedAt, dayEnd),
      ),
    );
  const plan = planCellEdit(
    existing.map((e) => ({ id: e.id, startedAt: e.startedAt, minutes: e.minutes, billed: e.billedAt !== null })),
    minutes,
  );
  if (!plan.ok) return plan.error;
  const byId = new Map(existing.map((e) => [e.id, e]));
  const ops = [
    ...plan.updates.map((u) => {
      const en = byId.get(u.id)!;
      const endedAt = new Date(new Date(en.startedAt).getTime() + u.minutes * 60000).toISOString();
      return db.update(timeEntries).set({ minutes: u.minutes, endedAt, updatedAt: sql`(datetime('now'))` }).where(eq(timeEntries.id, u.id));
    }),
    ...plan.deletes.map((id) => db.delete(timeEntries).where(eq(timeEntries.id, id))),
  ];
  if (plan.create > 0) {
    const startedAt = centralToUtc(day, "09:00");
    const endedAt = new Date(new Date(startedAt).getTime() + plan.create * 60000).toISOString();
    ops.push(
      db.insert(timeEntries).values({
        projectId,
        ownerEmail,
        description: "",
        startedAt,
        endedAt,
        minutes: plan.create,
        billable: defaultBillable(project.billing),
      }) as never,
    );
  }
  if (ops.length > 0) await db.batch(ops as [(typeof ops)[0], ...(typeof ops)[0][]]);
  return null;
}
