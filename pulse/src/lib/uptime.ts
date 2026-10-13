export type CheckPoint = { monitorId: number; at: string; ok: boolean; latencyMs: number | null };

export function parseUtc(utc: string): number {
  return new Date(utc.includes("T") ? utc : `${utc.replace(" ", "T")}Z`).getTime();
}

/** Uptime percentage over checks inside the window, or null when there were no checks. */
export function uptimePercent(points: CheckPoint[], now: number, windowMs: number): number | null {
  const inWindow = points.filter((p) => {
    const t = parseUtc(p.at);
    return t > now - windowMs && t <= now;
  });
  if (inWindow.length === 0) return null;
  const ok = inWindow.filter((p) => p.ok).length;
  return (ok / inWindow.length) * 100;
}

export function formatUptime(pct: number | null): string {
  if (pct === null) return "–";
  if (pct >= 100) return "100%";
  // Never round a non-perfect figure up to 100.
  return `${(Math.floor(pct * 100) / 100).toFixed(2)}%`;
}

/** Latencies of successful checks in the window, oldest first, for the sparkline. */
export function latencySeries(points: CheckPoint[], now: number, windowMs: number, max = 48): number[] {
  const values = points
    .filter((p) => p.ok && p.latencyMs !== null && parseUtc(p.at) > now - windowMs && parseUtc(p.at) <= now)
    .sort((a, b) => parseUtc(a.at) - parseUtc(b.at))
    .map((p) => p.latencyMs as number);
  if (values.length <= max) return values;
  const step = values.length / max;
  return Array.from({ length: max }, (_, i) => values[Math.floor(i * step)]);
}

export function sparklinePath(values: number[], width: number, height: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * width).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(" ");
}

export function nowMs(): number {
  return Date.now();
}

export type Bucket = { start: number; avgLatencyMs: number | null; checks: number; failures: number };

/** Splits the window into equal buckets with average latency of successful checks and a failure count. */
export function latencyBuckets(points: CheckPoint[], now: number, windowMs: number, count: number): Bucket[] {
  const size = windowMs / count;
  const from = now - windowMs;
  const sums = Array.from({ length: count }, () => ({ sum: 0, n: 0, checks: 0, failures: 0 }));
  for (const p of points) {
    const t = parseUtc(p.at);
    if (t <= from || t > now) continue;
    const b = sums[Math.min(count - 1, Math.floor((t - from) / size))];
    b.checks++;
    if (!p.ok) b.failures++;
    else if (p.latencyMs !== null) {
      b.sum += p.latencyMs;
      b.n++;
    }
  }
  return sums.map((b, i) => ({ start: from + i * size, avgLatencyMs: b.n ? Math.round(b.sum / b.n) : null, checks: b.checks, failures: b.failures }));
}

export type DayUptime = { day: string; pct: number | null; checks: number };

/** Uptime per UTC day for the last `days` days, oldest first; the last entry is today. */
export function dailyUptime(points: CheckPoint[], now: number, days: number): DayUptime[] {
  const dayMs = 24 * 3600_000;
  const today = Math.floor(now / dayMs);
  const stats = new Map<number, { ok: number; n: number }>();
  for (const p of points) {
    const t = parseUtc(p.at);
    if (t > now) continue;
    const d = Math.floor(t / dayMs);
    if (d <= today - days) continue;
    const s = stats.get(d) ?? { ok: 0, n: 0 };
    s.n++;
    if (p.ok) s.ok++;
    stats.set(d, s);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = today - days + 1 + i;
    const s = stats.get(d);
    return { day: new Date(d * dayMs).toISOString().slice(0, 10), pct: s ? (s.ok / s.n) * 100 : null, checks: s?.n ?? 0 };
  });
}
