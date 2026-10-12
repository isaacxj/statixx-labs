import { describe, expect, it } from "vitest";
import { MAX_ATTACHMENTS, MAX_FILE_BYTES, fileKind, formatFileSize, groupByUpdate, parseAttachments, parseFileUpload, safeFileName } from "./files";

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
  it("parses attachments, ignoring empty picks and capping the count", () => {
    const none = new FormData();
    none.append("attachments", new File([], ""));
    expect(parseAttachments(none)).toEqual({ ok: true, value: [] });
    const two = new FormData();
    two.append("attachments", new File(["a"], "a.txt"));
    two.append("attachments", new File(["b"], "b.txt"));
    const parsed = parseAttachments(two);
    expect(parsed.ok && parsed.value.length).toBe(2);
    const many = new FormData();
    for (let i = 0; i <= MAX_ATTACHMENTS; i++) many.append("attachments", new File(["x"], `f${i}.txt`));
    expect(parseAttachments(many).ok).toBe(false);
  });
  it("groups files by update", () => {
    const grouped = groupByUpdate([{ id: 4, updateId: 1, n: "c" }, { id: 3, updateId: null, n: "b" }, { id: 2, updateId: 1, n: "a" }, { id: 1, updateId: 2, n: "d" }]);
    expect(grouped.get(1)?.map((f) => f.n)).toEqual(["a", "c"]);
    expect(grouped.get(2)?.length).toBe(1);
    expect(grouped.size).toBe(2);
  });
});
