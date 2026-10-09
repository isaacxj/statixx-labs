import { describe, expect, it } from "vitest";
import { accentForeground, isShareToken, newShareToken, safeAccent } from "./share";

describe("share tokens", () => {
  it("are 32 url-safe characters and do not repeat", () => {
    const a = newShareToken();
    expect(isShareToken(a)).toBe(true);
    expect(newShareToken()).not.toBe(a);
  });
  it("rejects anything that is not a token", () => {
    expect(isShareToken("short")).toBe(false);
    expect(isShareToken("../".repeat(11))).toBe(false);
  });
});

describe("accent", () => {
  it("keeps valid hex and falls back otherwise", () => {
    expect(safeAccent("#0a1B2c")).toBe("#0a1B2c");
    expect(safeAccent("red; background:url(x)")).toBe("#8B5CF6");
    expect(safeAccent(null)).toBe("#8B5CF6");
  });
  it("picks readable text", () => {
    expect(accentForeground("#4F46E5")).toBe("#ffffff");
    expect(accentForeground("#FACC15")).toBe("#000000");
  });
});
