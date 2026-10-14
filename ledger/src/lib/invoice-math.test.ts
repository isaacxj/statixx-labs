import { describe, expect, it } from "vitest";
import { centsToText, computeTotals, lineAmountCents, parseMoney, parseQty, qtyToText } from "./invoice-math";

describe("invoice totals", () => {
  it("matches a hand calculation across lines with different tax rates", () => {
    // 2 x $150.00 = $300.00 at 13%  -> $39.00
    // 1.5 x $80.00 = $120.00 at 0%  -> $0.00
    // 3 x $19.99 = $59.97 at 13%    -> $7.7961, rounds to $7.80
    const t = computeTotals([
      { qtyMilli: 2000, unitPriceCents: 15000, taxRateBp: 1300 },
      { qtyMilli: 1500, unitPriceCents: 8000, taxRateBp: 0 },
      { qtyMilli: 3000, unitPriceCents: 1999, taxRateBp: 1300 },
    ]);
    expect(t).toEqual({ subtotalCents: 47997, taxCents: 4680, totalCents: 52677 });
  });

  it("rounds half up on fractional cents", () => {
    expect(lineAmountCents({ qtyMilli: 333, unitPriceCents: 1500 })).toBe(500); // 499.5
    expect(computeTotals([{ qtyMilli: 1000, unitPriceCents: 1050, taxRateBp: 875 }]).taxCents).toBe(92); // 91.875
  });

  it("is zero for no lines", () => {
    expect(computeTotals([])).toEqual({ subtotalCents: 0, taxCents: 0, totalCents: 0 });
  });
});

describe("parsing", () => {
  it("parses money to cents", () => {
    expect(parseMoney("12")).toBe(1200);
    expect(parseMoney("$1,250.5")).toBe(125050);
    expect(parseMoney("0.07")).toBe(7);
    expect(parseMoney("1.234")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
    expect(parseMoney("")).toBeNull();
  });

  it("parses quantities to thousandths", () => {
    expect(parseQty("2")).toBe(2000);
    expect(parseQty("1.5")).toBe(1500);
    expect(parseQty("0.001")).toBe(1);
    expect(parseQty("0")).toBeNull();
    expect(parseQty("abc")).toBeNull();
  });

  it("round-trips editable text", () => {
    expect(qtyToText(1500)).toBe("1.5");
    expect(centsToText(125050)).toBe("1250.50");
    expect(parseMoney(centsToText(4680))).toBe(4680);
  });
});
