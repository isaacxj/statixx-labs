/** Whole minutes as "H:MM", for example 90 -> "1:30". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** Integer cents as a currency string. */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export const BILLING_LABELS = {
  hourly: "Hourly",
  fixed: "Fixed fee",
  retainer: "Retainer",
  non_billable: "Non-billable",
} as const;
