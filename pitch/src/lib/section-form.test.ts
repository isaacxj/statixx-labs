import { describe, expect, it } from "vitest";
import { cleanSection, MAX_TITLE, moveId } from "./section-form";

describe("moveId", () => {
  it("swaps with the neighbour", () => {
    expect(moveId([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
    expect(moveId([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
  });
  it("refuses to move past the ends or an unknown id", () => {
    expect(moveId([1, 2, 3], 1, -1)).toBeNull();
    expect(moveId([1, 2, 3], 3, 1)).toBeNull();
    expect(moveId([1, 2, 3], 9, 1)).toBeNull();
  });
});

describe("cleanSection", () => {
  it("collapses title whitespace, normalises newlines, keeps body text", () => {
    expect(cleanSection({ title: "  Scope \n of work ", bodyMd: "a\r\nb" })).toEqual({ title: "Scope of work", bodyMd: "a\nb" });
  });
  it("clamps the title length", () => {
    expect(cleanSection({ title: "x".repeat(500), bodyMd: "" }).title).toHaveLength(MAX_TITLE);
  });
});
