import { describe, expect, it } from "vitest";
import { canSubmitRequest } from "./access";
import { groupByRequest } from "./files";
import { parseRequestInput, parseRequestStatus } from "./requests";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe("parseRequestInput", () => {
  it("trims the title and keeps optional details", () => {
    expect(parseRequestInput(form({ title: "  Swap hero photo ", body: "See attached\r\nthanks" }))).toEqual({
      ok: true,
      value: { title: "Swap hero photo", bodyMd: "See attached\nthanks" },
    });
    const bare = parseRequestInput(form({ title: "Add a page" }));
    expect(bare.ok && bare.value.bodyMd).toBe("");
  });
  it("rejects a blank or oversized title and oversized details", () => {
    expect(parseRequestInput(form({ title: "  " })).ok).toBe(false);
    expect(parseRequestInput(form({ title: "x".repeat(121) })).ok).toBe(false);
    expect(parseRequestInput(form({ title: "ok", body: "x".repeat(5001) })).ok).toBe(false);
  });
});

describe("parseRequestStatus", () => {
  it("accepts the three statuses only", () => {
    for (const s of ["open", "in_progress", "done"]) expect(parseRequestStatus(s).ok).toBe(true);
    expect(parseRequestStatus("closed").ok).toBe(false);
    expect(parseRequestStatus(null).ok).toBe(false);
  });
});

describe("canSubmitRequest", () => {
  it("allows viewers and approvers but not the team or unknown emails", () => {
    expect(canSubmitRequest({ kind: "client", email: "a@b.c", initials: "A", clientId: 1, clientName: "X", role: "viewer" })).toBe(true);
    expect(canSubmitRequest({ kind: "client", email: "a@b.c", initials: "A", clientId: 1, clientName: "X", role: "approver" })).toBe(true);
    expect(canSubmitRequest({ kind: "team", email: "t@b.c", initials: "T" })).toBe(false);
    expect(canSubmitRequest({ kind: "none", email: "n@b.c", initials: "N" })).toBe(false);
  });
});

describe("groupByRequest", () => {
  it("groups attachments by request in id order and skips unattached files", () => {
    const grouped = groupByRequest([
      { id: 3, requestId: 1 },
      { id: 1, requestId: 1 },
      { id: 2, requestId: null },
      { id: 4, requestId: 2 },
    ]);
    expect(grouped.get(1)?.map((f) => f.id)).toEqual([1, 3]);
    expect(grouped.get(2)?.map((f) => f.id)).toEqual([4]);
    expect(grouped.size).toBe(2);
  });
});
