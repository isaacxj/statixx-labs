import { Fragment } from "react";
import { parseMarkdown, type Inline } from "@/lib/markdown";

function Inlines({ nodes }: { nodes: Inline[] }) {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "strong": return <strong key={i}>{n.v}</strong>;
      case "em": return <em key={i}>{n.v}</em>;
      case "code": return <code key={i} className="bg-muted rounded-sm px-1 font-mono text-[13px]">{n.v}</code>;
      case "link": return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{n.v}</a>;
      default: return <Fragment key={i}>{n.v}</Fragment>;
    }
  });
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      {parseMarkdown(source).map((b, i) => {
        if (b.t === "h") {
          const cls = b.level === 1 ? "text-xl font-semibold" : b.level === 2 ? "text-base font-semibold" : "text-sm font-semibold";
          return <p key={i} role="heading" aria-level={b.level + 1} className={cls}><Inlines nodes={b.inline} /></p>;
        }
        if (b.t === "p") return <p key={i}><Inlines nodes={b.inline} /></p>;
        const List = b.t;
        return (
          <List key={i} className={b.t === "ul" ? "list-disc pl-5" : "list-decimal pl-5"}>
            {b.items.map((it, j) => <li key={j}><Inlines nodes={it} /></li>)}
          </List>
        );
      })}
    </div>
  );
}
