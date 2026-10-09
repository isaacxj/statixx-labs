import { describe, expect, it } from "vitest";
import { parseBusinessForm, percentToBp } from "./business-form";

function form(over: Record<string, string> = {}) {
  const base: Record<string, string> = {
    name: "Aptixx", legalName: "Aptixx Inc.", address: "Toronto", accent: "#10B981", currency: "CAD",
    taxRate: "13", termsDays: "15", paymentInstructions: "e-transfer", numberPrefix: "apt",
  };
  const d = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...over })) d.set(k, v);
  return d;
}

describe("percentToBp", () => {
  it("converts percents to basis points", () => {
    expect(percentToBp("13")).toBe(1300);
    expect(percentToBp("8.75%")).toBe(875);
    expect(percentToBp("0")).toBe(0);
  });
  it("rejects bad rates", () => {
    expect(percentToBp("101")).toBeNull();
    expect(percentToBp("abc")).toBeNull();
    expect(percentToBp("1.234")).toBeNull();
  });
});

describe("parseBusinessForm", () => {
  it("normalizes a valid form", () => {
    const r = parseBusinessForm(form());
    expect(r.ok && r.value).toMatchObject({ numberPrefix: "APT", taxRateBp: 1300, termsDays: 15, accent: "#10b981" });
  });
  it("reports each bad field", () => {
    const r = parseBusinessForm(form({ name: " ", currency: "EUR", taxRate: "x", termsDays: "-1", numberPrefix: "too long!" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["currency", "name", "numberPrefix", "taxRateBp", "termsDays"]);
  });
});
