import { describe, expect, it } from "vitest";
import { bpToPercent, formatProposalNumber, parseBusinessForm, percentToBp } from "./business-form";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as { get(k: string): string | null };

describe("percent conversion", () => {
  it("converts to and from basis points", () => {
    expect(percentToBp("8.25")).toBe(825);
    expect(percentToBp("13")).toBe(1300);
    expect(percentToBp("101")).toBeNull();
    expect(percentToBp("abc")).toBeNull();
    expect(bpToPercent(825)).toBe("8.25");
    expect(bpToPercent(1300)).toBe("13");
    expect(bpToPercent(0)).toBe("0");
  });
});

describe("parseBusinessForm", () => {
  const good = { name: " Aptixx ", accent: "#0ea5e9", currency: "CAD", taxRate: "13", numberPrefix: "apt", defaultTermsMd: "Net 14" };

  it("normalizes valid input", () => {
    const r = parseBusinessForm(form(good));
    expect(r).toEqual({
      value: {
        name: "Aptixx", legalName: null, address: null, accent: "#0EA5E9", currency: "CAD",
        taxRateBp: 1300, defaultTermsMd: "Net 14", numberPrefix: "APT",
      },
    });
  });

  it("reports every invalid field", () => {
    const r = parseBusinessForm(form({ ...good, name: "", accent: "red", numberPrefix: "x", taxRate: "-1" }));
    expect("errors" in r && Object.keys(r.errors).sort()).toEqual(["accent", "name", "numberPrefix", "taxRateBp"]);
  });
});

describe("formatProposalNumber", () => {
  it("pads the sequence", () => {
    expect(formatProposalNumber("STX", 2026, 7)).toBe("STX-2026-007");
  });
});
