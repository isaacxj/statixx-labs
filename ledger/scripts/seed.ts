import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc" });
const db = env.DB;

await db.batch([
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
]);

console.log("Seeded 2 businesses and 3 clients");
await dispose();
