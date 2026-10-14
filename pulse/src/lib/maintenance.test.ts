import { describe, expect, it } from "vitest";
import { centralToUtc, monitorsInMaintenance, parseWindowForm, windowState } from "./maintenance";

const w = { monitorId: 1, startsAt: "2026-10-14 10:00:00", endsAt: "2026-10-14 11:00:00" };
const at = (s: string) => Date.parse(`${s}Z`);

function form(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

describe("maintenance windows", () => {
  it("is upcoming, active, then past", () => {
    expect(windowState(w, at("2026-10-14 09:59:59"))).toBe("upcoming");
    expect(windowState(w, at("2026-10-14 10:00:00"))).toBe("active");
    expect(windowState(w, at("2026-10-14 10:59:59"))).toBe("active");
    expect(windowState(w, at("2026-10-14 11:00:00"))).toBe("past");
  });

  it("lists only monitors inside an active window", () => {
    const set = monitorsInMaintenance([w, { ...w, monitorId: 2, startsAt: "2026-10-14 12:00:00", endsAt: "2026-10-14 13:00:00" }], at("2026-10-14 10:30:00"));
    expect([...set]).toEqual([1]);
  });

  it("converts Central wall time to UTC across daylight saving", () => {
    expect(centralToUtc("2026-10-14T09:00")).toBe("2026-10-14 14:00:00"); // CDT, UTC-5
    expect(centralToUtc("2026-12-01T09:00")).toBe("2026-12-01 15:00:00"); // CST, UTC-6
    expect(centralToUtc("nope")).toBeNull();
  });

  it("validates the form", () => {
    const now = at("2026-10-14 12:00:00");
    const ok = parseWindowForm(form({ monitorId: "3", startsAt: "2026-10-15T01:00", endsAt: "2026-10-15T02:00", note: " Server upgrade " }), now);
    expect(ok).toEqual({ ok: true, value: { monitorId: 3, startsAt: "2026-10-15 06:00:00", endsAt: "2026-10-15 07:00:00", note: "Server upgrade" } });
    const bad = parseWindowForm(form({ monitorId: "", startsAt: "2026-10-15T02:00", endsAt: "2026-10-15T01:00" }), now);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["endsAt", "monitorId"]);
    const past = parseWindowForm(form({ monitorId: "1", startsAt: "2026-10-01T01:00", endsAt: "2026-10-01T02:00" }), now);
    expect(past.ok).toBe(false);
  });
});
