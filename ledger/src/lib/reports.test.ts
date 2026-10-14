import { describe, expect, it } from "vitest";
import { buildReports, parseYear, reportYears, type ReportInvoice } from "./reports";

const inv = (o: Partial<ReportInvoice>): ReportInvoice => ({
  currency: "USD",
  issueDate: "2026-03-05",
  businessName: "Statixx",
  clientName: "Northwind",
  subtotalCents: 100000,
  taxCents: 0,
  totalCents: 100000,
  ...o,
});

describe("buildReports", () => {
  const rows = [
    inv({}),
    inv({ issueDate: "2026-03-20", clientName: "Lumen", totalCents: 50000 }),
    inv({ issueDate: "2026-10-01", totalCents: 25000 }),
    inv({ currency: "CAD", businessName: "Aptixx", issueDate: "2026-10-02", subtotalCents: 100000, taxCents: 13000, totalCents: 113000 }),
    inv({ issueDate: "2025-12-31", totalCents: 999 }),
  ];
  const [cad, usd] = buildReports(rows, 2026);

  it("keeps currencies apart and ignores other years", () => {
    expect(cad.currency).toBe("CAD");
    expect(usd.currency).toBe("USD");
    expect(usd.totalCents).toBe(175000);
    expect(usd.count).toBe(3);
  });
  it("groups by month, client and business, largest first", () => {
    expect(usd.months[2]).toEqual({ label: "Mar", totalCents: 150000, count: 2 });
    expect(usd.months[9].totalCents).toBe(25000);
    expect(usd.months.reduce((s, m) => s + m.totalCents, 0)).toBe(usd.totalCents);
    expect(usd.clients.map((c) => [c.label, c.totalCents])).toEqual([["Northwind", 125000], ["Lumen", 50000]]);
    expect(usd.businesses).toEqual([{ label: "Statixx", totalCents: 175000, count: 3 }]);
  });
  it("sums tax charged", () => {
    expect(cad.taxCents).toBe(13000);
    expect(usd.taxCents).toBe(0);
  });
});

describe("years", () => {
  it("lists issued years newest first and includes the current one", () => {
    expect(reportYears(["2025-01-02", "2026-05-06", "2025-09-09"], 2027)).toEqual([2027, 2026, 2025]);
  });
  it("falls back for a bad year", () => {
    expect(parseYear("2025", 2026)).toBe(2025);
    expect(parseYear("abc", 2026)).toBe(2026);
    expect(parseYear(undefined, 2026)).toBe(2026);
    expect(parseYear("1999", 2026)).toBe(2026);
  });
});
