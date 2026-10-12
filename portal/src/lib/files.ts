type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type FileKind = "image" | "pdf" | "document" | "sheet" | "archive" | "other";

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image",
  pdf: "pdf",
  doc: "document", docx: "document", txt: "document", md: "document", rtf: "document", pages: "document",
  xls: "sheet", xlsx: "sheet", csv: "sheet", numbers: "sheet",
  zip: "archive", gz: "archive", tar: "archive", "7z": "archive",
};

export function fileKind(name: string): FileKind {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return KIND_BY_EXTENSION[ext] ?? "other";
}

/** Strips path parts and control characters; falls back to "file" when nothing is left. */
export function safeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f"]/g, "").trim().slice(0, 150);
  return cleaned && cleaned !== "." && cleaned !== ".." ? cleaned : "file";
}

export function parseFileUpload(form: FormData): Result<File> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: `Files can be up to ${formatFileSize(MAX_FILE_BYTES)}.` };
  return { ok: true, value: file };
}

export const MAX_ATTACHMENTS = 5;

/** Optional attachments from a multi-file input named "attachments"; empty picks are ignored. */
export function parseAttachments(form: FormData): Result<File[]> {
  const picked = form.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  if (picked.length > MAX_ATTACHMENTS) return { ok: false, error: `Attach up to ${MAX_ATTACHMENTS} files per update.` };
  const tooBig = picked.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) return { ok: false, error: `${safeFileName(tooBig.name)} is over ${formatFileSize(MAX_FILE_BYTES)}.` };
  return { ok: true, value: picked };
}

/** Groups files by the update they are attached to, oldest first within an update; files without an update are left out. */
export function groupByUpdate<T extends { id: number; updateId: number | null }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    if (item.updateId == null) continue;
    map.set(item.updateId, [...(map.get(item.updateId) ?? []), item]);
  }
  for (const [id, list] of map) map.set(id, [...list].sort((a, b) => a.id - b.id));
  return map;
}

/** Groups files by the request they are attached to, oldest first within a request; files without a request are left out. */
export function groupByRequest<T extends { id: number; requestId: number | null }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    if (item.requestId == null) continue;
    map.set(item.requestId, [...(map.get(item.requestId) ?? []), item]);
  }
  for (const [id, list] of map) map.set(id, [...list].sort((a, b) => a.id - b.id));
  return map;
}

/** 1536 to "1.5 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[i]}`;
}
