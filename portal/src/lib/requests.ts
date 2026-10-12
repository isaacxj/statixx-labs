import { REQUEST_STATUSES, type RequestStatus } from "@/server/db/schema";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const REQUEST_TITLE_MAX = 120;
export const REQUEST_TEXT_MAX = 5000;

export const REQUEST_LABELS: Record<RequestStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

export const REQUEST_TONES: Record<RequestStatus, "info" | "warning" | "success"> = {
  open: "info",
  in_progress: "warning",
  done: "success",
};

export type RequestInput = { title: string; bodyMd: string };

export function parseRequestInput(form: FormData): Result<RequestInput> {
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Give your request a title." };
  if (title.length > REQUEST_TITLE_MAX) return { ok: false, error: `Titles can be up to ${REQUEST_TITLE_MAX} characters.` };
  const bodyMd = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (bodyMd.length > REQUEST_TEXT_MAX) return { ok: false, error: `Details can be up to ${REQUEST_TEXT_MAX.toLocaleString("en-US")} characters.` };
  return { ok: true, value: { title, bodyMd } };
}

export function parseRequestStatus(raw: unknown): Result<RequestStatus> {
  const value = String(raw ?? "");
  const status = REQUEST_STATUSES.find((s) => s === value);
  return status ? { ok: true, value: status } : { ok: false, error: "Choose a status for the request." };
}
