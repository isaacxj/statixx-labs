"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CornerDownLeft, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { GO_KEYS, GROUP_ORDER, SHORTCUTS, filterItems, isTypingTarget, type PaletteItem } from "@/lib/palette";
import { NAV_ITEMS } from "./nav";

export const OPEN_PALETTE_EVENT = "ledger:open-palette";

const PAGE_ITEMS: PaletteItem[] = NAV_ITEMS.map((n) => ({ id: `page:${n.href}`, group: "Pages", label: n.label, href: n.href }));

const ACTION_ITEMS: PaletteItem[] = [
  { id: "act:new-invoice", group: "Actions", label: "New invoice", href: "/invoices/new", shortcut: "C" },
  { id: "act:new-retainer", group: "Actions", label: "New retainer", href: "/retainers/new" },
];

/** Controls on the current page that the palette can trigger, found by their data-shortcut attribute. */
const PAGE_ACTIONS: { key: string; item: PaletteItem }[] = [
  { key: "mark-sent", item: { id: "act:mark-sent", group: "Actions", label: "Mark invoice as sent", click: '[data-shortcut="mark-sent"]', shortcut: "S" } },
  { key: "record-payment", item: { id: "act:record-payment", group: "Actions", label: "Record payment", click: '[data-shortcut="record-payment"]', shortcut: "P" } },
];

export type PaletteRecord = { id: number; label: string; hint: string };

export function CommandPalette({ invoices, clients }: { invoices: PaletteRecord[]; clients: PaletteRecord[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const help = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pageActions, setPageActions] = useState<PaletteItem[]>([]);
  const goPending = useRef<number | null>(null);

  const all = useMemo<PaletteItem[]>(
    () => [
      ...pageActions,
      ...ACTION_ITEMS,
      ...PAGE_ITEMS,
      ...invoices.map((i) => ({ id: `inv:${i.id}`, group: "Invoices" as const, label: i.label, hint: i.hint, href: `/invoices/${i.id}` })),
      ...clients.map((c) => ({ id: `cli:${c.id}`, group: "Clients" as const, label: c.label, hint: c.hint, href: `/clients/${c.id}` })),
    ],
    [pageActions, invoices, clients],
  );
  const results = useMemo(() => filterItems(all, query), [all, query]);

  function open() {
    setPageActions(PAGE_ACTIONS.filter((a) => document.querySelector(a.item.click!)).map((a) => a.item));
    setQuery("");
    setActive(0);
    if (!dialog.current?.open) dialog.current?.showModal();
  }

  function run(item: PaletteItem) {
    dialog.current?.close();
    if (item.click) document.querySelector<HTMLElement>(item.click)?.click();
    else if (item.href) router.push(item.href);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target as HTMLElement) || document.querySelector("dialog[open]")) return;
      const key = e.key.toLowerCase();
      const waitingForGo = goPending.current !== null && Date.now() - goPending.current < 1200;
      goPending.current = null;
      if (waitingForGo && GO_KEYS[key]) {
        e.preventDefault();
        router.push(GO_KEYS[key]);
      } else if (key === "g") {
        goPending.current = Date.now();
      } else if (e.key === "?") {
        e.preventDefault();
        help.current?.showModal();
      } else if (key === "c") {
        e.preventDefault();
        router.push("/invoices/new");
      } else if (key === "s" || key === "p") {
        const target = document.querySelector<HTMLElement>(`[data-shortcut="${key === "s" ? "mark-sent" : "record-payment"}"]`);
        if (target) {
          e.preventDefault();
          target.click();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, open);
    };
  }, [router]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = results.length;
      if (n) setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) run(item);
    }
  }

  const grouped = GROUP_ORDER.map((g) => ({ g, items: results.filter((r) => r.group === g) })).filter((x) => x.items.length);

  return (
    <>
      <dialog
        ref={dialog}
        aria-label="Command palette"
        onClick={(ev) => ev.target === dialog.current && dialog.current?.close()}
        className="bg-card text-foreground rounded-sheet m-0 mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl border p-0 shadow-[var(--shadow-overlay)] backdrop:bg-black/40 max-md:mt-4"
      >
        <div className="flex items-center gap-2 border-b px-4">
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
            aria-label="Search pages, invoices, clients and actions"
            placeholder="Search or jump to…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground max-md:h-14"
          />
          <kbd className="bg-muted text-muted-foreground rounded px-1.5 font-mono text-xs">Esc</kbd>
        </div>
        <div id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {grouped.length === 0 && <p className="text-muted-foreground text-13 px-3 py-6 text-center">Nothing matches “{query}”.</p>}
          {grouped.map(({ g, items }) => (
            <div key={g} role="group" aria-label={g} className="mb-1">
              <p className="text-muted-foreground px-3 py-1.5 text-xs font-medium">{g}</p>
              {items.map((item) => {
                const selected = results[active]?.id === item.id;
                return (
                  <div
                    key={item.id}
                    id={`palette-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(results.indexOf(item))}
                    onClick={() => run(item)}
                    className={cn("flex min-h-9 cursor-pointer items-center gap-2.5 rounded-input px-3 text-sm max-md:min-h-11", selected && "bg-accent")}
                  >
                    {item.id === "act:record-payment" ? <Banknote className="size-4" aria-hidden /> : item.id === "act:mark-sent" ? <Send className="size-4" aria-hidden /> : item.group === "Actions" ? <Plus className="size-4" aria-hidden /> : null}
                    <span className="truncate">{item.label}</span>
                    {item.shortcut && <kbd className="bg-muted text-muted-foreground ml-auto rounded px-1.5 font-mono text-xs">{item.shortcut}</kbd>}
                    {selected && !item.shortcut && <CornerDownLeft className="text-muted-foreground ml-auto size-3.5" aria-hidden />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </dialog>
      <dialog
        ref={help}
        aria-labelledby="shortcuts-title"
        onClick={(ev) => ev.target === help.current && help.current?.close()}
        className="bg-card text-foreground rounded-sheet m-0 mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-md border p-0 shadow-[var(--shadow-overlay)] backdrop:bg-black/40 max-md:mt-4"
      >
        <h2 id="shortcuts-title" className="border-b px-5 py-4 text-base font-semibold">Keyboard shortcuts</h2>
        <dl className="flex flex-col gap-2 p-5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="text-13 flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{s.label}</dt>
              <dd><kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{s.keys}</kbd></dd>
            </div>
          ))}
        </dl>
      </dialog>
    </>
  );
}
