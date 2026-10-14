import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
};

export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  address: text("address"),
  logoKey: text("logo_key"),
  accent: text("accent").notNull().default("#8B5CF6"),
  currency: text("currency", { enum: ["USD", "CAD"] }).notNull().default("USD"),
  taxRateBp: integer("tax_rate_bp").notNull().default(0),
  defaultTermsMd: text("default_terms_md").notNull().default(""),
  numberPrefix: text("number_prefix").notNull(),
  nextNumber: integer("next_number").notNull().default(1),
  ...timestamps,
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  ...timestamps,
});

export const PROPOSAL_STATUSES = ["draft", "sent", "viewed", "accepted", "declined", "expired"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const proposals = sqliteTable(
  "proposals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    businessId: integer("business_id").notNull().references(() => businesses.id),
    clientId: integer("client_id").notNull().references(() => clients.id),
    number: text("number").notNull(),
    title: text("title").notNull(),
    status: text("status", { enum: PROPOSAL_STATUSES }).notNull().default("draft"),
    validUntil: text("valid_until"),
    discountBp: integer("discount_bp").notNull().default(0),
    taxRateBp: integer("tax_rate_bp").notNull().default(0),
    currency: text("currency", { enum: ["USD", "CAD"] }).notNull().default("USD"),
    shareToken: text("share_token"),
    sentAt: text("sent_at"),
    firstViewedAt: text("first_viewed_at"),
    viewCount: integer("view_count").notNull().default(0),
    acceptedAt: text("accepted_at"),
    acceptedByName: text("accepted_by_name"),
    acceptedIp: text("accepted_ip"),
    declinedAt: text("declined_at"),
    declineReason: text("decline_reason"),
    ...timestamps,
  },
  (t) => [uniqueIndex("proposals_number_unique").on(t.number), uniqueIndex("proposals_share_token_unique").on(t.shareToken)],
);

export const SECTION_KINDS = ["text", "pricing"] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: text("kind", { enum: SECTION_KINDS }).notNull().default("text"),
  title: text("title").notNull().default(""),
  bodyMd: text("body_md").notNull().default(""),
  ...timestamps,
});

export const RECURRING = ["none", "monthly"] as const;
export type Recurring = (typeof RECURRING)[number];

export const lineItems = sqliteTable("line_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description").notNull().default(""),
  qtyMilli: integer("qty_milli").notNull().default(1000),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  recurring: text("recurring", { enum: RECURRING }).notNull().default("none"),
  optional: integer("optional", { mode: "boolean" }).notNull().default(false),
  selected: integer("selected", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const librarySections = sqliteTable("library_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull().default("General"),
  title: text("title").notNull(),
  bodyMd: text("body_md").notNull().default(""),
  ...timestamps,
});

export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  snapshotJson: text("snapshot_json").notNull(),
  ...timestamps,
});

export const EVENT_TYPES = ["created", "edited", "sent", "viewed", "accepted", "declined", "expired"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  type: text("type", { enum: EVENT_TYPES }).notNull(),
  at: text("at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  metaJson: text("meta_json"),
  ...timestamps,
});

export type Business = typeof businesses.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type LineItem = typeof lineItems.$inferSelect;
export type LibrarySection = typeof librarySections.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type ProposalEvent = typeof events.$inferSelect;
