import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export type Business = typeof businesses.$inferSelect;
export type Client = typeof clients.$inferSelect;
