import { describe, expect, it } from "vitest";
import { buildDigestMime, parseRecipients } from "./digest-email";

describe("parseRecipients", () => {
  it("trims, lower-cases, drops blanks and duplicates", () => {
    expect(parseRecipients(" A@x.com, b@x.com,,a@X.com ,nope")).toEqual(["a@x.com", "b@x.com"]);
    expect(parseRecipients(undefined)).toEqual([]);
  });
});

describe("buildDigestMime", () => {
  const base = { from: "portal@x.com", to: "a@x.com", subject: "Portal digest: 1 new request", text: "New requests\n- Acme / Site: Logo – café", date: new Date("2026-10-12T13:00:00Z"), messageId: "1@x.com" };
  it("encodes the subject and body as UTF-8 and keeps headers on one line", () => {
    const mime = buildDigestMime({ ...base, subject: "Hi\r\nBcc: evil@x.com" });
    const [head, body] = mime.split("\r\n\r\n");
    expect(head).not.toMatch(/\r\nBcc:/);
    expect(head).toContain("Date: Mon, 12 Oct 2026 13:00:00 GMT");
    expect(head).toContain("To: a@x.com");
    expect(Buffer.from(body.replace(/\r\n/g, ""), "base64").toString("utf8")).toBe(base.text);
  });
  it("wraps the body at 76 characters", () => {
    const mime = buildDigestMime({ ...base, text: "x".repeat(500) });
    for (const l of mime.split("\r\n\r\n")[1].split("\r\n")) expect(l.length).toBeLessThanOrEqual(76);
  });
});
