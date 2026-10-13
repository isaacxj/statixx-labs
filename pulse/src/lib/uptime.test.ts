import { describe, expect, it } from "vitest";
import { formatUptime, latencySeries, sparklinePath, uptimePercent, type CheckPoint } from "./uptime";

const now = Date.parse("2026-10-12T18:00:00Z");
const pt = (at: string, ok: boolean, latencyMs: number | null = 100): CheckPoint => ({ monitorId: 1, at, ok, latencyMs });

describe("uptimePercent", () => {
  it("counts only checks inside the window", () => {
    const pts = [pt("2026-10-12 17:00:00", true), pt("2026-10-12 17:30:00", false), pt("2026-10-10 12:00:00", false)];
    expect(uptimePercent(pts, now, 24 * 3600_000)).toBe(50);
  });
  it("is null without checks", () => expect(uptimePercent([], now, 3600_000)).toBeNull());
});

describe("formatUptime", () => {
  it("never rounds up to 100", () => expect(formatUptime(99.999)).toBe("99.99%"));
  it("shows 100% for a perfect record", () => expect(formatUptime(100)).toBe("100%"));
  it("shows a dash for no data", () => expect(formatUptime(null)).toBe("–"));
});

describe("latencySeries", () => {
  it("skips failed checks and orders oldest first", () => {
    const pts = [pt("2026-10-12 17:10:00", true, 300), pt("2026-10-12 17:00:00", true, 100), pt("2026-10-12 17:05:00", false, null)];
    expect(latencySeries(pts, now, 3600_000 * 2)).toEqual([100, 300]);
  });
  it("downsamples to the max length", () => {
    const pts = Array.from({ length: 100 }, (_, i) => pt(`2026-10-12 ${String(10 + Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00`, true, i));
    expect(latencySeries(pts, now, 3600_000 * 24, 20)).toHaveLength(20);
  });
});

describe("sparklinePath", () => {
  it("needs two points", () => expect(sparklinePath([5], 100, 20)).toBe(""));
  it("maps min to the bottom and max to the top", () => expect(sparklinePath([1, 3], 100, 20)).toBe("M0.0 20.0 L100.0 0.0"));
});
