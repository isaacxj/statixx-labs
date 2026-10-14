import { describe, expect, it } from "vitest";
import { initialsFromEmail } from "./initials";

describe("initialsFromEmail", () => {
  it("uses two name parts when present", () => {
    expect(initialsFromEmail("isaac.joseph@statixx.dev")).toBe("IJ");
  });
  it("falls back to the first two letters", () => {
    expect(initialsFromEmail("isaac@statixx.dev")).toBe("IS");
  });
  it("handles an empty local part", () => {
    expect(initialsFromEmail("@x.com")).toBe("?");
  });
});
