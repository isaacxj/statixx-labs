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
