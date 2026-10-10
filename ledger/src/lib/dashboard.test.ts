import { describe, expect, it } from "vitest";
import { agingBucket, amountsLabel, monthlyRetainerRevenue, summarizeOpen } from "./dashboard";

const TODAY = "2026-10-10";

describe("agingBucket", () => {
  it("puts not-yet-due invoices in current, including due today", () => {
    expect(agingBucket("2026-10-10", TODAY)).toBe("current");
    expect(agingBucket("2026-10-20", TODAY)).toBe("current");
  });
  it("buckets by days past due", () => {
    expect(agingBucket("2026-10-09", TODAY)).toBe("d1_30");
    expect(agingBucket("2026-09-10", TODAY)).toBe("d1_30");
    expect(agingBucket("2026-09-09", TODAY)).toBe("d31_60");
    expect(agingBucket("2026-08-11", TODAY)).toBe("d31_60");
    expect(agingBucket("2026-08-10", TODAY)).toBe("d60_plus");
  });
});

describe("summarizeOpen", () => {
  it("totals outstanding, overdue and buckets per currency", () => {
    const s = summarizeOpen(
      [
        { currency: "USD", dueDate: "2026-09-30", balanceCents: 120000 },
        { currency: "USD", dueDate: "2026-10-13", balanceCents: 45000 },
        { currency: "CAD", dueDate: "2026-10-08", balanceCents: 63000 },
      ],
      TODAY,
    );
    expect(s.outstanding).toEqual({ USD: 165000, CAD: 63000 });
    expect(s.overdue).toEqual({ USD: 120000, CAD: 63000 });
    expect(s.aging.USD).toEqual({ current: 45000, d1_30: 120000, d31_60: 0, d60_plus: 0 });
  });
});

describe("monthlyRetainerRevenue", () => {
  const items = JSON.stringify([{ description: "Hosting", qtyMilli: 1000, unitPriceCents: 30000, taxRateBp: 0 }]);
  it("spreads quarterly retainers over three months", () => {
    expect(
      monthlyRetainerRevenue([
        { cadence: "monthly", currency: "USD", itemsJson: items },
        { cadence: "quarterly", currency: "USD", itemsJson: items },
      ]),
    ).toEqual({ USD: 40000 });
  });
});

describe("amountsLabel", () => {
  it("joins currencies and falls back to zero", () => {
    expect(amountsLabel({ USD: 120000, CAD: 30000 })).toBe("$1,200.00 + CA$300.00");
    expect(amountsLabel({})).toBe("$0.00");
  });
});
