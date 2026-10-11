import { describe, expect, it } from "vitest";
import { addDays, buildGrid, planCellEdit, weekDays, weekRange, weekStart } from "./timesheet";

describe("week helpers", () => {
  it("finds Monday for any day of the week, including Sunday", () => {
    expect(weekStart("2026-10-07")).toBe("2026-10-05");
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
    expect(weekStart("2026-10-11")).toBe("2026-10-05");
  });
  it("lists seven days and spans a DST change", () => {
    expect(weekDays("2026-10-26")).toHaveLength(7);
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    // CDT ends Nov 1, so the week of Oct 26 is 169 hours long.
    const { from, to } = weekRange("2026-10-26");
    expect((new Date(to).getTime() - new Date(from).getTime()) / 3600000).toBe(169);
  });
});

describe("buildGrid", () => {
  const days = weekDays("2026-10-05");
  it("sums minutes per project and day with row and column totals", () => {
    const g = buildGrid(
      [
        { projectId: 1, startedAt: "2026-10-06T14:00:00.000Z", minutes: 60 },
        { projectId: 1, startedAt: "2026-10-06T20:00:00.000Z", minutes: 30 },
        { projectId: 2, startedAt: "2026-10-06T15:00:00.000Z", minutes: 45 },
        { projectId: 2, startedAt: "2026-10-08T15:00:00.000Z", minutes: 15 },
        { projectId: 3, startedAt: "2026-10-20T15:00:00.000Z", minutes: 99 },
      ],
      days,
    );
    expect(g.rows.map((r) => [r.projectId, r.total])).toEqual([[1, 90], [2, 60]]);
    expect(g.columnTotals).toEqual([0, 135, 0, 15, 0, 0, 0]);
    expect(g.total).toBe(150);
  });
});

describe("planCellEdit", () => {
  const e = (id: number, startedAt: string, minutes: number, billed = false) => ({ id, startedAt, minutes, billed });
  it("creates an entry when the cell was empty", () => {
    expect(planCellEdit([], 90)).toEqual({ ok: true, updates: [], deletes: [], create: 90 });
  });
  it("grows the newest unbilled entry", () => {
    const plan = planCellEdit([e(1, "2026-10-06T14:00:00.000Z", 60), e(2, "2026-10-06T18:00:00.000Z", 30)], 150);
    expect(plan).toEqual({ ok: true, updates: [{ id: 2, minutes: 90 }], deletes: [], create: 0 });
  });
  it("shrinks from the newest entry, deleting those it empties", () => {
    const plan = planCellEdit([e(1, "2026-10-06T14:00:00.000Z", 60), e(2, "2026-10-06T18:00:00.000Z", 30)], 45);
    expect(plan).toEqual({ ok: true, updates: [{ id: 1, minutes: 45 }], deletes: [2], create: 0 });
  });
  it("clearing the cell deletes everything unbilled", () => {
    expect(planCellEdit([e(1, "2026-10-06T14:00:00.000Z", 60)], 0)).toEqual({ ok: true, updates: [], deletes: [1], create: 0 });
  });
  it("leaves billed entries alone and refuses to go below them", () => {
    const entries = [e(1, "2026-10-06T14:00:00.000Z", 60, true), e(2, "2026-10-06T18:00:00.000Z", 30)];
    expect(planCellEdit(entries, 120)).toEqual({ ok: true, updates: [{ id: 2, minutes: 60 }], deletes: [], create: 0 });
    expect(planCellEdit(entries, 30).ok).toBe(false);
    expect(planCellEdit([entries[0]], 90)).toEqual({ ok: true, updates: [], deletes: [], create: 30 });
  });
  it("rejects more than 24 hours", () => {
    expect(planCellEdit([], 24 * 60 + 1).ok).toBe(false);
  });
});
