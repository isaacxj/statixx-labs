import type { BillingType } from "@/server/db/schema";

export const ROUNDING_OPTIONS = [0, 6, 15] as const;

/** Rounds a duration up to the next increment; 0 means no rounding. Zero stays zero. */
export function roundMinutes(minutes: number, increment: number): number {
  if (increment <= 0 || minutes <= 0) return Math.max(0, minutes);
  return Math.ceil(minutes / increment) * increment;
}

/** Only non-billable projects default new entries to non-billable. */
export function defaultBillable(billing: BillingType): boolean {
  return billing !== "non_billable";
}

/** Reads the rounding setting from a form value, or null when it isn't one of the options. */
export function parseRounding(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return (ROUNDING_OPTIONS as readonly number[]).includes(n) ? n : null;
}
