import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
