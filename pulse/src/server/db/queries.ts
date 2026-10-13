import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "./index";
import { alertRecipients, checks, incidents, monitors, rollups, statusPageMonitors, statusPages } from "./schema";

export async function listMonitors() {
  return getDb().select().from(monitors).orderBy(monitors.client, monitors.name);
}

export async function listRecentChecks(monitorId: number, limit = 1) {
  return getDb().select().from(checks).where(eq(checks.monitorId, monitorId)).orderBy(desc(checks.at)).limit(limit);
}

export async function listMonitorsWithLatestCheck() {
  const rows = await listMonitors();
  return Promise.all(rows.map(async (m) => ({ ...m, latest: (await listRecentChecks(m.id))[0] ?? null })));
}

export type MonitorValues = Pick<typeof monitors.$inferInsert, "name" | "client" | "url" | "method" | "intervalSec" | "timeoutMs" | "expectedStatus" | "keyword">;

export async function createMonitor(values: MonitorValues) {
  const [row] = await getDb()
    .insert(monitors)
    .values({ ...values, status: "pending", nextCheckAt: sql`datetime('now')` })
    .returning({ id: monitors.id });
  return row.id;
}

export async function updateMonitor(id: number, values: MonitorValues) {
  await getDb().update(monitors).set({ ...values, updatedAt: sql`datetime('now')` }).where(eq(monitors.id, id));
}

export async function setMonitorPaused(id: number, paused: boolean) {
  await getDb()
    .update(monitors)
    .set(
      paused
        ? { active: false, status: "paused", updatedAt: sql`datetime('now')` }
        : { active: true, status: "pending", consecutiveFailures: 0, nextCheckAt: sql`datetime('now')`, updatedAt: sql`datetime('now')` },
    )
    .where(eq(monitors.id, id));
}

export async function deleteMonitor(id: number) {
  const db = getDb();
  await db.batch([db.delete(statusPageMonitors).where(eq(statusPageMonitors.monitorId, id)), db.delete(incidents).where(eq(incidents.monitorId, id)), db.delete(checks).where(eq(checks.monitorId, id)), db.delete(monitors).where(eq(monitors.id, id))]);
}

export async function listIncidents() {
  return getDb()
    .select({ incident: incidents, monitorName: monitors.name, client: monitors.client })
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .orderBy(desc(incidents.startedAt));
}

/** Every check since the given UTC timestamp, for uptime figures and sparklines. */
export async function listChecksSince(sinceUtc: string) {
  return getDb()
    .select({ monitorId: checks.monitorId, at: checks.at, ok: checks.ok, latencyMs: checks.latencyMs })
    .from(checks)
    .where(gt(checks.at, sinceUtc))
    .orderBy(checks.at);
}

export async function getMonitor(id: number) {
  const [row] = await getDb().select().from(monitors).where(eq(monitors.id, id));
  return row ?? null;
}

/** Checks for one monitor since the given UTC timestamp, oldest first. */
export async function listMonitorChecksSince(monitorId: number, sinceUtc: string) {
  return getDb()
    .select({ monitorId: checks.monitorId, at: checks.at, ok: checks.ok, latencyMs: checks.latencyMs })
    .from(checks)
    .where(and(eq(checks.monitorId, monitorId), gt(checks.at, sinceUtc)))
    .orderBy(checks.at);
}

export async function listMonitorIncidents(monitorId: number) {
  return getDb().select().from(incidents).where(eq(incidents.monitorId, monitorId)).orderBy(desc(incidents.startedAt));
}

export async function listMonitorCheckLog(monitorId: number, limit = 20) {
  return getDb().select().from(checks).where(eq(checks.monitorId, monitorId)).orderBy(desc(checks.at)).limit(limit);
}

export async function listAlertRecipients() {
  return getDb().select().from(alertRecipients).orderBy(alertRecipients.email);
}

/** Returns false when the address is already a recipient. */
export async function addAlertRecipient(email: string) {
  const rows = await getDb().insert(alertRecipients).values({ email }).onConflictDoNothing().returning({ id: alertRecipients.id });
  return rows.length > 0;
}

export async function setAlertRecipientActive(id: number, active: boolean) {
  await getDb().update(alertRecipients).set({ active, updatedAt: sql`datetime('now')` }).where(eq(alertRecipients.id, id));
}

export async function removeAlertRecipient(id: number) {
  await getDb().delete(alertRecipients).where(eq(alertRecipients.id, id));
}

export async function getRetentionStats() {
  const db = getDb();
  const [raw] = await db.select({ count: sql<number>`count(*)`, oldest: sql<string | null>`min(${checks.at})` }).from(checks);
  const [hourly] = await db.select({ count: sql<number>`count(*)`, oldest: sql<string | null>`min(${rollups.hour})` }).from(rollups);
  return { rawChecks: raw.count, oldestRaw: raw.oldest, rollups: hourly.count, oldestRollup: hourly.oldest };
}

export async function listStatusPages() {
  return getDb()
    .select({ page: statusPages, monitorCount: sql<number>`(select count(*) from status_page_monitors spm where spm.status_page_id = status_pages.id)` })
    .from(statusPages)
    .orderBy(statusPages.title);
}

export async function getStatusPage(id: number) {
  const db = getDb();
  const [page] = await db.select().from(statusPages).where(eq(statusPages.id, id));
  if (!page) return null;
  const items = await db
    .select({ monitorId: statusPageMonitors.monitorId, displayName: statusPageMonitors.displayName })
    .from(statusPageMonitors)
    .where(eq(statusPageMonitors.statusPageId, id))
    .orderBy(statusPageMonitors.position);
  return { page, items };
}

export type StatusPageValues = Pick<typeof statusPages.$inferInsert, "slug" | "title" | "accent" | "introMd">;

/** Returns null when the slug is already taken. */
export async function createStatusPage(values: StatusPageValues) {
  const rows = await getDb().insert(statusPages).values(values).onConflictDoNothing().returning({ id: statusPages.id });
  return rows[0]?.id ?? null;
}

/** Returns false when another page already uses the slug. */
export async function updateStatusPage(id: number, values: StatusPageValues) {
  const db = getDb();
  const [clash] = await db.select({ id: statusPages.id }).from(statusPages).where(and(eq(statusPages.slug, values.slug), sql`${statusPages.id} != ${id}`));
  if (clash) return false;
  await db.update(statusPages).set({ ...values, updatedAt: sql`datetime('now')` }).where(eq(statusPages.id, id));
  return true;
}

export async function deleteStatusPage(id: number) {
  const db = getDb();
  await db.batch([
    db.delete(statusPageMonitors).where(eq(statusPageMonitors.statusPageId, id)),
    db.update(incidents).set({ statusPageId: null }).where(eq(incidents.statusPageId, id)),
    db.delete(statusPages).where(eq(statusPages.id, id)),
  ]);
}

/** Replaces the page's monitors; array order is the display order. */
export async function setStatusPageMonitors(id: number, items: { monitorId: number; displayName: string }[]) {
  const db = getDb();
  const inserts = items.map((it, position) => db.insert(statusPageMonitors).values({ statusPageId: id, monitorId: it.monitorId, displayName: it.displayName, position }));
  await db.batch([db.delete(statusPageMonitors).where(eq(statusPageMonitors.statusPageId, id)), ...inserts]);
}
