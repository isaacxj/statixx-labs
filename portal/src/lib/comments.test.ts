import { describe, expect, it } from "vitest";
import { COMMENT_MAX, commentKey, groupComments, parseCommentInput, parseCommentParentType } from "./comments";
import type { Comment } from "@/server/db/schema";

const form = (body: string) => {
  const f = new FormData();
  f.set("body", body);
  return f;
};

const comment = (id: number, parentType: Comment["parentType"], parentId: number, createdAt: string): Comment => ({
  id, parentType, parentId, authorEmail: "a@x.com", bodyMd: `c${id}`, createdAt, updatedAt: createdAt,
});

describe("parseCommentInput", () => {
  it("trims and normalises line breaks", () => {
    expect(parseCommentInput(form("  hi\r\nthere "))).toEqual({ ok: true, value: "hi\nthere" });
  });
  it("rejects empty and oversized comments", () => {
    expect(parseCommentInput(form("   ")).ok).toBe(false);
    expect(parseCommentInput(form("x".repeat(COMMENT_MAX + 1))).ok).toBe(false);
  });
});

describe("parseCommentParentType", () => {
  it("accepts approvals and requests only", () => {
    expect(parseCommentParentType("request")).toEqual({ ok: true, value: "request" });
    expect(parseCommentParentType("update").ok).toBe(false);
  });
});

describe("groupComments", () => {
  it("groups per parent in chronological order", () => {
    const grouped = groupComments([
      comment(3, "request", 1, "2026-10-12 10:05:00"),
      comment(1, "request", 1, "2026-10-12 10:00:00"),
      comment(2, "approval", 1, "2026-10-12 10:01:00"),
    ]);
    expect(grouped.get(commentKey("request", 1))?.map((c) => c.id)).toEqual([1, 3]);
    expect(grouped.get(commentKey("approval", 1))?.map((c) => c.id)).toEqual([2]);
  });
});
