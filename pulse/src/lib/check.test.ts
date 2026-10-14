import { describe, expect, it } from "vitest";
import { nextCheckTime, runCheck, type CheckTarget } from "./check";

const target: CheckTarget = { url: "http://test.local/", method: "GET", timeoutMs: 50, expectedStatus: 200, keyword: "" };
const reply = (body: string, status = 200) => async () => new Response(body, { status });

describe("runCheck", () => {
  it("passes on the expected status", async () => {
    const r = await runCheck(target, reply("hello"));
    expect(r).toMatchObject({ ok: true, statusCode: 200, error: null });
    expect(r.latencyMs).not.toBeNull();
  });

  it("fails on an unexpected status", async () => {
    const r = await runCheck(target, reply("nope", 503));
    expect(r).toMatchObject({ ok: false, statusCode: 503, error: "Unexpected status 503" });
  });

  it("checks the keyword", async () => {
    expect((await runCheck({ ...target, keyword: "Book now" }, reply("<a>Book now</a>"))).ok).toBe(true);
    const miss = await runCheck({ ...target, keyword: "Book now" }, reply("<a>Oops</a>"));
    expect(miss).toMatchObject({ ok: false, error: 'Keyword "Book now" not found' });
  });

  it("times out", async () => {
    const hang = (_u: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
    expect(await runCheck(target, hang)).toMatchObject({ ok: false, statusCode: null, error: "Timed out after 50 ms" });
  });

  it("reports network errors", async () => {
    const down = async () => {
      throw new Error("connection refused");
    };
    expect(await runCheck(target, down)).toMatchObject({ ok: false, error: "connection refused" });
  });
});

describe("nextCheckTime", () => {
  it("adds the interval in SQL datetime format", () => {
    expect(nextCheckTime(Date.UTC(2026, 9, 12, 18, 0, 0), 300)).toBe("2026-10-12 18:05:00");
  });
});
