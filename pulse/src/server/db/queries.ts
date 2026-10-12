import { desc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { checks, monitors } from "./schema";

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
