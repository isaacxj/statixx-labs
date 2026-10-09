import { describe, expect, it } from "vitest";
import { logoKey, MAX_LOGO_BYTES, validateLogo } from "./logo";

describe("validateLogo", () => {
  it("accepts png, jpeg and webp under the limit", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(validateLogo({ type, size: 1000 })).toBeNull();
    }
  });
  it("rejects svg and other types", () => {
    expect(validateLogo({ type: "image/svg+xml", size: 10 })).toMatch(/PNG/);
    expect(validateLogo({ type: "text/html", size: 10 })).toMatch(/PNG/);
  });
  it("rejects files over 1 MB", () => {
    expect(validateLogo({ type: "image/png", size: MAX_LOGO_BYTES + 1 })).toMatch(/1 MB/);
    expect(validateLogo({ type: "image/png", size: MAX_LOGO_BYTES })).toBeNull();
  });
});

describe("logoKey", () => {
  it("builds a key with the right extension", () => {
    expect(logoKey(3, "image/jpeg", 99)).toBe("logos/3-99.jpg");
  });
});
