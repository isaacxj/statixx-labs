import { drizzle } from "drizzle-orm/d1";
import { and, eq, lte, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { checks, monitors } from "../../../src/server/db/schema";
import { nextCheckTime, runCheck, toSqlTime } from "../../../src/lib/check";

type Env = { DB: D1Database };

// Runs every due, active monitor, records one check each, and schedules the next one.
export async function runDueChecks(env: Env, nowMs = Date.now()) {
  const db = drizzle(env.DB);
  const due = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.active, true), lte(sql`coalesce(${monitors.nextCheckAt}, '')`, toSqlTime(nowMs))));

  const results = await Promise.all(due.map(async (m) => ({ m, r: await runCheck(m) })));
  if (results.length === 0) return 0;

  const at = toSqlTime(nowMs);
  const statements = results.flatMap(({ m, r }): BatchItem<"sqlite">[] => [
    db.insert(checks).values({ monitorId: m.id, at, ok: r.ok, statusCode: r.statusCode, latencyMs: r.latencyMs, error: r.error }),
    db
      .update(monitors)
      .set({ lastCheckedAt: at, nextCheckAt: nextCheckTime(nowMs, m.intervalSec), updatedAt: sql`datetime('now')` })
      .where(eq(monitors.id, m.id)),
  ]);
  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return results.length;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env) {
    await runDueChecks(env);
  },
} satisfies ExportedHandler<Env>;
