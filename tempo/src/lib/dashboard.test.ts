import { describe, expect, it } from "vitest";
import { buildDashboard } from "./dashboard";
import type { ReportEntry } from "./reports";

const e = (over: Partial<ReportEntry>): ReportEntry => ({
  startedAt: "2026-10-06T15:00:00.000Z",
  minutes: 60,
  billable: true,
  projectId: 1,
  projectName: "Site",
  clientName: "Acme",
  description: "",
  ...over,
});

describe("buildDashboard", () => {
  const entries = [
    e({ minutes: 90 }),
    e({ minutes: 30, billable: false }),
    e({ projectId: 2, projectName: "App", clientName: "Beta", minutes: 120, startedAt: "2026-10-08T15:00:00.000Z" }),
    e({ minutes: 500, startedAt: "2026-10-20T15:00:00.000Z" }),
  ];
  const d = buildDashboard(entries, "2026-10-05");

  it("totals the week and ignores entries outside it", () => {
    expect(d.totalMinutes).toBe(240);
    expect(d.billableMinutes).toBe(210);
    expect(d.billableShare).toBe(88);
  });
  it("ranks projects by hours", () => {
    expect(d.byProject.map((p) => [p.projectId, p.minutes])).toEqual([[1, 120], [2, 120]]);
  });
  it("gives one point per day, Monday first", () => {
    expect(d.daily).toHaveLength(7);
    expect(d.daily[1]).toEqual({ day: "2026-10-06", minutes: 120 });
    expect(d.daily[3].minutes).toBe(120);
  });
  it("is empty-safe", () => {
    expect(buildDashboard([], "2026-10-05").billableShare).toBe(0);
  });
});
