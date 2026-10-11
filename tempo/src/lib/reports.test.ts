import { describe, expect, it } from "vitest";
import { buildReport, entriesCsv, parseRange, type ReportEntry } from "./reports";

const e = (over: Partial<ReportEntry>): ReportEntry => ({
  startedAt: "2026-10-07T15:00:00.000Z",
  minutes: 60,
  billable: true,
  projectId: 1,
  projectName: "Site",
  clientName: "Acme",
  description: "",
  ...over,
});

describe("buildReport", () => {
  const entries = [
    e({ minutes: 90 }),
    e({ minutes: 30, billable: false }),
    e({ projectId: 2, projectName: "App", clientName: "Beta", minutes: 120, startedAt: "2026-10-14T15:00:00.000Z" }),
  ];
  const r = buildReport(entries);

  it("totals match the entries", () => {
    expect(r.totalMinutes).toBe(240);
    expect(r.billableMinutes).toBe(210);
    expect(r.byClient.reduce((s, g) => s + g.minutes, 0)).toBe(240);
    expect(r.byProject.reduce((s, g) => s + g.minutes, 0)).toBe(240);
    expect(r.byWeek.reduce((s, g) => s + g.minutes, 0)).toBe(240);
  });
  it("groups by client sorted by hours, and by Monday week", () => {
    expect(r.byClient.map((g) => [g.label, g.minutes])).toEqual([["Beta", 120], ["Acme", 120]].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
    expect(r.byWeek.map((g) => g.key)).toEqual(["2026-10-05", "2026-10-12"]);
  });
});

describe("parseRange", () => {
  it("defaults to 30 days and swaps reversed ranges", () => {
    expect(parseRange(undefined, undefined, "2026-10-30")).toEqual({ from: "2026-10-01", to: "2026-10-30" });
    expect(parseRange("2026-10-20", "2026-10-10", "2026-10-30")).toEqual({ from: "2026-10-10", to: "2026-10-20" });
  });
});

describe("entriesCsv", () => {
  it("quotes commas and sums to the same hours", () => {
    const csv = entriesCsv([e({ description: 'Fix "nav", footer', minutes: 90 })]);
    expect(csv).toContain('"Fix ""nav"", footer",1.50,yes');
  });
});
