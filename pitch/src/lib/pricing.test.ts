import { describe, expect, it } from "vitest";
import { lineTotal, parseCents, parseQtyMilli, parseRateBp, proposalTotals, type PricedItem } from "./pricing";

const item = (o: Partial<PricedItem>): PricedItem => ({ qtyMilli: 1000, unitPriceCents: 0, recurring: "none", optional: false, selected: false, ...o });

describe("pricing", () => {
  it("rounds line totals to the cent", () => {
    expect(lineTotal({ qtyMilli: 2500, unitPriceCents: 12000 })).toBe(30000);
    expect(lineTotal({ qtyMilli: 333, unitPriceCents: 100 })).toBe(33);
  });

  it("matches a hand calculation with discount, tax, optional and monthly items", () => {
    // once: 10h * $150 = 1500.00 + selected optional 1 * $500 = 500.00 -> 2000.00 (unselected $300 ignored)
    // 10% discount = 200.00 -> 1800.00; 8.25% tax = 148.50 -> 1948.50
    // monthly: 1 * $99 = 99.00; 10% off = 9.90 -> 89.10; tax 7.35 (7.35075) -> 96.45
    const items = [
      item({ qtyMilli: 10000, unitPriceCents: 15000 }),
      item({ unitPriceCents: 50000, optional: true, selected: true }),
      item({ unitPriceCents: 30000, optional: true }),
      item({ unitPriceCents: 9900, recurring: "monthly" }),
    ];
    const t = proposalTotals(items, 1000, 825);
    expect(t.oneTime).toEqual({ subtotal: 200000, discount: 20000, tax: 14850, total: 194850 });
    expect(t.monthly).toEqual({ subtotal: 9900, discount: 990, tax: 735, total: 9645 });
  });

  it("is zero for no items", () => {
    expect(proposalTotals([], 500, 500).oneTime.total).toBe(0);
  });

  it("parses money, quantity and rates", () => {
    expect(parseCents("$1,250.5")).toBe(125050);
    expect(parseCents("-1")).toBeNull();
    expect(parseCents("abc")).toBeNull();
    expect(parseQtyMilli("2.5")).toBe(2500);
    expect(parseQtyMilli("1.2345")).toBeNull();
    expect(parseRateBp("8.25%")).toBe(825);
    expect(parseRateBp("101")).toBeNull();
  });
});
