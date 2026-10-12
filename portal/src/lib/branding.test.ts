import { describe, expect, it } from "vitest";
import { brandVars, onAccent, parseBrandingInput } from "./branding";

const form = (o: Record<string, string | File>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("branding input", () => {
  it("accepts an accent with no logo", () => {
    expect(parseBrandingInput(form({ accent: "#f97316" }))).toEqual({ ok: true, value: { accent: "#F97316", logo: null, removeLogo: false } });
  });
  it("rejects a bad accent", () => {
    expect(parseBrandingInput(form({ accent: "orange" })).ok).toBe(false);
  });
  it("checks logo type and size", () => {
    const png = new File([new Uint8Array(10)], "l.png", { type: "image/png" });
    const svg = new File(["<svg/>"], "l.svg", { type: "image/svg+xml" });
    const big = new File([new Uint8Array(1024 * 1024 + 1)], "b.png", { type: "image/png" });
    expect(parseBrandingInput(form({ accent: "#000000", logo: png })).ok).toBe(true);
    expect(parseBrandingInput(form({ accent: "#000000", logo: svg })).ok).toBe(false);
    expect(parseBrandingInput(form({ accent: "#000000", logo: big })).ok).toBe(false);
  });
  it("ignores remove when a new logo is chosen", () => {
    const png = new File([new Uint8Array(10)], "l.png", { type: "image/png" });
    const r = parseBrandingInput(form({ accent: "#000000", logo: png, removeLogo: "1" }));
    expect(r.ok && r.value.removeLogo).toBe(false);
  });
});

describe("accent colors", () => {
  it("picks readable text", () => {
    expect(onAccent("#0EA5E9")).toBe("dark");
    expect(onAccent("#F97316")).toBe("dark");
    expect(onAccent("#1E3A8A")).toBe("light");
    expect(onAccent("#FFFFFF")).toBe("dark");
  });
  it("builds CSS variables only for valid colors", () => {
    expect(brandVars("#1E3A8A")).toEqual({ "--primary": "#1E3A8A", "--ring": "#1E3A8A", "--primary-foreground": "var(--on-accent-light)" });
    expect(brandVars("nope")).toEqual({});
  });
});
