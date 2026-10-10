import { describe, expect, it } from "vitest";
import { formatMoney, formatRate } from "./money";

describe("formatMoney", () => {
  it("formats cents with grouping", () => {
    expect(formatMoney(125050)).toBe("$1,250.50");
    expect(formatMoney(5, "CAD")).toBe("CA$0.05");
  });
});

describe("formatRate", () => {
  it("turns basis points into a percent", () => {
    expect(formatRate(1300)).toBe("13%");
    expect(formatRate(875)).toBe("8.75%");
  });
});
