import { toSqlTime } from "@/lib/check";

export const RAW_RETENTION_DAYS = 7;
export const ROLLUP_RETENTION_DAYS = 400;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Start of the hour containing `ms`, in SQLite datetime format. Only hours before it are complete. */
export function hourStart(ms: number): string {
  return toSqlTime(Math.floor(ms / HOUR_MS) * HOUR_MS);
}

export function rawCutoff(ms: number): string {
  return toSqlTime(ms - RAW_RETENTION_DAYS * DAY_MS);
}

export function rollupCutoff(ms: number): string {
  return toSqlTime(ms - ROLLUP_RETENTION_DAYS * DAY_MS);
}
