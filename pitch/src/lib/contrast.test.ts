import { describe, expect, it } from "vitest";
import { contrastRatio, oklchToLinear, over, parseOklch, readTokens } from "./contrast";

const rgb = (v: string) => oklchToLinear(parseOklch(v)!);

describe("contrast", () => {
  it("black on white is 21:1", () => {
    expect(contrastRatio(rgb("oklch(0 0 0)"), rgb("oklch(1 0 0)"))).toBeCloseTo(21, 0);
  });
  it("same color is 1:1", () => {
    const c = rgb("oklch(0.5 0.1 200)");
    expect(contrastRatio(c, c)).toBeCloseTo(1, 5);
  });
  it("blends alpha over a background", () => {
    const mid = over(rgb("oklch(0 0 0)"), 0.5, rgb("oklch(1 0 0)"));
    expect(mid[0]).toBeCloseTo(0.5, 5);
  });
  it("reads tokens from a css block", () => {
    const css = ":root {\n --a: oklch(1 0 0);\n --b: 4px;\n}\n.dark {\n --a: oklch(0 0 0);\n}";
    expect(readTokens(css, ":root")).toEqual({ a: "oklch(1 0 0)", b: "4px" });
    expect(readTokens(css, ".dark").a).toBe("oklch(0 0 0)");
  });
});
