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

export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  dueOn: text("due_on"),
  doneOn: text("done_on"),
  position: integer("position").notNull().default(0),
  ...timestamps,
});

export type Milestone = typeof milestones.$inferSelect;

export const updates = sqliteTable("updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  authorEmail: text("author_email").notNull(),
  bodyMd: text("body_md").notNull(),
  ...timestamps,
});

export type Update = typeof updates.$inferSelect;

export const files = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  updateId: integer("update_id").references(() => updates.id),
  requestId: integer("request_id"),
  r2Key: text("r2_key").notNull().unique(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  uploadedBy: text("uploaded_by").notNull(),
  ...timestamps,
});

export type ProjectFile = typeof files.$inferSelect;
