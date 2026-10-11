import { describe, expect, it } from "vitest";
import { defaultBillable, parseRounding, roundMinutes } from "./rounding";

describe("roundMinutes", () => {
  it("leaves time alone with no rounding", () => {
    expect(roundMinutes(37, 0)).toBe(37);
  });
  it("rounds up to the next 6 minutes", () => {
    expect(roundMinutes(1, 6)).toBe(6);
    expect(roundMinutes(6, 6)).toBe(6);
    expect(roundMinutes(7, 6)).toBe(12);
    expect(roundMinutes(61, 6)).toBe(66);
  });
  it("rounds up to the next 15 minutes", () => {
    expect(roundMinutes(14, 15)).toBe(15);
    expect(roundMinutes(15, 15)).toBe(15);
    expect(roundMinutes(16, 15)).toBe(30);
    expect(roundMinutes(100, 15)).toBe(105);
  });
  it("keeps zero at zero", () => {
    expect(roundMinutes(0, 15)).toBe(0);
  });
});

describe("billable defaults", () => {
  it("is non-billable only for non-billable projects", () => {
    expect(defaultBillable("hourly")).toBe(true);
    expect(defaultBillable("fixed")).toBe(true);
    expect(defaultBillable("retainer")).toBe(true);
    expect(defaultBillable("non_billable")).toBe(false);
  });
});

describe("parseRounding", () => {
  it("accepts none, 6, and 15 only", () => {
    expect(parseRounding("0")).toBe(0);
    expect(parseRounding("6")).toBe(6);
    expect(parseRounding("15")).toBe(15);
    expect(parseRounding("10")).toBeNull();
    expect(parseRounding(null)).toBeNull();
  });
});
