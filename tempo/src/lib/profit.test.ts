import { describe, expect, it } from "vitest";
import { profitability } from "./profit";

const e = (startedAt: string, minutes: number, billable = true) => ({ startedAt, minutes, billable });

describe("profitability", () => {
  it("hourly: billable hours times rate, divided by all hours", () => {
    const p = profitability({ billing: "hourly", rateCents: 11000, fixedFeeCents: null }, [
      e("2026-10-02T14:00:00.000Z", 480),
      e("2026-10-05T14:00:00.000Z", 120, false),
    ]);
    expect(p.revenueCents).toBe(88000);
    expect(p.effectiveRateCents).toBe(8800); // 880 / 10h
  });
  it("fixed: fee over hours worked", () => {
    const p = profitability({ billing: "fixed", rateCents: 0, fixedFeeCents: 600000 }, [e("2026-10-09T14:00:00.000Z", 3000)]);
    expect(p.effectiveRateCents).toBe(12000); // 6000 / 50h
  });
  it("retainer: monthly fee per month with time logged", () => {
    const p = profitability({ billing: "retainer", rateCents: 0, fixedFeeCents: 90000 }, [
      e("2026-09-10T14:00:00.000Z", 300),
      e("2026-10-06T14:00:00.000Z", 300),
    ]);
    expect(p.months).toBe(2);
    expect(p.revenueCents).toBe(180000);
    expect(p.effectiveRateCents).toBe(18000); // 1800 / 10h
  });
  it("has no rate without time or revenue", () => {
    expect(profitability({ billing: "hourly", rateCents: 9000, fixedFeeCents: null }, []).effectiveRateCents).toBeNull();
    expect(profitability({ billing: "non_billable", rateCents: 0, fixedFeeCents: null }, [e("2026-10-08T15:00:00.000Z", 60, false)]).effectiveRateCents).toBeNull();
  });
});
