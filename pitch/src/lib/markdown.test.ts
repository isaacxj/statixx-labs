import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown } from "./markdown";

describe("parseMarkdown", () => {
  it("groups lines into paragraphs, headings and lists", () => {
    const blocks = parseMarkdown("# Title\n\nOne\ntwo\n\n- a\n- b\n\n1. x\n2. y");
    expect(blocks.map((b) => b.t)).toEqual(["h", "p", "ul", "ol"]);
    expect(blocks[1]).toEqual({ t: "p", inline: [{ t: "text", v: "One two" }] });
    expect(blocks[2]).toMatchObject({ t: "ul", items: [[{ t: "text", v: "a" }], [{ t: "text", v: "b" }]] });
  });
});

describe("parseInline", () => {
  it("handles bold, italic, code and links", () => {
    expect(parseInline("a **b** *c* `d`")).toEqual([
      { t: "text", v: "a " },
      { t: "strong", v: "b" },
      { t: "text", v: " " },
      { t: "em", v: "c" },
      { t: "text", v: " " },
      { t: "code", v: "d" },
    ]);
  });
  it("drops unsafe link targets but keeps the text", () => {
    expect(parseInline("[hi](javascript:alert)")).toEqual([{ t: "text", v: "hi" }]);
    expect(parseInline("[hi](https://x.test)")).toEqual([{ t: "link", v: "hi", href: "https://x.test" }]);
  });
});
