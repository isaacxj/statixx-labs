export function formatMoney(cents: number, currency: "USD" | "CAD" = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
