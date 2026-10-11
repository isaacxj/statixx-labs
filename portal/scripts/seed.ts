import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc", persist: { path: ".wrangler/state/v3" } });
const db = env.DB;

await db.batch([
  db.prepare("DELETE FROM projects"),
  db.prepare("DELETE FROM client_users"),
  db.prepare("DELETE FROM clients"),
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('projects','client_users','clients')"),
  db.prepare("INSERT INTO clients (name, slug, accent) VALUES ('Northwind Dental', 'northwind-dental', '#0EA5E9'), ('Park & Sons Roofing', 'park-sons-roofing', '#F97316')"),
  db.prepare(
    "INSERT INTO client_users (client_id, email, name, role, active) VALUES (1, 'maria@northwinddental.example', 'Maria Chen', 'approver', 1), (1, 'front-desk@northwinddental.example', 'Front Desk', 'viewer', 1), (2, 'dale@parkandsons.example', 'Dale Park', 'approver', 1)",
  ),
  db.prepare(
    "INSERT INTO projects (client_id, name, status, summary, starts_on, due_on) VALUES (1, 'Website refresh', 'on_track', 'New homepage, service pages, and online booking.', '2026-09-15', '2026-11-14'), (1, 'Monthly care plan', 'on_track', 'Updates, backups, and small fixes.', '2026-09-01', NULL), (2, 'Lead-gen landing pages', 'at_risk', 'Three landing pages waiting on final photos.', '2026-10-01', '2026-10-31')",
  ),
]);

console.log("Seeded 2 clients, 3 client users, 3 projects");
await dispose();
