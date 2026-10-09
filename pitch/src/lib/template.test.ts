import { describe, expect, it } from "vitest";
import { buildSnapshot, cleanTemplateName, copyTitle, parseSnapshot } from "./template";

const item = { description: "Design", qtyMilli: 2500, unitPriceCents: 10000, recurring: "none" as const, optional: true };

describe("snapshot", () => {
  it("round-trips sections and line items, grouped by section", () => {
    const snap = buildSnapshot(
      { discountBp: 500, taxRateBp: 825 },
      [
        { id: 1, kind: "text", title: "Intro", bodyMd: "Hi" },
        { id: 2, kind: "pricing", title: "Fees", bodyMd: "" },
      ],
      [{ ...item, sectionId: 2 }, { ...item, description: "Hosting", recurring: "monthly", sectionId: 2 }],
    );
    expect(snap.sections[0].items).toEqual([]);
    expect(snap.sections[1].items.map((i) => i.description)).toEqual(["Design", "Hosting"]);
    expect(parseSnapshot(JSON.stringify(snap))).toEqual(snap);
  });
  it("drops selection state so a new draft starts with optional items unticked", () => {
    const snap = buildSnapshot({ discountBp: 0, taxRateBp: 0 }, [{ id: 1, kind: "pricing", title: "", bodyMd: "" }], [{ ...item, sectionId: 1, selected: true } as never]);
    expect(snap.sections[0].items[0]).not.toHaveProperty("selected");
  });
  it("degrades malformed JSON to an empty template", () => {
    expect(parseSnapshot("not json").sections).toEqual([]);
    expect(parseSnapshot('{"sections":[{"kind":"weird","items":[{"qtyMilli":"x","recurring":"yearly"}]}],"discountBp":-5}')).toEqual({
      discountBp: 0,
      taxRateBp: 0,
      sections: [{ kind: "text", title: "", bodyMd: "", items: [] }],
    });
  });
});

describe("names", () => {
  it("cleans template names", () => {
    expect(cleanTemplateName("  Web   build \n")).toBe("Web build");
    expect(cleanTemplateName("  ")).toBe("Untitled template");
  });
  it("prefixes copies", () => {
    expect(copyTitle("Site")).toBe("Copy of Site");
  });
});
