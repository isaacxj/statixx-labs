import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc", persist: { path: ".wrangler/state/v3" } });
const db = env.DB;

await db.batch([
  db.prepare("DELETE FROM time_entries"),
  db.prepare("DELETE FROM projects"),
  db.prepare("DELETE FROM clients"),
  db.prepare("DELETE FROM businesses"),
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('projects','clients','businesses')"),
  db.prepare("INSERT INTO businesses (name, currency, default_rate_cents, rounding_minutes) VALUES ('Statixx', 'USD', 9000, 15), ('Aptixx', 'CAD', 11000, 6), ('Trazo', 'USD', 8000, 0)"),
  db.prepare("INSERT INTO clients (business_id, name) VALUES (1, 'Northwind Dental'), (2, 'Park & Sons Roofing'), (3, 'Casa Verde')"),
  db.prepare("INSERT INTO projects (client_id, name, billing, rate_cents, budget_minutes, fixed_fee_cents, color) VALUES (1, 'Website refresh', 'fixed', 0, 4800, 600000, '#F59E0B'), (1, 'Monthly care plan', 'retainer', 0, 600, 90000, '#10B981'), (2, 'Lead-gen landing pages', 'hourly', 11000, 2400, NULL, '#3B82F6'), (3, 'Brand identity', 'hourly', 8000, NULL, NULL, '#EC4899'), (3, 'Internal admin', 'non_billable', 0, NULL, NULL, '#71717A')"),
  db.prepare("INSERT INTO time_entries (project_id, owner_email, description, started_at, ended_at, minutes, billable) VALUES (1, 'dev@localhost', 'Homepage layout', '2026-10-09T14:00:00.000Z', '2026-10-09T16:30:00.000Z', 150, 1), (3, 'dev@localhost', 'Landing page copy', '2026-10-09T18:00:00.000Z', '2026-10-09T19:15:00.000Z', 75, 1), (5, 'dev@localhost', '', '2026-10-08T15:00:00.000Z', '2026-10-08T16:00:00.000Z', 60, 0), (3, 'dev@localhost', 'Landing page build', '2026-10-02T14:00:00.000Z', '2026-10-02T22:00:00.000Z', 480, 1), (3, 'dev@localhost', 'Landing page build', '2026-10-05T14:00:00.000Z', '2026-10-05T22:00:00.000Z', 480, 1), (3, 'dev@localhost', 'Revisions', '2026-10-07T14:00:00.000Z', '2026-10-07T22:00:00.000Z', 480, 1), (3, 'dev@localhost', 'QA and launch', '2026-10-08T14:00:00.000Z', '2026-10-08T21:00:00.000Z', 420, 1), (2, 'dev@localhost', 'Updates and backups', '2026-10-06T14:00:00.000Z', '2026-10-06T17:00:00.000Z', 180, 1)"),
]);

console.log("Seeded 3 businesses, 3 clients, 5 projects, and time entries");
await dispose();
