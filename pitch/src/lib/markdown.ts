export type Inline =
  | { t: "text"; v: string }
  | { t: "strong" | "em" | "code"; v: string }
  | { t: "link"; v: string; href: string };

export type Block =
  | { t: "p"; inline: Inline[] }
  | { t: "h"; level: 1 | 2 | 3; inline: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] };

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  for (const part of src.split(INLINE)) {
    if (!part) continue;
    let m: RegExpMatchArray | null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) out.push({ t: "strong", v: part.slice(2, -2) });
    else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) out.push({ t: "code", v: part.slice(1, -1) });
    else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) out.push({ t: "em", v: part.slice(1, -1) });
    else if ((m = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/))) {
      out.push(SAFE_HREF.test(m[2]) ? { t: "link", v: m[1], href: m[2] } : { t: "text", v: m[1] });
    } else out.push({ t: "text", v: part });
  }
  return out;
}

/** A small, script-free markdown subset: headings, lists, paragraphs, bold, italic, code, links. */
export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: Inline[][] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", inline: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  for (const raw of src.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      blocks.push({ t: "h", level: h[1].length as 1 | 2 | 3, inline: parseInline(h[2]) });
    } else if (ul || ol) {
      flushPara();
      const kind = ul ? "ul" : "ol";
      if (list && list.t !== kind) flushList();
      list ??= { t: kind, items: [] };
      list.items.push(parseInline((ul ?? ol)![1]));
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}
