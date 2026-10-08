import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats integer cents as dollars", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
  });
  it("handles zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });
});
