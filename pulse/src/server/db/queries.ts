import { and, desc, eq, gt, inArray, or, sql } from "drizzle-orm";
import type { IncidentInput, UpdateInput } from "@/lib/incident-form";
import { getDb } from "./index";
import { alertRecipients, checks, incidents, incidentUpdates, maintenanceWindows, monitors, rollups, statusPageMonitors, statusPages } from "./schema";

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
  await db.batch([db.delete(maintenanceWindows).where(eq(maintenanceWindows.monitorId, id)), db.delete(statusPageMonitors).where(eq(statusPageMonitors.monitorId, id)), db.delete(incidents).where(eq(incidents.monitorId, id)), db.delete(checks).where(eq(checks.monitorId, id)), db.delete(monitors).where(eq(monitors.id, id))]);
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
    .where(and(gt(checks.at, sinceUtc), eq(checks.maintenance, false)))
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
    .where(and(eq(checks.monitorId, monitorId), gt(checks.at, sinceUtc), eq(checks.maintenance, false)))
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

/** Everything the public status page shows, found by slug. Only monitors chosen for the page are returned. */
export async function getPublicStatusPage(slug: string, sinceUtc: string, nowUtc: string) {
  const db = getDb();
  const [page] = await db.select().from(statusPages).where(eq(statusPages.slug, slug));
  if (!page) return null;
  const components = await db
    .select({ monitorId: monitors.id, displayName: statusPageMonitors.displayName, status: monitors.status, lastCheckedAt: monitors.lastCheckedAt })
    .from(statusPageMonitors)
    .innerJoin(monitors, eq(statusPageMonitors.monitorId, monitors.id))
    .where(eq(statusPageMonitors.statusPageId, page.id))
    .orderBy(statusPageMonitors.position);
  const ids = components.map((c) => c.monitorId);
  if (ids.length === 0) return { page, components, checks: [], incidents: [], updates: [], windows: [] };
  const [pageChecks, pageIncidents, windows] = await Promise.all([
    db
      .select({ monitorId: checks.monitorId, at: checks.at, ok: checks.ok, latencyMs: checks.latencyMs })
      .from(checks)
      .where(and(inArray(checks.monitorId, ids), gt(checks.at, sinceUtc), eq(checks.maintenance, false)))
      .orderBy(checks.at),
    // Automatic incidents come from the page's monitors; manual ones only from the page they were posted on.
    db
      .select()
      .from(incidents)
      .where(and(inArray(incidents.monitorId, ids), or(eq(incidents.auto, true), eq(incidents.statusPageId, page.id))))
      .orderBy(desc(incidents.startedAt)),
    // Windows that haven't ended yet, for this page's monitors only.
    db
      .select({ monitorId: maintenanceWindows.monitorId, startsAt: maintenanceWindows.startsAt, endsAt: maintenanceWindows.endsAt, note: maintenanceWindows.note })
      .from(maintenanceWindows)
      .where(and(inArray(maintenanceWindows.monitorId, ids), gt(maintenanceWindows.endsAt, nowUtc)))
      .orderBy(maintenanceWindows.startsAt),
  ]);
  const manualIds = pageIncidents.filter((i) => !i.auto).map((i) => i.id);
  const updates = manualIds.length === 0 ? [] : await db.select().from(incidentUpdates).where(inArray(incidentUpdates.incidentId, manualIds)).orderBy(desc(incidentUpdates.at), desc(incidentUpdates.id));
  return { page, components, checks: pageChecks, incidents: pageIncidents, updates, windows };
}

export async function getIncident(id: number) {
  const db = getDb();
  const [row] = await db
    .select({ incident: incidents, monitorName: monitors.name, client: monitors.client, pageSlug: statusPages.slug, pageTitle: statusPages.title })
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .leftJoin(statusPages, eq(incidents.statusPageId, statusPages.id))
    .where(eq(incidents.id, id));
  if (!row) return null;
  const updates = await db.select().from(incidentUpdates).where(eq(incidentUpdates.incidentId, id)).orderBy(desc(incidentUpdates.at), desc(incidentUpdates.id));
  return { ...row, updates };
}

export async function listStatusPageIncidents(statusPageId: number) {
  return getDb().select().from(incidents).where(and(eq(incidents.statusPageId, statusPageId), eq(incidents.auto, false))).orderBy(desc(incidents.startedAt));
}

/** Creates a manual incident on a status page with its first update, atomically. */
export async function createManualIncident(statusPageId: number, input: IncidentInput) {
  const db = getDb();
  const resolved = input.status === "resolved";
  const [inserted] = await db.batch([
    db
      .insert(incidents)
      .values({ monitorId: input.monitorId, statusPageId, title: input.title, status: input.status, startedAt: sql`datetime('now')`, resolvedAt: resolved ? sql`datetime('now')` : null, auto: false })
      .returning({ id: incidents.id }),
    db.insert(incidentUpdates).values({ incidentId: sql`last_insert_rowid()`, status: input.status, bodyMd: input.body }),
  ]);
  return inserted[0].id;
}

/** Posts an update and moves the incident to its status. Returns false for unknown, automatic or resolved incidents. */
export async function addIncidentUpdate(incidentId: number, input: UpdateInput) {
  const db = getDb();
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
  if (!incident || incident.auto || incident.resolvedAt) return false;
  await db.batch([
    db.insert(incidentUpdates).values({ incidentId, status: input.status, bodyMd: input.body }),
    db
      .update(incidents)
      .set({ status: input.status, resolvedAt: input.status === "resolved" ? sql`datetime('now')` : null, updatedAt: sql`datetime('now')` })
      .where(eq(incidents.id, incidentId)),
  ]);
  return true;
}

/** Windows that haven't ended yet (active first, then upcoming) plus the last few that have. */
export async function listMaintenanceWindows(nowUtc: string) {
  const rows = await getDb()
    .select({ window: maintenanceWindows, monitorName: monitors.name, client: monitors.client })
    .from(maintenanceWindows)
    .innerJoin(monitors, eq(maintenanceWindows.monitorId, monitors.id))
    .orderBy(maintenanceWindows.startsAt);
  return rows.filter((r) => r.window.endsAt > nowUtc).concat(rows.filter((r) => r.window.endsAt <= nowUtc).slice(-5).reverse());
}

export async function createMaintenanceWindow(values: { monitorId: number; startsAt: string; endsAt: string; note: string }) {
  await getDb().insert(maintenanceWindows).values(values);
}

export async function deleteMaintenanceWindow(id: number) {
  await getDb().delete(maintenanceWindows).where(eq(maintenanceWindows.id, id));
}
