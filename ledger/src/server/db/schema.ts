import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

export const CURRENCIES = ["USD", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  legalName: text("legal_name").notNull().default(""),
  address: text("address").notNull().default(""),
  logoKey: text("logo_key"),
  accent: text("accent").notNull().default("#10B981"),
  currency: text("currency", { enum: CURRENCIES }).notNull().default("USD"),
  taxRateBp: integer("tax_rate_bp").notNull().default(0),
  termsDays: integer("terms_days").notNull().default(30),
  paymentInstructionsMd: text("payment_instructions_md").notNull().default(""),
  numberPrefix: text("number_prefix").notNull(),
  nextNumber: integer("next_number").notNull().default(1),
  ...timestamps,
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  address: text("address"),
  ...timestamps,
});

export const INVOICE_STATUSES = ["draft", "sent", "viewed", "partially_paid", "paid", "overdue", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoices = sqliteTable(
  "invoices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    businessId: integer("business_id").notNull().references(() => businesses.id),
    clientId: integer("client_id").notNull().references(() => clients.id),
    retainerId: integer("retainer_id"),
    number: text("number").notNull(),
    status: text("status", { enum: INVOICE_STATUSES }).notNull().default("draft"),
    issueDate: text("issue_date").notNull(),
    dueDate: text("due_date").notNull(),
    currency: text("currency", { enum: CURRENCIES }).notNull(),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    paidCents: integer("paid_cents").notNull().default(0),
    shareToken: text("share_token").notNull().unique(),
    sentAt: text("sent_at"),
    viewedAt: text("viewed_at"),
    notesMd: text("notes_md").notNull().default(""),
    voidedAt: text("voided_at"),
    ...timestamps,
  },
  (t) => [uniqueIndex("invoices_business_number").on(t.businessId, t.number)],
);

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  description: text("description").notNull(),
  qtyMilli: integer("qty_milli").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  taxRateBp: integer("tax_rate_bp").notNull().default(0),
  ...timestamps,
});
