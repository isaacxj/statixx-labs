import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, fileKind, formatFileSize, parseFileUpload, safeFileName } from "./files";

describe("files", () => {
  it("formats sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(25 * 1024 * 1024)).toBe("25 MB");
  });
  it("picks a kind from the extension", () => {
    expect(fileKind("Logo.PNG")).toBe("image");
    expect(fileKind("brief.pdf")).toBe("pdf");
    expect(fileKind("noext")).toBe("other");
  });
  it("cleans file names", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\x\\a\"b.txt")).toBe("ab.txt");
    expect(safeFileName("..")).toBe("file");
  });
  it("rejects missing and oversized files", () => {
    const empty = new FormData();
    expect(parseFileUpload(empty).ok).toBe(false);
    const ok = new FormData();
    ok.set("file", new File(["hi"], "a.txt"));
    expect(parseFileUpload(ok).ok).toBe(true);
    const big = new FormData();
    const huge = new File(["x"], "big.bin");
    Object.defineProperty(huge, "size", { value: MAX_FILE_BYTES + 1 });
    big.set("file", huge);
    expect(parseFileUpload(big).ok).toBe(false);
  });
});
