import { describe, expect, it } from "vitest";
import { parseIncidentForm, parseUpdateForm } from "./incident-form";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe("parseUpdateForm", () => {
  it("accepts a status and message", () => {
    expect(parseUpdateForm(form({ status: "identified", body: "  Found the cause. " }))).toEqual({ ok: true, value: { status: "identified", body: "Found the cause." } });
  });
  it("rejects an unknown status and an empty message", () => {
    const r = parseUpdateForm(form({ status: "fixed", body: " " }));
    expect(r).toMatchObject({ ok: false, errors: { status: expect.any(String), body: expect.any(String) } });
  });
});

describe("parseIncidentForm", () => {
  it("accepts a complete incident", () => {
    const r = parseIncidentForm(form({ title: "Slow bookings", monitorId: "2", status: "investigating", body: "Looking into it." }));
    expect(r).toEqual({ ok: true, value: { title: "Slow bookings", monitorId: 2, status: "investigating", body: "Looking into it." } });
  });
  it("requires a title and a component", () => {
    const r = parseIncidentForm(form({ title: "", monitorId: "", status: "investigating", body: "x" }));
    expect(r).toMatchObject({ ok: false, errors: { title: expect.any(String), monitorId: expect.any(String) } });
  });
});
