import { describe, expect, it } from "vitest";
import { idleStatus, parseIdleLimitHours, parseKeepMinutes } from "./idle";

const start = "2026-10-10T08:00:00.000Z";
const at = (iso: string) => new Date(iso).getTime();

describe("idle guard", () => {
  it("flags a 10-hour timer against an 8-hour limit", () => {
    expect(idleStatus(start, at("2026-10-10T18:00:00.000Z"), 480)).toEqual({ over: true, elapsedMinutes: 600, limitMinutes: 480 });
  });
  it("does not flag a timer at or under the limit", () => {
    expect(idleStatus(start, at("2026-10-10T16:00:00.000Z"), 480).over).toBe(false);
  });
  it("is off when the limit is 0", () => {
    expect(idleStatus(start, at("2026-10-11T08:00:00.000Z"), 0).over).toBe(false);
  });
  it("accepts keep minutes from 0 up to the elapsed time only", () => {
    expect(parseKeepMinutes("480", 600)).toBe(480);
    expect(parseKeepMinutes("0", 600)).toBe(0);
    expect(parseKeepMinutes("601", 600)).toBeNull();
    expect(parseKeepMinutes("-5", 600)).toBeNull();
    expect(parseKeepMinutes("1.5", 600)).toBeNull();
    expect(parseKeepMinutes("", 600)).toBeNull();
  });
  it("converts the Settings hours to minutes", () => {
    expect(parseIdleLimitHours("8")).toBe(480);
    expect(parseIdleLimitHours("1.5")).toBe(90);
    expect(parseIdleLimitHours("0")).toBe(0);
    expect(parseIdleLimitHours("25")).toBeNull();
    expect(parseIdleLimitHours("abc")).toBeNull();
  });
});
