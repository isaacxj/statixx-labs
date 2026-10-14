import { describe, expect, it } from "vitest";
import { parseRetainerForm } from "./retainer-form";

function form(over: Record<string, string> = {}) {
  const d = new FormData();
  const base: Record<string, string> = {
    businessId: "1",
    clientId: "2",
    title: "Monthly hosting",
    cadence: "monthly",
    anchorDay: "31",
    startsOn: "2027-01-01",
    endsOn: "",
    active: "on",
    items: JSON.stringify([{ description: "Hosting", qty: "1", unitPrice: "250", taxRate: "0" }]),
  };
  for (const [k, v] of Object.entries({ ...base, ...over })) d.set(k, v);
  return d;
}

describe("parseRetainerForm", () => {
  it("parses a valid retainer into cents and thousandths", () => {
    const r = parseRetainerForm(form());
    expect(r.ok && r.value.items[0]).toEqual({ description: "Hosting", qtyMilli: 1000, unitPriceCents: 25000, taxRateBp: 0 });
  });

  it("rejects an anchor day outside 1 to 31 and an end before the start", () => {
    const r = parseRetainerForm(form({ anchorDay: "32", endsOn: "2026-12-31" }));
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["anchorDay", "endsOn"]);
  });

  it("requires at least one valid line", () => {
    const r = parseRetainerForm(form({ items: JSON.stringify([{ description: "", qty: "1", unitPrice: "5", taxRate: "" }]) }));
    expect(!r.ok && r.errors.items).toBeTruthy();
  });
});
