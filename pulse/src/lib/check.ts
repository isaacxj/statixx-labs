export type CheckTarget = {
  url: string;
  method: string;
  timeoutMs: number;
  expectedStatus: number;
  keyword: string;
};

export type CheckResult = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
};

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

// Runs one HTTP check. Never throws: every failure becomes a result with an error message.
export async function runCheck(target: CheckTarget, fetcher: FetchLike = fetch, now: () => number = Date.now): Promise<CheckResult> {
  const started = now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), target.timeoutMs);
  try {
    const res = await fetcher(target.url, { method: target.method, signal: controller.signal, redirect: "follow" });
    const latencyMs = Math.round(now() - started);
    if (res.status !== target.expectedStatus) {
      await res.body?.cancel();
      return { ok: false, statusCode: res.status, latencyMs, error: `Unexpected status ${res.status}` };
    }
    if (target.keyword && target.method !== "HEAD") {
      const body = await res.text();
      if (!body.includes(target.keyword)) {
        return { ok: false, statusCode: res.status, latencyMs, error: `Keyword "${target.keyword}" not found` };
      }
    } else {
      await res.body?.cancel();
    }
    return { ok: true, statusCode: res.status, latencyMs, error: null };
  } catch (err) {
    if (controller.signal.aborted) return { ok: false, statusCode: null, latencyMs: null, error: `Timed out after ${target.timeoutMs} ms` };
    const message = err instanceof Error ? err.message : "Request failed";
    return { ok: false, statusCode: null, latencyMs: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}

// SQLite datetime('now') format, UTC.
export function toSqlTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

export function nextCheckTime(nowMs: number, intervalSec: number): string {
  return toSqlTime(nowMs + intervalSec * 1000);
}
