import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const MONITOR_STATUSES = ["pending", "up", "down", "paused"] as const;
export type MonitorStatus = (typeof MONITOR_STATUSES)[number];
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
