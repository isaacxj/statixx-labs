import { describe, expect, it } from "vitest";
import { formatProposalNumber, parseProposalForm, parseStatusFilter } from "./proposal-form";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as { get(k: string): string | null };

describe("parseProposalForm", () => {
  it("parses a valid form", () => {
    expect(parseProposalForm(form({ title: " Website ", businessId: "2", clientId: "3" }))).toEqual({
      value: { title: "Website", businessId: 2, clientId: 3 },
    });
  });
  it("requires a title, business and client", () => {
    const r = parseProposalForm(form({ title: " ", businessId: "x", clientId: "" }));
    expect("errors" in r && Object.keys(r.errors).sort()).toEqual(["businessId", "clientId", "title"]);
  });
});

describe("formatProposalNumber", () => {
  it("pads the sequence and uses the UTC year", () => {
    expect(formatProposalNumber("STX", 7, new Date("2026-12-31T23:30:00Z"))).toBe("STX-2026-007");
    expect(formatProposalNumber("APT", 1234, new Date("2027-01-01T00:00:00Z"))).toBe("APT-2027-1234");
  });
});

describe("parseStatusFilter", () => {
  it("accepts known statuses only", () => {
    expect(parseStatusFilter("sent")).toBe("sent");
    expect(parseStatusFilter("bogus")).toBeNull();
    expect(parseStatusFilter(undefined)).toBeNull();
  });
});
