import { describe, expect, it } from "vitest";
import { hourStart, rawCutoff, rollupCutoff } from "./retention";

const now = Date.UTC(2026, 9, 13, 14, 41, 39);

describe("retention windows", () => {
  it("floors to the start of the current hour", () => {
    expect(hourStart(now)).toBe("2026-10-13 14:00:00");
    expect(hourStart(Date.UTC(2026, 9, 13, 14, 0, 0))).toBe("2026-10-13 14:00:00");
  });

  it("keeps raw checks for 7 days and rollups for 400", () => {
    expect(rawCutoff(now)).toBe("2026-10-06 14:41:39");
    expect(rollupCutoff(now)).toBe("2025-09-08 14:41:39");
  });
});
