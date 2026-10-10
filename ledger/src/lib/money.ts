export type CurrencyCode = "USD" | "CAD";

/** Integer cents to a display amount such as "$1,250.50". */
export function formatMoney(cents: number, currency: CurrencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** Basis points to a percent label: 1300 becomes "13%", 875 becomes "8.75%". */
export function formatRate(bp: number): string {
  return `${bp / 100}%`;
}
