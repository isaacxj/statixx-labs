import { describe, expect, it } from "vitest";
import { likePattern, parseClientForm } from "./client-form";

function form(fields: Record<string, string>) {
  const d = new FormData();
  for (const [k, v] of Object.entries(fields)) d.set(k, v);
  return d;
}

describe("parseClientForm", () => {
  it("requires a name and trims fields", () => {
    expect(parseClientForm(form({ name: " " }))).toEqual({ ok: false, errors: { name: "Enter a name." } });
    const r = parseClientForm(form({ name: " Maria ", company: "", email: "m@x.co" }));
    expect(r).toEqual({ ok: true, value: { name: "Maria", company: null, email: "m@x.co", address: null } });
  });
  it("rejects a malformed email", () => {
    const r = parseClientForm(form({ name: "A", email: "nope" }));
    expect(r.ok).toBe(false);
  });
});

describe("likePattern", () => {
  it("escapes wildcards", () => {
    expect(likePattern(" 50%_a ")).toBe("%50\\%\\_a%");
  });
});
