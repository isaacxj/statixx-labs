import { describe, expect, it } from "vitest";
import { formatDuration, formatMoney } from "./format";

describe("formatDuration", () => {
  it("formats whole minutes as H:MM", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(90)).toBe("1:30");
    expect(formatDuration(605)).toBe("10:05");
  });
});

describe("formatMoney", () => {
  it("formats cents in the given currency", () => {
    expect(formatMoney(12500, "USD")).toBe("$125.00");
    expect(formatMoney(0, "CAD")).toBe("CA$0.00");
  });
});
