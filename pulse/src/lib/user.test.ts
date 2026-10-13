import { describe, expect, it } from "vitest";
import { initialsFromEmail } from "./user";

describe("initialsFromEmail", () => {
  it("uses the first letters of a dotted name", () => {
    expect(initialsFromEmail("isaac.joseph@example.com")).toBe("IJ");
  });
  it("falls back to the first two letters", () => {
    expect(initialsFromEmail("dev@localhost")).toBe("DE");
  });
});
