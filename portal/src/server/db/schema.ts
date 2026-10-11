import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

export const CLIENT_USER_ROLES = ["viewer", "approver"] as const;
export type ClientUserRole = (typeof CLIENT_USER_ROLES)[number];
export const PROJECT_STATUSES = ["on_track", "at_risk", "blocked", "done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  accent: text("accent").notNull().default("#0EA5E9"),
  logoKey: text("logo_key"),
  ...timestamps,
});

export const clientUsers = sqliteTable(
  "client_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id").notNull().references(() => clients.id),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    role: text("role", { enum: CLIENT_USER_ROLES }).notNull().default("viewer"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("client_users_email").on(t.email)],
);

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  status: text("status", { enum: PROJECT_STATUSES }).notNull().default("on_track"),
  summary: text("summary").notNull().default(""),
  startsOn: text("starts_on"),
  dueOn: text("due_on"),
  ...timestamps,
});
