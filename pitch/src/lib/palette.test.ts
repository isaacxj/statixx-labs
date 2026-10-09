import { describe, expect, it } from "vitest";
import { filterPalette, proposalIdFromPath, type PaletteItem } from "./palette";

const items: PaletteItem[] = [
  { key: "a1", group: "Actions", label: "New proposal", href: "/proposals/new" },
  { key: "p1", group: "Pages", label: "Clients", href: "/clients" },
  ...Array.from({ length: 8 }, (_, i): PaletteItem => ({ key: `r${i}`, group: "Proposals", label: `Site ${i}`, hint: `STX-2026-00${i} Acme` })),
  { key: "c1", group: "Clients", label: "Acme Co", hint: "Jo" },
];

describe("filterPalette", () => {
  it("shows actions, pages and five proposals when idle", () => {
    const r = filterPalette(items, "");
    expect(r.map((i) => i.group)).toEqual(["Actions", "Pages", ...Array(5).fill("Proposals")]);
  });
  it("matches every word across label and hint, in group order", () => {
    const r = filterPalette(items, "acme site 3");
    expect(r.map((i) => i.key)).toEqual(["r3"]);
    expect(filterPalette(items, "acme").map((i) => i.group)).toEqual(["Proposals", ...Array(7).fill("Proposals"), "Clients"]);
  });
  it("returns nothing for no match", () => {
    expect(filterPalette(items, "zzz")).toEqual([]);
  });
});

describe("proposalIdFromPath", () => {
  it("reads the id of a proposal page only", () => {
    expect(proposalIdFromPath("/proposals/12")).toBe(12);
    expect(proposalIdFromPath("/proposals/new")).toBeNull();
    expect(proposalIdFromPath("/proposals")).toBeNull();
  });
});
