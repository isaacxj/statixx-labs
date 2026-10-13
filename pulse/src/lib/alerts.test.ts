import { describe, expect, it } from "vitest";
import { alertContent, parseRecipient, rawEmail } from "./alerts";

const incident = { title: "API is down: Timed out", monitorName: "API", url: "https://api.example.com", startedAt: "2026-10-13 10:00:00", resolvedAt: "2026-10-13 10:12:00" };

describe("alerts", () => {
  it("writes a down email naming the monitor and start time", () => {
    const { subject, text } = alertContent("down", incident);
    expect(subject).toBe("[Down] API");
    expect(text).toContain("https://api.example.com");
    expect(text).toContain("2026-10-13 10:00:00 UTC");
  });

  it("writes a recovered email with both times", () => {
    const { subject, text } = alertContent("recovered", incident);
    expect(subject).toBe("[Recovered] API");
    expect(text).toContain("Recovered: 2026-10-13 10:12:00 UTC");
  });

  it("normalizes and validates recipients", () => {
    expect(parseRecipient("  Isaac@Example.com ")).toEqual({ ok: true, email: "isaac@example.com" });
    expect(parseRecipient("nope").ok).toBe(false);
    expect(parseRecipient("").ok).toBe(false);
  });

  it("builds a header-safe raw message", () => {
    const raw = rawEmail("pulse@example.com", "a@b.co", "Hi\r\nBcc: x@y.z", "Body", "id1@pulse", new Date(0));
    expect(raw).toContain("Subject: Hi Bcc: x@y.z\r\n");
    expect(raw).not.toMatch(/^Bcc:/m);
  });
});
