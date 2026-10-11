import { describe, expect, it } from "vitest";
import { formatDate, STATUS_LABELS } from "./status";

describe("status helpers", () => {
  it("formats calendar days without timezone drift", () => {
    expect(formatDate("2026-11-14")).toBe("Nov 14, 2026");
    expect(formatDate(null)).toBe("—");
  });
  it("labels every status", () => {
    expect(Object.values(STATUS_LABELS)).toEqual(["On track", "At risk", "Blocked", "Done"]);
  });
});
