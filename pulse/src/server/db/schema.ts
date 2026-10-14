import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const MONITOR_STATUSES = ["pending", "up", "down", "paused"] as const;
export type MonitorStatus = (typeof MONITOR_STATUSES)[number];
export const INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export const HTTP_METHODS = ["GET", "HEAD", "POST"] as const;

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

export const monitors = sqliteTable("monitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  client: text("client").notNull().default(""),
  url: text("url").notNull(),
  method: text("method", { enum: HTTP_METHODS }).notNull().default("GET"),
  intervalSec: integer("interval_sec").notNull().default(300),
  timeoutMs: integer("timeout_ms").notNull().default(10000),
  expectedStatus: integer("expected_status").notNull().default(200),
  keyword: text("keyword").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  status: text("status", { enum: MONITOR_STATUSES }).notNull().default("pending"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastCheckedAt: text("last_checked_at"),
  nextCheckAt: text("next_check_at"),
  ...timestamps,
});

export const checks = sqliteTable("checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  monitorId: integer("monitor_id").notNull().references(() => monitors.id),
  at: text("at").notNull(),
  ok: integer("ok", { mode: "boolean" }).notNull(),
  statusCode: integer("status_code"),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  ...timestamps,
});

export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  monitorId: integer("monitor_id").notNull().references(() => monitors.id),
  statusPageId: integer("status_page_id"),
  title: text("title").notNull(),
  status: text("status", { enum: INCIDENT_STATUSES }).notNull().default("investigating"),
  startedAt: text("started_at").notNull(),
  resolvedAt: text("resolved_at"),
  auto: integer("auto", { mode: "boolean" }).notNull().default(true),
  downAlertedAt: text("down_alerted_at"),
  recoveredAlertedAt: text("recovered_alerted_at"),
  ...timestamps,
});

export const incidentUpdates = sqliteTable("incident_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incident_id").notNull().references(() => incidents.id),
  status: text("status", { enum: INCIDENT_STATUSES }).notNull(),
  bodyMd: text("body_md").notNull(),
  at: text("at").notNull().default(sql`(datetime('now'))`),
  ...timestamps,
});

export const alertRecipients = sqliteTable("alert_recipients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const rollups = sqliteTable(
  "rollups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    monitorId: integer("monitor_id").notNull().references(() => monitors.id),
    hour: text("hour").notNull(),
    checks: integer("checks").notNull(),
    failures: integer("failures").notNull(),
    avgLatencyMs: integer("avg_latency_ms"),
    maxLatencyMs: integer("max_latency_ms"),
    ...timestamps,
  },
  (t) => [uniqueIndex("rollups_monitor_hour").on(t.monitorId, t.hour)],
);

export const statusPages = sqliteTable("status_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  accent: text("accent").notNull().default("#f43f5e"),
  logoKey: text("logo_key"),
  introMd: text("intro_md").notNull().default(""),
  ...timestamps,
});

export const statusPageMonitors = sqliteTable(
  "status_page_monitors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    statusPageId: integer("status_page_id").notNull().references(() => statusPages.id),
    monitorId: integer("monitor_id").notNull().references(() => monitors.id),
    displayName: text("display_name").notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("status_page_monitors_page_monitor").on(t.statusPageId, t.monitorId)],
);
