import { describe, expect, it } from "vitest";
import { parseCents, parseHoursToMinutes, parseProjectForm } from "./project-form";

function form(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

describe("parseCents", () => {
  it("handles dollars and cents", () => {
    expect(parseCents("90")).toBe(9000);
    expect(parseCents("$125.50")).toBe(12550);
    expect(parseCents("1.5")).toBe(150);
  });
  it("rejects junk", () => {
    expect(parseCents("")).toBeNull();
    expect(parseCents("-4")).toBeNull();
    expect(parseCents("1.234")).toBeNull();
  });
});

describe("parseHoursToMinutes", () => {
  it("handles decimal and clock formats", () => {
    expect(parseHoursToMinutes("40")).toBe(2400);
    expect(parseHoursToMinutes("1.5")).toBe(90);
    expect(parseHoursToMinutes("12:30")).toBe(750);
  });
  it("rejects junk", () => {
    expect(parseHoursToMinutes("abc")).toBeNull();
    expect(parseHoursToMinutes("1:75")).toBeNull();
  });
});

describe("parseProjectForm", () => {
  const base = { clientId: "1", name: "Site", color: "#f59e0b" };
  it("requires a rate for hourly projects", () => {
    const r = parseProjectForm(form({ ...base, billing: "hourly", rate: "" }));
    expect(r.ok).toBe(false);
  });
  it("parses a fixed-fee project with a budget", () => {
    const r = parseProjectForm(form({ ...base, billing: "fixed", fixedFee: "6000", budget: "80" }));
    expect(r).toEqual({
      ok: true,
      data: { clientId: 1, name: "Site", billing: "fixed", rateCents: 0, budgetMinutes: 4800, fixedFeeCents: 600000, color: "#F59E0B" },
    });
  });
  it("ignores rate on non-hourly projects", () => {
    const r = parseProjectForm(form({ ...base, billing: "retainer", rate: "99" }));
    expect(r.ok && r.data.rateCents).toBe(0);
  });
});
