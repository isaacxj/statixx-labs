import { describe, expect, it } from "vitest";
import { filterItems, isTypingTarget, type PaletteItem } from "./palette";

const items: PaletteItem[] = [
  { id: "a", group: "Pages", label: "Invoices", href: "/invoices" },
  { id: "b", group: "Actions", label: "New invoice", href: "/invoices/new" },
  { id: "c", group: "Invoices", label: "APT-0001 · Acme", hint: "Aptixx", href: "/invoices/1" },
  { id: "d", group: "Clients", label: "Acme Corp", href: "/clients/1" },
];

describe("command palette search", () => {
  it("lists everything in group order when the query is empty", () => {
    expect(filterItems(items, "").map((i) => i.id)).toEqual(["b", "a", "c", "d"]);
  });

  it("ranks prefix matches above word-start and substring matches", () => {
    expect(filterItems(items, "inv").map((i) => i.id)).toEqual(["a", "b"]);
    expect(filterItems(items, "acme").map((i) => i.id)).toEqual(["d", "c"]);
  });

  it("matches hidden hint text and drops non-matches", () => {
    expect(filterItems(items, "aptixx").map((i) => i.id)).toEqual(["c"]);
    expect(filterItems(items, "zzz")).toEqual([]);
  });

  it("keeps single-key shortcuts out of form fields", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "BODY" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
