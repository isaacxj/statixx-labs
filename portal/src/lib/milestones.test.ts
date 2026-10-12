import { describe, expect, it } from "vitest";
import { milestoneProgress, milestoneState, parseMilestoneInput, sortMilestones, todayInChicago } from "./milestones";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("parseMilestoneInput", () => {
  it("accepts a title with or without a due date", () => {
    expect(parseMilestoneInput(form({ title: " Design signed off ", dueOn: "2026-10-20" }))).toEqual({ ok: true, value: { title: "Design signed off", dueOn: "2026-10-20" } });
    expect(parseMilestoneInput(form({ title: "Launch" }))).toEqual({ ok: true, value: { title: "Launch", dueOn: null } });
  });
  it("rejects a blank title and a bad date", () => {
    expect(parseMilestoneInput(form({ title: " " })).ok).toBe(false);
    expect(parseMilestoneInput(form({ title: "A", dueOn: "10/20/2026" })).ok).toBe(false);
  });
});

describe("milestoneState", () => {
  it("is done when completed, even if late", () => {
    expect(milestoneState({ dueOn: "2026-01-01", doneOn: "2026-02-01" }, "2026-10-12")).toBe("done");
  });
  it("is overdue only after the due day", () => {
    expect(milestoneState({ dueOn: "2026-10-11", doneOn: null }, "2026-10-12")).toBe("overdue");
    expect(milestoneState({ dueOn: "2026-10-12", doneOn: null }, "2026-10-12")).toBe("upcoming");
    expect(milestoneState({ dueOn: null, doneOn: null }, "2026-10-12")).toBe("upcoming");
  });
});

describe("sortMilestones and progress", () => {
  it("orders by position, then due date, undated last", () => {
    const rows = [
      { id: 3, position: 1, dueOn: null },
      { id: 2, position: 1, dueOn: "2026-10-01" },
      { id: 1, position: 0, dueOn: "2026-12-01" },
    ];
    expect(sortMilestones(rows).map((r) => r.id)).toEqual([1, 2, 3]);
  });
  it("counts completed milestones", () => {
    expect(milestoneProgress([{ doneOn: "2026-10-01" }, { doneOn: null }])).toEqual({ done: 1, total: 2 });
  });
  it("reads the Chicago date", () => {
    expect(todayInChicago(new Date("2026-10-12T03:00:00Z"))).toBe("2026-10-11");
  });
});
