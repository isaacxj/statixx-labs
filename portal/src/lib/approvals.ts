import type { ApprovalStatus } from "@/server/db/schema";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const APPROVAL_TITLE_MAX = 120;
export const APPROVAL_TEXT_MAX = 5000;

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: "Waiting on client",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export const APPROVAL_TONES: Record<ApprovalStatus, "info" | "success" | "warning"> = {
  pending: "info",
  approved: "success",
  changes_requested: "warning",
};

export type ApprovalInput = { title: string; descriptionMd: string; fileId: number | null };

export function parseApprovalInput(form: FormData): Result<ApprovalInput> {
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Give the approval a title." };
  if (title.length > APPROVAL_TITLE_MAX) return { ok: false, error: `Titles can be up to ${APPROVAL_TITLE_MAX} characters.` };
  const descriptionMd = String(form.get("description") ?? "").replace(/\r\n/g, "\n").trim();
  if (descriptionMd.length > APPROVAL_TEXT_MAX) return { ok: false, error: `Descriptions can be up to ${APPROVAL_TEXT_MAX.toLocaleString("en-US")} characters.` };
  const rawFile = String(form.get("fileId") ?? "").trim();
  const fileId = rawFile === "" ? null : Number(rawFile);
  if (fileId !== null && !Number.isInteger(fileId)) return { ok: false, error: "Choose a file from the list." };
  return { ok: true, value: { title, descriptionMd, fileId } };
}

export type ApprovalDecision = { status: "approved" | "changes_requested"; comment: string };

/** "approve" needs no comment; asking for changes must say what to change. */
export function parseApprovalDecision(form: FormData): Result<ApprovalDecision> {
  const choice = String(form.get("decision") ?? "");
  const comment = String(form.get("comment") ?? "").replace(/\r\n/g, "\n").trim();
  if (comment.length > APPROVAL_TEXT_MAX) return { ok: false, error: `Comments can be up to ${APPROVAL_TEXT_MAX.toLocaleString("en-US")} characters.` };
  if (choice === "approve") return { ok: true, value: { status: "approved", comment } };
  if (choice === "changes") {
    if (!comment) return { ok: false, error: "Say what needs to change." };
    return { ok: true, value: { status: "changes_requested", comment } };
  }
  return { ok: false, error: "Choose Approve or Request changes." };
}
