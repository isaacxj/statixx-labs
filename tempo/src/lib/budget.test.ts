import { describe, expect, it } from "vitest";
import { budgetStatus, burnSeries } from "./budget";

describe("budgetStatus", () => {
  it("has no status without a budget", () => {
    expect(budgetStatus(100, null)).toBeNull();
    expect(budgetStatus(100, 0)).toBeNull();
  });
  it("warns from 80% and goes over at 100%", () => {
    expect(budgetStatus(79, 100)?.level).toBe("ok");
    expect(budgetStatus(80, 100)?.level).toBe("warning");
    expect(budgetStatus(99, 100)?.level).toBe("warning");
    expect(budgetStatus(100, 100)?.level).toBe("over");
    expect(budgetStatus(150, 100)).toMatchObject({ level: "over", percent: 150 });
  });
});

describe("burnSeries", () => {
  it("accumulates by Central day and fills quiet days up to today", () => {
    const s = burnSeries(
      [
        { startedAt: "2026-10-05T15:00:00.000Z", minutes: 60 },
        { startedAt: "2026-10-05T20:00:00.000Z", minutes: 30 },
        { startedAt: "2026-10-07T15:00:00.000Z", minutes: 45 },
      ],
      "2026-10-08",
    );
    expect(s.map((p) => p.minutes)).toEqual([90, 90, 135, 135]);
    expect(s[0].day).toBe("2026-10-05");
    expect(s[3].day).toBe("2026-10-08");
  });
  it("is empty with no entries", () => {
    expect(burnSeries([], "2026-10-08")).toEqual([]);
  });
});
