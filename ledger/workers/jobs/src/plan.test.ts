import { describe, expect, it } from "vitest";
import { dueRuns, invoiceFor, parseItems } from "./plan";

const monthly31 = { cadence: "monthly", anchorDay: 31, startsOn: "2026-01-01", endsOn: null } as const;

describe("dueRuns", () => {
  it("has nothing due before the next run", () => {
    expect(dueRuns({ ...monthly31, nextRunOn: "2026-10-31" }, "2026-10-10")).toEqual({ due: [], nextRunOn: "2026-10-31" });
  });
  it("runs today's date and advances, clamping the 31st", () => {
    expect(dueRuns({ ...monthly31, nextRunOn: "2026-01-31" }, "2026-01-31")).toEqual({ due: ["2026-01-31"], nextRunOn: "2026-02-28" });
  });
  it("catches up on missed runs", () => {
    const r = dueRuns({ ...monthly31, nextRunOn: "2026-08-31" }, "2026-10-31");
    expect(r.due).toEqual(["2026-08-31", "2026-09-30", "2026-10-31"]);
    expect(r.nextRunOn).toBe("2026-11-30");
  });
  it("ends the series at the end date", () => {
    const r = dueRuns({ ...monthly31, endsOn: "2026-02-28", nextRunOn: "2026-02-28" }, "2026-03-05");
    expect(r).toEqual({ due: ["2026-02-28"], nextRunOn: null });
  });
  it("does nothing for a paused retainer", () => {
    expect(dueRuns({ ...monthly31, nextRunOn: null }, "2026-10-10")).toEqual({ due: [], nextRunOn: null });
  });
});

describe("invoiceFor", () => {
  it("dates the invoice on the run date with the business terms and totals", () => {
    const items = parseItems(JSON.stringify([{ description: "Care", qtyMilli: 1000, unitPriceCents: 25000, taxRateBp: 1300 }, { bad: true }]));
    expect(items).toHaveLength(1);
    expect(invoiceFor(items, "2026-10-31", 15)).toEqual({
      issueDate: "2026-10-31",
      dueDate: "2026-11-15",
      subtotalCents: 25000,
      taxCents: 3250,
      totalCents: 28250,
    });
  });
});
