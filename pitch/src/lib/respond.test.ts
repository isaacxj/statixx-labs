import { describe, expect, it } from "vitest";
import { canRespond, cleanReason, cleanSignature, clientIp, isLocked, pickSelectable } from "./respond";

describe("respond", () => {
  it("allows answers only while sent or viewed", () => {
    expect(["draft", "sent", "viewed", "accepted", "declined", "expired"].filter(canRespond)).toEqual(["sent", "viewed"]);
    expect(isLocked("accepted")).toBe(true);
    expect(isLocked("viewed")).toBe(false);
  });

  it("cleans the typed signature", () => {
    expect(cleanSignature("  Ada   Lovelace ")).toBe("Ada Lovelace");
    expect(cleanSignature("A")).toBeNull();
    expect(cleanSignature("   ")).toBeNull();
  });

  it("trims and caps the decline reason", () => {
    expect(cleanReason("  too pricey \r\n")).toBe("too pricey");
    expect(cleanReason("x".repeat(2000))).toHaveLength(1000);
  });

  it("reads the client IP", () => {
    const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });
    expect(clientIp(h({ "cf-connecting-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" }))).toBe("198.51.100.2");
    expect(clientIp(h({ "cf-connecting-ip": "<script>" }))).toBeNull();
    expect(clientIp(h({}))).toBeNull();
  });

  it("keeps only optional ids from the request", () => {
    expect(pickSelectable([1, 2, 2, 9, "3", 1.5], [1, 2, 3])).toEqual([1, 2]);
    expect(pickSelectable("1", [1])).toEqual([]);
  });
});
