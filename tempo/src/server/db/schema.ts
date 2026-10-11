import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

export const WEEK_STARTS = ["monday", "sunday"] as const;
export const BILLING_TYPES = ["hourly", "fixed", "retainer", "non_billable"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];
export const PROJECT_STATUSES = ["active", "archived"] as const;

export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("USD"),
  defaultRateCents: integer("default_rate_cents").notNull().default(0),
  roundingMinutes: integer("rounding_minutes").notNull().default(0),
  weekStart: text("week_start", { enum: WEEK_STARTS }).notNull().default("monday"),
  idleLimitMinutes: integer("idle_limit_minutes").notNull().default(480),
  ...timestamps,
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  ...timestamps,
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  billing: text("billing", { enum: BILLING_TYPES }).notNull().default("hourly"),
  rateCents: integer("rate_cents").notNull().default(0),
  budgetMinutes: integer("budget_minutes"),
  fixedFeeCents: integer("fixed_fee_cents"),
  status: text("status", { enum: PROJECT_STATUSES }).notNull().default("active"),
  color: text("color").notNull().default("#F59E0B"),
  ...timestamps,
});

export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  ownerEmail: text("owner_email").notNull(),
  description: text("description").notNull().default(""),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  minutes: integer("minutes").notNull().default(0),
  billable: integer("billable", { mode: "boolean" }).notNull().default(true),
  billedAt: text("billed_at"),
  billedRef: text("billed_ref"),
  ...timestamps,
}, (t) => [uniqueIndex("one_running_timer_per_owner").on(t.ownerEmail).where(sql`ended_at is null`)]);
