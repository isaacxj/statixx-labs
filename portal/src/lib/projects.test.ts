import { describe, expect, it } from "vitest";
import { parseProjectInput } from "./projects";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("parseProjectInput", () => {
  it("accepts a full project and empty dates", () => {
    expect(parseProjectInput(form({ name: " Site ", status: "at_risk", startsOn: "2026-10-01", dueOn: "" }))).toEqual({
      ok: true,
      value: { name: "Site", status: "at_risk", summary: "", startsOn: "2026-10-01", dueOn: null },
    });
  });
  it("rejects bad names, statuses and dates", () => {
    expect(parseProjectInput(form({ name: " " })).ok).toBe(false);
    expect(parseProjectInput(form({ name: "A", status: "nope" })).ok).toBe(false);
    expect(parseProjectInput(form({ name: "A", dueOn: "11/14/2026" })).ok).toBe(false);
    expect(parseProjectInput(form({ name: "A", dueOn: "2026-02-31x" })).ok).toBe(false);
  });
  it("rejects a due date before the start", () => {
    expect(parseProjectInput(form({ name: "A", startsOn: "2026-10-05", dueOn: "2026-10-01" })).ok).toBe(false);
  });
});
