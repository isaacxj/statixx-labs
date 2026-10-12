import { describe, expect, it } from "vitest";
import { UPDATE_MAX_LENGTH, formatPostedAt, parseUpdateInput } from "./updates";

const form = (body: string) => {
  const f = new FormData();
  f.set("body", body);
  return f;
};

describe("parseUpdateInput", () => {
  it("trims and accepts markdown", () => {
    expect(parseUpdateInput(form("  Hello **there**\r\n- one  "))).toEqual({ ok: true, value: "Hello **there**\n- one" });
  });
  it("rejects empty and oversized bodies", () => {
    expect(parseUpdateInput(form("   ")).ok).toBe(false);
    expect(parseUpdateInput(form("x".repeat(UPDATE_MAX_LENGTH + 1))).ok).toBe(false);
  });
});

describe("formatPostedAt", () => {
  it("shows stored UTC time in Chicago", () => {
    expect(formatPostedAt("2026-10-09 15:10:00")).toBe("Oct 9, 2026, 10:10 AM");
  });
});
