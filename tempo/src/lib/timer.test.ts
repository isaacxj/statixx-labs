import { describe, expect, it } from "vitest";
import { elapsedSeconds, formatClock, minutesBetween } from "./timer";

describe("timer", () => {
  it("rounds elapsed time to whole minutes", () => {
    expect(minutesBetween("2026-10-10T10:00:00.000Z", "2026-10-10T10:29:29.000Z")).toBe(29);
    expect(minutesBetween("2026-10-10T10:00:00.000Z", "2026-10-10T10:29:31.000Z")).toBe(30);
  });
  it("never goes negative", () => {
    expect(minutesBetween("2026-10-10T10:05:00.000Z", "2026-10-10T10:00:00.000Z")).toBe(0);
  });
  it("formats a clock", () => {
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(0)).toBe("0:00:00");
  });
  it("counts seconds since start", () => {
    const start = "2026-10-10T10:00:00.000Z";
    expect(elapsedSeconds(start, new Date("2026-10-10T10:01:30.500Z").getTime())).toBe(90);
  });
});
