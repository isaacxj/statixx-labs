"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { addSectionAction, deleteSectionAction, moveSectionAction, saveSectionAction } from "@/app/proposals/[id]/actions";

type Item = { id: number; title: string; bodyMd: string };
type Save = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 700;
const saveLabel: Record<Save, string> = { saved: "Saved", dirty: "Unsaved changes", saving: "Saving…", error: "Couldn't save. Retrying on next edit." };

export function SectionEditor({ proposalId, initial }: { proposalId: number; initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(() => initial.map(({ id, title, bodyMd }) => ({ id, title, bodyMd })));
  const [selectedId, setSelectedId] = useState<number | null>(initial[0]?.id ?? null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [save, setSave] = useState<Save>("saved");
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(items);
  useEffect(() => { latest.current = items; }, [items]);
  const dirtyId = useRef<number | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const id = dirtyId.current;
    const item = latest.current.find((i) => i.id === id);
    if (!id || !item) return;
    dirtyId.current = null;
    setSave("saving");
    try {
      await saveSectionAction(proposalId, id, item.title, item.bodyMd);
      setSave(dirtyId.current ? "dirty" : "saved");
    } catch {
      dirtyId.current = id;
      setSave("error");
    }
  }, [proposalId]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const edit = (patch: Partial<Item>) => {
    if (!selected) return;
    setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
    dirtyId.current = selected.id;
    setSave("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  };

  const apply = (next: Item[]) => setItems(next.map(({ id, title, bodyMd }) => ({ id, title, bodyMd })));

  const structural = (run: () => Promise<void>) =>
    startTransition(async () => {
      await flush();
      await run();
    });

  const select = (id: number) => {
    structural(async () => setSelectedId(id));
  };

  return (
    <div className="grid items-start gap-6 md:grid-cols-[16rem_1fr]">
      <aside aria-label="Section outline" className="bg-card flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Sections</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              structural(async () => {
                const res = await addSectionAction(proposalId);
                apply(res.sections);
                if (res.addedId) setSelectedId(res.addedId);
                setMode("write");
              })
            }
          >
            <Plus />Add text
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground px-1 py-2 text-sm">No sections yet. Add the first one.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {items.map((it, idx) => (
              <li key={it.id} className={cn("group flex items-center gap-1 rounded-sm", it.id === selectedId && "bg-accent")}>
                <button
                  type="button"
                  onClick={() => select(it.id)}
                  aria-current={it.id === selectedId ? "true" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm max-md:min-h-11"
                >
                  <span className="tabular text-muted-foreground text-xs">{idx + 1}</span>
                  <span className="truncate">{it.title || "Untitled section"}</span>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 max-md:size-11"
                  aria-label={`Move ${it.title || "section"} up`}
                  disabled={idx === 0}
                  onClick={() => structural(async () => apply((await moveSectionAction(proposalId, it.id, -1)).sections))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 max-md:size-11"
                  aria-label={`Move ${it.title || "section"} down`}
                  disabled={idx === items.length - 1}
                  onClick={() => structural(async () => apply((await moveSectionAction(proposalId, it.id, 1)).sections))}
                >
                  <ArrowDown />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </aside>

      <section aria-label="Section editor" className="bg-card flex min-w-0 flex-col gap-4 rounded-md border p-4">
        {selected ? (
          <>
            <div className="flex items-center gap-3">
              <Input value={selected.title} onChange={(e) => edit({ title: e.target.value })} placeholder="Section title" aria-label="Section title" maxLength={120} className="font-medium" />
              <Button
                size="icon"
                variant="ghost"
                aria-label="Delete section"
                onClick={() => {
                  if (!window.confirm(`Delete "${selected.title || "Untitled section"}"?`)) return;
                  const gone = selected.id;
                  dirtyId.current = null;
                  structural(async () => {
                    const res = await deleteSectionAction(proposalId, gone);
                    apply(res.sections);
                    setSelectedId(res.sections[0]?.id ?? null);
                  });
                }}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div role="tablist" aria-label="Editor mode" className="bg-muted inline-flex rounded-sm p-0.5">
                {(["write", "preview"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    type="button"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={cn("h-8 rounded-sm px-3 text-sm capitalize transition-colors duration-150 max-md:h-11", mode === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p role="status" aria-live="polite" className={cn("text-xs", save === "error" ? "text-destructive" : "text-muted-foreground")}>{saveLabel[save]}</p>
            </div>
            {mode === "write" ? (
              <textarea
                value={selected.bodyMd}
                onChange={(e) => edit({ bodyMd: e.target.value })}
                aria-label="Section body (markdown)"
                placeholder="Write in markdown: # headings, **bold**, - lists, [links](https://…)"
                rows={14}
                className="border-input bg-card focus-visible:ring-ring min-h-64 w-full resize-y rounded-sm border p-3 font-mono text-[13px] leading-relaxed outline-none focus-visible:ring-2"
              />
            ) : (
              <div className="min-h-64 rounded-sm border p-4">
                {selected.bodyMd.trim() ? <Markdown source={selected.bodyMd} /> : <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-start gap-3 p-2">
            <p className="font-medium">This proposal has no sections.</p>
            <Button
              onClick={() =>
                structural(async () => {
                  const res = await addSectionAction(proposalId);
                  apply(res.sections);
                  if (res.addedId) setSelectedId(res.addedId);
                })
              }
            >
              <Plus />Add the first section
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
