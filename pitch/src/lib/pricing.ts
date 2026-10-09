export type PricedItem = {
  qtyMilli: number;
  unitPriceCents: number;
  recurring: "none" | "monthly";
  optional: boolean;
  selected: boolean;
};

export type Totals = { subtotal: number; discount: number; tax: number; total: number };

/** Line amount in cents: quantity is in thousandths, rounded half up to the cent. */
export function lineTotal(item: Pick<PricedItem, "qtyMilli" | "unitPriceCents">): number {
  return Math.round((item.qtyMilli * item.unitPriceCents) / 1000);
}

/** Optional items only count once they are selected. */
export function counts(item: Pick<PricedItem, "optional" | "selected">): boolean {
  return !item.optional || item.selected;
}

function totalsFor(subtotal: number, discountBp: number, taxRateBp: number): Totals {
  const discount = Math.round((subtotal * discountBp) / 10000);
  const tax = Math.round(((subtotal - discount) * taxRateBp) / 10000);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

/** One-time and monthly totals; the discount and tax apply to each side separately. */
export function proposalTotals(items: PricedItem[], discountBp: number, taxRateBp: number) {
  let once = 0;
  let monthly = 0;
  for (const it of items) {
    if (!counts(it)) continue;
    if (it.recurring === "monthly") monthly += lineTotal(it);
    else once += lineTotal(it);
  }
  return { oneTime: totalsFor(once, discountBp, taxRateBp), monthly: totalsFor(monthly, discountBp, taxRateBp) };
}

/** "1,250.50" or "$1250.5" to cents; null when it isn't a non-negative amount. */
export function parseCents(input: string): number | null {
  const s = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** "2.5" to thousandths; null when it isn't a non-negative quantity with up to 3 decimals. */
export function parseQtyMilli(input: string): number | null {
  const s = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{0,3})?$/.test(s)) return null;
  return Math.round(Number(s) * 1000);
}

/** "10" or "8.25" percent to basis points, capped at 100%. */
export function parseRateBp(input: string): number | null {
  const s = input.replace(/[%\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const bp = Math.round(Number(s) * 100);
  return bp <= 10000 ? bp : null;
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2);
export const milliToInput = (milli: number) => String(milli / 1000);
export const bpToInput = (bp: number) => String(bp / 100);
