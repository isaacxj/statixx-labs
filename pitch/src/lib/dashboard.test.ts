import { describe, expect, it } from "vitest";
import { computeDashboard, type DashProposal } from "./dashboard";

const item = (unitPriceCents: number, extra: Partial<DashProposal["items"][number]> = {}) => ({
  qtyMilli: 1000,
  unitPriceCents,
  recurring: "none" as const,
  optional: false,
  selected: false,
  ...extra,
});
const base: DashProposal = { status: "draft", currency: "USD", discountBp: 0, taxRateBp: 0, sentAt: null, acceptedAt: null, items: [] };
const now = new Date("2026-10-09T18:00:00Z");

describe("computeDashboard", () => {
  const proposals: DashProposal[] = [
    { ...base, status: "sent", sentAt: "2026-10-02 15:00:00", items: [item(100_000), item(50_000, { optional: true })] },
    { ...base, status: "viewed", sentAt: "2026-09-20 15:00:00", discountBp: 1000, taxRateBp: 500, items: [item(200_000)] },
    { ...base, status: "accepted", sentAt: "2026-10-01 00:00:00", acceptedAt: "2026-10-04 12:00:00", items: [item(80_000, { optional: true, selected: true })] },
    { ...base, status: "declined", sentAt: "2026-10-05 00:00:00", items: [item(30_000)] },
    { ...base, status: "sent", currency: "CAD", sentAt: "2026-10-06 00:00:00", items: [item(10_000), item(5_000, { recurring: "monthly" })] },
  ];
  const d = computeDashboard(proposals, now);

  it("sums open value per currency; optional unselected and monthly items are excluded", () => {
    // USD: 1000.00 (sent) + 2000 - 10% + 5% tax = 1890.00 (viewed)
    expect(d.openValue).toEqual([
      { currency: "USD", cents: 100_000 + 189_000 },
      { currency: "CAD", cents: 10_000 },
    ]);
  });

  it("counts proposals sent in the current Chicago month", () => {
    // The accepted one was sent 2026-10-01 00:00 UTC, which is still Sept 30 in Chicago.
    expect(d.sentThisMonth).toBe(3);
  });

  it("acceptance rate is accepted over answered; average days runs sent to accepted", () => {
    expect(d.acceptanceRate).toBe(0.5);
    expect(d.avgDaysToAccept).toBe(3.5);
  });

  it("groups value by status within each currency", () => {
    const usd = d.valueByStatus.find((g) => g.currency === "USD")!;
    expect(usd.rows.find((r) => r.status === "accepted")).toEqual({ status: "accepted", count: 1, cents: 80_000 });
    expect(usd.rows.find((r) => r.status === "draft")?.count).toBe(0);
  });

  it("has no rates when nothing is answered", () => {
    const e = computeDashboard([], now);
    expect(e.acceptanceRate).toBeNull();
    expect(e.avgDaysToAccept).toBeNull();
    expect(e.valueByStatus).toEqual([]);
  });
});
