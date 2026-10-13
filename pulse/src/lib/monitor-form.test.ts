import { describe, expect, it } from "vitest";
import { parseMonitorForm } from "./monitor-form";

function form(over: Record<string, string> = {}) {
  const f = new FormData();
  const base = { name: "Site", client: "Acme", url: "acme.example", method: "GET", intervalSec: "300", timeoutMs: "10000", expectedStatus: "200", keyword: "" };
  for (const [k, v] of Object.entries({ ...base, ...over })) f.set(k, v);
  return f;
}

describe("parseMonitorForm", () => {
  it("accepts a valid monitor and adds https to a bare host", () => {
    const r = parseMonitorForm(form());
    expect(r.ok && r.value.url).toBe("https://acme.example");
  });

  it("reports each invalid field", () => {
    const r = parseMonitorForm(form({ name: " ", url: "nope", intervalSec: "7", timeoutMs: "5", expectedStatus: "999" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["expectedStatus", "intervalSec", "name", "timeoutMs", "url"]);
  });
});
