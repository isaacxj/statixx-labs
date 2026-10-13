import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ persist: { path: ".wrangler/state/v3" } });
const db = env.DB;

await db.batch([
  db.prepare("DELETE FROM status_page_monitors"),
  db.prepare("DELETE FROM status_pages"),
  db.prepare("DELETE FROM rollups"),
  db.prepare("DELETE FROM incidents"),
  db.prepare("DELETE FROM checks"),
  db.prepare("DELETE FROM monitors"),
  db.prepare(
    "INSERT INTO monitors (id, name, client, url, method, interval_sec, timeout_ms, expected_status, keyword, status, consecutive_failures, last_checked_at, next_check_at) VALUES " +
      "(1, 'Marketing site', 'Northwind Dental', 'https://northwinddental.example', 'GET', 300, 10000, 200, 'Book now', 'up', 0, '2026-10-12 18:00:00', '2026-10-12 18:05:00')," +
      "(2, 'Booking API', 'Northwind Dental', 'https://api.northwinddental.example/health', 'GET', 60, 5000, 200, '', 'down', 2, '2026-10-12 18:00:00', '2026-10-12 18:01:00')," +
      "(3, 'Company site', 'Park & Sons Roofing', 'https://parkandsons.example', 'GET', 300, 10000, 200, '', 'pending', 0, NULL, NULL)",
  ),
  // 30 days of checks every 15 minutes, relative to now, so uptime windows are never empty.
  // Monitor 1: an occasional failed check. Monitor 2: healthy until the last two checks.
  db.prepare(
    "WITH RECURSIVE n(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM n WHERE i < 2880) " +
      "INSERT INTO checks (monitor_id, at, ok, status_code, latency_ms, error) " +
      "SELECT 1, datetime('now', '-' || (i * 15) || ' minutes'), CASE WHEN i % 97 = 5 THEN 0 ELSE 1 END, CASE WHEN i % 97 = 5 THEN 502 ELSE 200 END, " +
      "CASE WHEN i % 97 = 5 THEN NULL ELSE 150 + (i * 37) % 90 END, CASE WHEN i % 97 = 5 THEN 'Unexpected status 502' ELSE NULL END FROM n",
  ),
  db.prepare(
    "WITH RECURSIVE n(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM n WHERE i < 2880) " +
      "INSERT INTO checks (monitor_id, at, ok, status_code, latency_ms, error) " +
      "SELECT 2, datetime('now', '-' || (i * 15) || ' minutes'), CASE WHEN i < 2 THEN 0 ELSE 1 END, CASE WHEN i < 2 THEN NULL ELSE 200 END, " +
      "CASE WHEN i < 2 THEN NULL ELSE 90 + (i * 53) % 60 END, CASE WHEN i < 2 THEN 'Timed out after 5000 ms' ELSE NULL END FROM n",
  ),
  db.prepare("INSERT INTO status_pages (id, slug, title, accent, intro_md) VALUES (1, 'northwind-dental', 'Northwind Dental status', '#0ea5e9', 'Live status for the Northwind Dental website and booking system.')"),
  db.prepare("INSERT INTO status_page_monitors (status_page_id, monitor_id, display_name, position) VALUES (1, 1, 'Website', 0), (1, 2, 'Online booking', 1)"),
  db.prepare("UPDATE monitors SET last_checked_at = datetime('now') WHERE id IN (1, 2)"),
  db.prepare(
    "INSERT INTO incidents (monitor_id, title, status, started_at, resolved_at, auto) VALUES " +
      "(2, 'Booking API is down: Timed out after 5000 ms', 'investigating', '2026-10-12 18:00:00', NULL, 1)," +
      "(1, 'Marketing site is down: Unexpected status 502', 'resolved', '2026-10-10 14:03:00', '2026-10-10 14:21:00', 1)",
  ),
]);

const { results } = await db.prepare("SELECT COUNT(*) AS n FROM monitors").all<{ n: number }>();
console.log(`Seeded ${results[0].n} monitors with 30 days of checks`);
await dispose();
