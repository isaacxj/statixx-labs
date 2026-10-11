import { describe, expect, it } from "vitest";
import { centralToUtc, dayLabel, groupByDay, localDay, parseEntryForm } from "./entries";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("central time", () => {
  it("converts CDT and CST wall-clock times to UTC", () => {
    expect(centralToUtc("2026-10-06", "09:00")).toBe("2026-10-06T14:00:00.000Z");
    expect(centralToUtc("2026-12-01", "09:00")).toBe("2026-12-01T15:00:00.000Z");
  });
  it("puts late-evening UTC entries on the previous Central day", () => {
    expect(localDay("2026-10-07T02:30:00.000Z")).toBe("2026-10-06");
  });
});

describe("groupByDay", () => {
  it("groups by day and sums minutes", () => {
    const g = groupByDay([
      { startedAt: "2026-10-06T20:00:00.000Z", minutes: 30 },
      { startedAt: "2026-10-06T15:00:00.000Z", minutes: 60 },
      { startedAt: "2026-10-05T15:00:00.000Z", minutes: 15 },
    ]);
    expect(g.map((x) => [x.day, x.minutes])).toEqual([["2026-10-06", 90], ["2026-10-05", 15]]);
  });
  it("labels days", () => {
    expect(dayLabel("2026-10-06", "2026-10-06")).toBe("Today");
    expect(dayLabel("2026-10-05", "2026-10-06")).toBe("Yesterday");
    expect(dayLabel("2026-10-03", "2026-10-06")).toBe("Sat, Oct 3");
  });
});

describe("parseEntryForm", () => {
  it("builds start and end from date, time, and duration", () => {
    const r = parseEntryForm(form({ projectId: "2", day: "2026-10-06", start: "09:00", duration: "1:30", description: " Calls " }));
    expect(r).toEqual({ ok: true, data: { projectId: 2, description: "Calls", startedAt: "2026-10-06T14:00:00.000Z", endedAt: "2026-10-06T15:30:00.000Z", minutes: 90 } });
  });
  it("rejects bad input", () => {
    const r = parseEntryForm(form({ projectId: "", day: "", start: "9", duration: "0" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["day", "duration", "projectId", "start"]);
  });
});
