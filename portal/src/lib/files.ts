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
