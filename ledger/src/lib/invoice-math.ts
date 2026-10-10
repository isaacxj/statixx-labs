export type LineInput = { qtyMilli: number; unitPriceCents: number; taxRateBp: number };
export type Totals = { subtotalCents: number; taxCents: number; totalCents: number };

/** Rounds half up on non-negative integers: numerator / denominator. */
function divRound(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2));
}

/** Line amount in cents: quantity in thousandths times unit price. */
export function lineAmountCents(line: Pick<LineInput, "qtyMilli" | "unitPriceCents">): number {
  return divRound(line.qtyMilli * line.unitPriceCents, 1000);
}

/** Tax is rounded per line so the printed lines always add up to the totals. */
export function lineTaxCents(line: LineInput): number {
  return divRound(lineAmountCents(line) * line.taxRateBp, 10000);
}

export function computeTotals(lines: LineInput[]): Totals {
  let subtotalCents = 0;
  let taxCents = 0;
  for (const l of lines) {
    subtotalCents += lineAmountCents(l);
    taxCents += lineTaxCents(l);
  }
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

/** "12", "12.5" or "1,250.50" to cents, or null when it is not a money amount. */
export function parseMoney(text: string): number | null {
  const t = text.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** "2", "1.5" or "0.25" to thousandths, or null when it is not a quantity above zero. */
export function parseQty(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  const milli = Number(whole) * 1000 + Number(frac.padEnd(3, "0"));
  return milli > 0 ? milli : null;
}

/** Thousandths back to editable text: 1500 becomes "1.5". */
export function qtyToText(qtyMilli: number): string {
  return String(qtyMilli / 1000);
}

/** Cents back to editable text: 125050 becomes "1250.50". */
export function centsToText(cents: number): string {
  return (cents / 100).toFixed(2);
}
