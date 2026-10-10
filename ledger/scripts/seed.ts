import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc" });
const db = env.DB;

await db.batch([
  db.prepare("DELETE FROM events"),
  db.prepare("DELETE FROM retainers"),
  db.prepare("DELETE FROM payments"),
  db.prepare("DELETE FROM invoice_items"),
  db.prepare("DELETE FROM invoices"),
  db.prepare("DELETE FROM clients"),
  db.prepare("DELETE FROM businesses"),
  db
    .prepare("INSERT INTO businesses (name, legal_name, address, currency, tax_rate_bp, terms_days, payment_instructions_md, number_prefix) VALUES (?,?,?,?,?,?,?,?)")
    .bind("Statixx", "Statixx Labs LLC", "Austin, TX", "USD", 0, 30, "Pay by ACH or check.", "STX"),
  db
    .prepare("INSERT INTO businesses (name, legal_name, address, currency, tax_rate_bp, terms_days, payment_instructions_md, number_prefix) VALUES (?,?,?,?,?,?,?,?)")
    .bind("Aptixx", "Aptixx Inc.", "Toronto, ON", "CAD", 1300, 15, "Pay by e-transfer.", "APT"),
  db.prepare("INSERT INTO clients (name, company, email, address) VALUES (?,?,?,?)").bind("Maria Alvarez", "Northwind Dental", "maria@northwind.example", "Austin, TX"),
  db.prepare("INSERT INTO clients (name, company, email, address) VALUES (?,?,?,?)").bind("Devon Park", "Park & Sons Roofing", "devon@parkroofing.example", "Calgary, AB"),
  db.prepare("INSERT INTO clients (name, company, email, address) VALUES (?,?,?,?)").bind("Priya Shah", "Lumen Cafe", "priya@lumen.example", null),
  db
    .prepare("INSERT INTO retainers (business_id, client_id, title, cadence, anchor_day, starts_on, ends_on, next_run_on, active, items_json) VALUES ((SELECT id FROM businesses WHERE name = 'Statixx'), (SELECT id FROM clients WHERE name = 'Maria Alvarez'), ?, ?, ?, ?, ?, ?, 1, ?)")
    .bind("Monthly hosting and care", "monthly", 31, "2026-10-01", null, "2026-10-31", JSON.stringify([{ description: "Hosting and maintenance", qtyMilli: 1000, unitPriceCents: 25000, taxRateBp: 0 }])),
]);

console.log("Seeded 2 businesses, 3 clients, and 1 retainer");
await dispose();
