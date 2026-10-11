import { describe, expect, it } from "vitest";
import { recentQuickStarts } from "./quick-start";

const e = (projectId: number, description = "") => ({ projectId, projectName: `P${projectId}`, clientName: "C", color: "#000", description });

describe("recentQuickStarts", () => {
  it("keeps the newest of each project and description pair", () => {
    const out = recentQuickStarts([e(1, "a"), e(2), e(1, "a"), e(1, "b")]);
    expect(out.map((x) => `${x.projectId}${x.description}`)).toEqual(["1a", "2", "1b"]);
  });
  it("stops at the limit", () => {
    expect(recentQuickStarts([e(1), e(2), e(3)], 2)).toHaveLength(2);
  });
  it("returns nothing for no entries", () => {
    expect(recentQuickStarts([])).toEqual([]);
  });
});
