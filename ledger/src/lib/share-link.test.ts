import { describe, expect, it } from "vitest";
import { isShareToken, sharePath } from "./share-link";

describe("share link", () => {
  it("accepts a generated token shape", () => {
    expect(isShareToken("AbC_-123AbC_-123AbC_-123AbC_-12345".slice(0, 32))).toBe(true);
  });
  it("rejects short, long and odd tokens", () => {
    expect(isShareToken("abc")).toBe(false);
    expect(isShareToken("a".repeat(33))).toBe(false);
    expect(isShareToken("a".repeat(31) + "/")).toBe(false);
  });
  it("builds the public path", () => {
    expect(sharePath("tok")).toBe("/i/tok");
  });
});
