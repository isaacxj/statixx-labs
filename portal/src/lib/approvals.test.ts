import { describe, expect, it } from "vitest";
import { parseApprovalDecision, parseApprovalInput } from "./approvals";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe("parseApprovalInput", () => {
  it("accepts a title with an optional file", () => {
    expect(parseApprovalInput(form({ title: " Homepage v2 ", description: "", fileId: "4" }))).toEqual({
      ok: true,
      value: { title: "Homepage v2", descriptionMd: "", fileId: 4 },
    });
    const none = parseApprovalInput(form({ title: "Logo", fileId: "" }));
    expect(none.ok && none.value.fileId).toBe(null);
  });
  it("rejects a missing title and a bad file id", () => {
    expect(parseApprovalInput(form({ title: "  " })).ok).toBe(false);
    expect(parseApprovalInput(form({ title: "x", fileId: "abc" })).ok).toBe(false);
  });
});

describe("parseApprovalDecision", () => {
  it("approves with or without a comment", () => {
    expect(parseApprovalDecision(form({ decision: "approve", comment: "" }))).toEqual({ ok: true, value: { status: "approved", comment: "" } });
  });
  it("requires a comment when asking for changes", () => {
    expect(parseApprovalDecision(form({ decision: "changes", comment: " " })).ok).toBe(false);
    expect(parseApprovalDecision(form({ decision: "changes", comment: "Bigger logo" }))).toEqual({ ok: true, value: { status: "changes_requested", comment: "Bigger logo" } });
  });
  it("rejects an unknown choice", () => {
    expect(parseApprovalDecision(form({ decision: "maybe" })).ok).toBe(false);
  });
});
