import { describe, expect, it } from "vitest";
import { initialsFromEmail } from "./user";

describe("initialsFromEmail", () => {
  it("uses the first letters of two name parts", () => {
    expect(initialsFromEmail("isaac.joseph@statixx.com")).toBe("IJ");
  });
  it("uses two letters of a single part", () => {
    expect(initialsFromEmail("isaac@statixx.com")).toBe("IS");
  });
  it("falls back to a question mark", () => {
    expect(initialsFromEmail("@x.com")).toBe("?");
  });
});
