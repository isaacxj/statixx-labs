import { minutesBetween } from "@/lib/timer";

export const DEFAULT_IDLE_LIMIT = 480;

/** Whether a running timer has gone past the business's idle limit. A limit of 0 turns the guard off. */
export function idleStatus(startedAt: string, now: number, limitMinutes: number) {
  const elapsedMinutes = minutesBetween(startedAt, new Date(now).toISOString());
  return { over: limitMinutes > 0 && elapsedMinutes > limitMinutes, elapsedMinutes, limitMinutes };
}

/** The minutes to keep when trimming, from a form value; null if it isn't a whole number from 0 up to the elapsed time. */
export function parseKeepMinutes(value: FormDataEntryValue | string | null, elapsedMinutes: number): number | null {
  if (value === null || String(value).trim() === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > elapsedMinutes) return null;
  return n;
}

/** The idle limit in minutes from a Settings form value (hours, 0 to 24), or null if invalid. */
export function parseIdleLimitHours(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") return null;
  const h = Number(value);
  if (!Number.isFinite(h) || h < 0 || h > 24) return null;
  return Math.round(h * 60);
}
