import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc", persist: { path: ".wrangler/state/v3" } });
const db = env.DB;

await db.batch([
  db.prepare("DELETE FROM projects"),
  db.prepare("DELETE FROM clients"),
  db.prepare("DELETE FROM businesses"),
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('projects','clients','businesses')"),
  db.prepare("INSERT INTO businesses (name, currency, default_rate_cents, rounding_minutes) VALUES ('Statixx', 'USD', 9000, 15), ('Aptixx', 'CAD', 11000, 6), ('Trazo', 'USD', 8000, 0)"),
  db.prepare("INSERT INTO clients (business_id, name) VALUES (1, 'Northwind Dental'), (2, 'Park & Sons Roofing'), (3, 'Casa Verde')"),
  db.prepare("INSERT INTO projects (client_id, name, billing, rate_cents, budget_minutes, fixed_fee_cents, color) VALUES (1, 'Website refresh', 'fixed', 0, 4800, 600000, '#F59E0B'), (1, 'Monthly care plan', 'retainer', 0, 600, NULL, '#10B981'), (2, 'Lead-gen landing pages', 'hourly', 11000, 2400, NULL, '#3B82F6'), (3, 'Brand identity', 'hourly', 8000, NULL, NULL, '#EC4899'), (3, 'Internal admin', 'non_billable', 0, NULL, NULL, '#71717A')"),
]);

console.log("Seeded 3 businesses, 3 clients, and 5 projects");
await dispose();
