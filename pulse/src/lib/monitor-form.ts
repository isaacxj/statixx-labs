import { HTTP_METHODS } from "@/server/db/schema";

export const INTERVALS = [
  { sec: 60, label: "1 minute" },
  { sec: 300, label: "5 minutes" },
  { sec: 900, label: "15 minutes" },
] as const;

export type MonitorInput = {
  name: string;
  client: string;
  url: string;
  method: (typeof HTTP_METHODS)[number];
  intervalSec: number;
  timeoutMs: number;
  expectedStatus: number;
  keyword: string;
};

export type MonitorFormResult =
  | { ok: true; value: MonitorInput }
  | { ok: false; errors: Partial<Record<keyof MonitorInput, string>> };

export function parseMonitorForm(form: FormData): MonitorFormResult {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const errors: Partial<Record<keyof MonitorInput, string>> = {};

  const name = text("name");
  if (!name) errors.name = "Give the monitor a name.";

  let url = text("url");
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") throw new Error("host");
  } catch {
    errors.url = "Enter a valid http or https URL.";
  }

  const method = text("method") as MonitorInput["method"];
  if (!HTTP_METHODS.includes(method)) errors.method = "Choose GET, HEAD, or POST.";

  const intervalSec = Number(text("intervalSec"));
  if (!INTERVALS.some((i) => i.sec === intervalSec)) errors.intervalSec = "Choose 1, 5, or 15 minutes.";

  const timeoutMs = Number(text("timeoutMs"));
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 30000) errors.timeoutMs = "Timeout must be 1000 to 30000 ms.";

  const expectedStatus = Number(text("expectedStatus"));
  if (!Number.isInteger(expectedStatus) || expectedStatus < 100 || expectedStatus > 599) errors.expectedStatus = "Use a status code from 100 to 599.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, client: text("client"), url, method, intervalSec, timeoutMs, expectedStatus, keyword: text("keyword") } };
}
