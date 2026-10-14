const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar date (YYYY-MM-DD) in America/Chicago for an instant. */
export const chicagoDate = (at: Date) => dayFmt.format(at);

export const FOLLOW_UP_DAYS = 3;

export const toDate = (utc: string) => new Date(utc.includes("T") ? utc : `${utc.replace(" ", "T")}Z`);

/** A proposal is valid through the end of its valid-until day (Chicago); only the dates are compared. */
export const isPastValidUntil = (validUntil: string | null, now: Date) => !!validUntil && /^\d{4}-\d{2}-\d{2}$/.test(validUntil) && chicagoDate(now) > validUntil;

/** Only proposals still out with the client can lapse. */
export const canExpire = (status: string) => status === "sent" || status === "viewed";

/** Viewed by the client but unanswered for at least `days` days. */
export function needsFollowUp(status: string, firstViewedAt: string | null, now: Date, days = FOLLOW_UP_DAYS) {
  if (status !== "viewed" || !firstViewedAt) return false;
  return now.getTime() - toDate(firstViewedAt).getTime() >= days * 86_400_000;
}

/** Whole days since a UTC timestamp. */
export const daysSince = (utc: string, now: Date) => Math.max(0, Math.floor((now.getTime() - toDate(utc).getTime()) / 86_400_000));

/** Empty clears the date; otherwise it must be a real YYYY-MM-DD date. */
export function cleanValidUntil(input: unknown): string | null | undefined {
  const s = String(input ?? "").trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? undefined : s;
}
