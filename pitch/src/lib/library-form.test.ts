import { describe, expect, it } from "vitest";
import { cleanLibraryEntry, groupByCategory } from "./library-form";

describe("cleanLibraryEntry", () => {
  it("falls back to General and a placeholder title", () => {
    expect(cleanLibraryEntry({ category: "  ", title: " ", bodyMd: "a\r\nb" })).toEqual({
      category: "General",
      title: "Untitled section",
      bodyMd: "a\nb",
    });
  });
  it("collapses whitespace and clamps lengths", () => {
    const c = cleanLibraryEntry({ category: "Terms   and\nconditions" + "x".repeat(60), title: "T", bodyMd: "" });
    expect(c.category.startsWith("Terms and conditions")).toBe(true);
    expect(c.category.length).toBe(40);
  });
});

describe("groupByCategory", () => {
  it("sorts categories and keeps entry order", () => {
    const groups = groupByCategory([
      { category: "Terms", id: 1 },
      { category: "About", id: 2 },
      { category: "Terms", id: 3 },
    ]);
    expect(groups.map((g) => g.category)).toEqual(["About", "Terms"]);
    expect(groups[1].entries.map((e) => e.id)).toEqual([1, 3]);
  });
});
