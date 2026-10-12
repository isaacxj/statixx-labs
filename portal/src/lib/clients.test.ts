import { describe, expect, it } from "vitest";
import { parseClientInput, parseClientUserInput, slugify } from "./clients";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("clients input", () => {
  it("slugifies names", () => {
    expect(slugify("Park & Sons Roofing")).toBe("park-and-sons-roofing");
    expect(slugify("  Northwind  Dental! ")).toBe("northwind-dental");
  });
  it("validates a client", () => {
    expect(parseClientInput(form({ name: "Acme", accent: "#abcdef" }))).toEqual({
      ok: true,
      value: { name: "Acme", slug: "acme", accent: "#ABCDEF" },
    });
    expect(parseClientInput(form({ name: " ", accent: "#abcdef" })).ok).toBe(false);
    expect(parseClientInput(form({ name: "Acme", accent: "blue" })).ok).toBe(false);
  });
  it("validates a client user", () => {
    expect(parseClientUserInput(form({ email: " Jo@Acme.com ", name: "Jo", role: "approver" }))).toEqual({
      ok: true,
      value: { email: "jo@acme.com", name: "Jo", role: "approver" },
    });
    expect(parseClientUserInput(form({ email: "nope", role: "viewer" })).ok).toBe(false);
    expect(parseClientUserInput(form({ email: "a@b.co", role: "admin" })).ok).toBe(false);
  });
});
