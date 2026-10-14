import { EmailMessage } from "cloudflare:email";
import { drizzle } from "drizzle-orm/d1";
import { and, eq, gt, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { alertRecipients, checks, incidents, maintenanceWindows, monitors } from "../../../src/server/db/schema";
import { nextCheckTime, runCheck, toSqlTime } from "../../../src/lib/check";
import { hourStart, rawCutoff, rollupCutoff } from "../../../src/lib/retention";
import { alertContent, rawEmail, type AlertKind } from "../../../src/lib/alerts";
import { monitorsInMaintenance } from "../../../src/lib/maintenance";
import { incidentTitle, nextMonitorState } from "../../../src/lib/status";

type Env = { DB: D1Database; ALERT_EMAIL: SendEmail; ALERT_FROM: string };

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
  const windows = await db.select().from(maintenanceWindows).where(gt(maintenanceWindows.endsAt, at));
  const inMaintenance = monitorsInMaintenance(windows, nowMs);
  const statements = results.flatMap(({ m, r }): BatchItem<"sqlite">[] => {
    // During a maintenance window the check is recorded but flagged: it never changes status,
    // opens an incident, or counts toward uptime.
    const maintenance = inMaintenance.has(m.id);
    const next = maintenance ? { status: m.status, consecutiveFailures: m.consecutiveFailures, incident: null } : nextMonitorState(m, r.ok);
    const out: BatchItem<"sqlite">[] = [
      db.insert(checks).values({ monitorId: m.id, at, ok: r.ok, statusCode: r.statusCode, latencyMs: r.latencyMs, error: r.error, maintenance }),
      db
        .update(monitors)
        .set({
          status: next.status,
          consecutiveFailures: next.consecutiveFailures,
          lastCheckedAt: at,
          nextCheckAt: nextCheckTime(nowMs, m.intervalSec),
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(monitors.id, m.id)),
    ];
    if (next.incident === "open") {
      out.push(db.insert(incidents).values({ monitorId: m.id, title: incidentTitle(m.name, r.error), startedAt: at }));
    } else if (next.incident === "resolve") {
      out.push(
        db
          .update(incidents)
          .set({ status: "resolved", resolvedAt: at, updatedAt: sql`datetime('now')` })
          .where(and(eq(incidents.monitorId, m.id), eq(incidents.auto, true), isNull(incidents.resolvedAt))),
      );
    }
    return out;
  });
  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return results.length;
}

// Emails each incident's down alert once, then its recovered alert once. State lives on the
// incident row, so a failed send is retried on the next run and a sent one never repeats.
export async function sendPendingAlerts(env: Env, nowMs = Date.now()) {
  const db = drizzle(env.DB);
  const recipients = await db.select({ email: alertRecipients.email }).from(alertRecipients).where(eq(alertRecipients.active, true));
  if (recipients.length === 0) return 0;

  const select = { incident: incidents, monitorName: monitors.name, url: monitors.url };
  const pendingDown = await db
    .select(select)
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .where(and(eq(incidents.auto, true), isNull(incidents.downAlertedAt), isNull(incidents.resolvedAt)));
  const pendingRecovered = await db
    .select(select)
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .where(and(eq(incidents.auto, true), isNotNull(incidents.downAlertedAt), isNotNull(incidents.resolvedAt), isNull(incidents.recoveredAlertedAt)));

  let sent = 0;
  const deliver = async (kind: AlertKind, row: (typeof pendingDown)[number]) => {
    const { subject, text } = alertContent(kind, { ...row.incident, monitorName: row.monitorName, url: row.url });
    const results = await Promise.allSettled(
      recipients.map(({ email }) => {
        const raw = rawEmail(env.ALERT_FROM, email, subject, text, `${kind}-${row.incident.id}-${nowMs}@pulse`, new Date(nowMs));
        return env.ALERT_EMAIL.send(new EmailMessage(env.ALERT_FROM, email, raw));
      }),
    );
    if (!results.some((r) => r.status === "fulfilled")) {
      console.error(`${kind} alert for incident ${row.incident.id} failed`, results.map((r) => (r.status === "rejected" ? String(r.reason) : "ok")));
      return;
    }
    const at = toSqlTime(nowMs);
    await db
      .update(incidents)
      .set(kind === "down" ? { downAlertedAt: at } : { recoveredAlertedAt: at })
      .where(eq(incidents.id, row.incident.id));
    sent += 1;
  };
  for (const row of pendingDown) await deliver("down", row);
  for (const row of pendingRecovered) await deliver("recovered", row);
  return sent;
}

// Summarizes every completed hour of raw checks into one rollup row per monitor (idempotent upsert),
// then prunes raw checks past 7 days and rollups past 400. Rolling up first means pruned hours survive.
export async function rollupAndPrune(env: Env, nowMs = Date.now()) {
  await env.DB.batch([
    env.DB.prepare(
      `insert into rollups (monitor_id, hour, checks, failures, avg_latency_ms, max_latency_ms)
       select monitor_id, strftime('%Y-%m-%d %H:00:00', at) as hour, count(*), sum(case when ok = 0 then 1 else 0 end),
         cast(round(avg(latency_ms)) as integer), max(latency_ms)
       from checks where at < ?1 and maintenance = 0 group by monitor_id, hour
       on conflict (monitor_id, hour) do update set checks = excluded.checks, failures = excluded.failures,
         avg_latency_ms = excluded.avg_latency_ms, max_latency_ms = excluded.max_latency_ms, updated_at = datetime('now')`,
    ).bind(hourStart(nowMs)),
    env.DB.prepare("delete from checks where at < ?1").bind(rawCutoff(nowMs)),
    env.DB.prepare("delete from rollups where hour < ?1").bind(rollupCutoff(nowMs)),
  ]);
}

export default {
  async scheduled(_controller: ScheduledController, env: Env) {
    await runDueChecks(env);
    await sendPendingAlerts(env);
    await rollupAndPrune(env);
  },
} satisfies ExportedHandler<Env>;
