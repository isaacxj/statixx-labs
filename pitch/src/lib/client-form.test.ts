import { describe, expect, it } from "vitest";
import { likePattern, parseClientForm } from "./client-form";

const form = (o: Record<string, string>) => new Map(Object.entries(o)) as unknown as { get(k: string): string | null };

describe("parseClientForm", () => {
  it("trims values and nulls blanks", () => {
    const r = parseClientForm(form({ name: " Ada ", company: "", email: "ada@x.io", phone: " ", address: "" }));
    expect(r).toEqual({ value: { name: "Ada", company: null, email: "ada@x.io", phone: null, address: null } });
  });
  it("requires a name and a valid email", () => {
    const r = parseClientForm(form({ name: "", email: "nope" }));
    expect("errors" in r && Object.keys(r.errors).sort()).toEqual(["email", "name"]);
  });
});

describe("likePattern", () => {
  it("escapes wildcards", () => {
    expect(likePattern(" 50%_a ")).toBe("%50\\%\\_a%");
  });
});
