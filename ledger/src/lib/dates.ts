const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(text: string): boolean {
  if (!ISO.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today's date in America/Chicago as YYYY-MM-DD. */
export function todayChicago(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(now);
}

/** "2026-10-09" to "Oct 9, 2026". */
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
