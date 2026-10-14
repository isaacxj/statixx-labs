import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
