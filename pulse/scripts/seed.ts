import { getPlatformProxy } from "wrangler";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({ persist: { path: ".wrangler/state/v3" } });
const db = env.DB;

await db.batch([
  db.prepare("DELETE FROM checks"),
  db.prepare("DELETE FROM monitors"),
  db.prepare(
    "INSERT INTO monitors (id, name, client, url, method, interval_sec, timeout_ms, expected_status, keyword, status, consecutive_failures, last_checked_at, next_check_at) VALUES " +
      "(1, 'Marketing site', 'Northwind Dental', 'https://northwinddental.example', 'GET', 300, 10000, 200, 'Book now', 'up', 0, '2026-10-12 18:00:00', '2026-10-12 18:05:00')," +
      "(2, 'Booking API', 'Northwind Dental', 'https://api.northwinddental.example/health', 'GET', 60, 5000, 200, '', 'down', 2, '2026-10-12 18:00:00', '2026-10-12 18:01:00')," +
      "(3, 'Company site', 'Park & Sons Roofing', 'https://parkandsons.example', 'GET', 300, 10000, 200, '', 'pending', 0, NULL, NULL)",
  ),
  db.prepare(
    "INSERT INTO checks (monitor_id, at, ok, status_code, latency_ms, error) VALUES " +
      "(1, '2026-10-12 18:00:00', 1, 200, 182, NULL)," +
      "(2, '2026-10-12 17:59:00', 0, 503, 640, 'Unexpected status 503')," +
      "(2, '2026-10-12 18:00:00', 0, NULL, NULL, 'Timed out after 5000 ms')",
  ),
]);

const { results } = await db.prepare("SELECT COUNT(*) AS n FROM monitors").all<{ n: number }>();
console.log(`Seeded ${results[0].n} monitors and 3 checks`);
await dispose();
