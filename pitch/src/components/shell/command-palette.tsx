"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Search, Send, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markSentAction } from "@/app/(app)/proposals/[id]/actions";
import { filterPalette, isTypingTarget, proposalIdFromPath, type PaletteItem } from "@/lib/palette";
import { navItems } from "./nav";
import { ShortcutsDialog, type ShortcutsHandle } from "./shortcuts-dialog";

export type PaletteData = {
  proposals: { id: number; number: string; title: string; status: string; clientName: string }[];
  clients: { id: number; name: string; company: string | null }[];
};

const groupIcon = { Actions: Plus, Pages: FileText, Proposals: FileText, Clients: User } as const;

export function CommandPalette({ data }: { data: PaletteData }) {
  const router = useRouter();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const shortcuts = useRef<ShortcutsHandle>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [, start] = useTransition();

  const items = useMemo<PaletteItem[]>(() => {
    const current = data.proposals.find((p) => p.id === proposalIdFromPath(pathname));
    const actions: PaletteItem[] = [
      { key: "new-proposal", group: "Actions", label: "New proposal", hint: "create draft", href: "/proposals/new" },
      { key: "new-client", group: "Actions", label: "New client", hint: "add client", href: "/clients/new" },
    ];
    if (current?.status === "draft") {
      actions.unshift({ key: "mark-sent", group: "Actions", label: `Mark ${current.number} as sent`, hint: "send share link", action: "mark-sent" });
    }
    return [
      ...actions,
      ...navItems.map((n) => ({ key: `nav-${n.href}`, group: "Pages" as const, label: n.label, href: n.href })),
      ...data.proposals.map((p) => ({
        key: `p-${p.id}`,
        group: "Proposals" as const,
        label: p.title,
        hint: `${p.number} ${p.clientName} ${p.status}`,
        href: `/proposals/${p.id}`,
      })),
      ...data.clients.map((c) => ({
        key: `c-${c.id}`,
        group: "Clients" as const,
        label: c.name,
        hint: c.company ?? undefined,
        href: `/clients?q=${encodeURIComponent(c.name)}`,
      })),
    ];
  }, [data, pathname]);

  const results = filterPalette(items, query);

  function open() {
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
  }

  function run(item: PaletteItem) {
    dialog.current?.close();
    if (item.href) return router.push(item.href);
    const id = proposalIdFromPath(pathname);
    if (item.action === "mark-sent" && id) {
      start(async () => {
        await markSentAction(id);
        router.refresh();
      });
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      if (e.key === "?") {
        e.preventDefault();
        shortcuts.current?.open();
      } else if (e.key === "n") {
        e.preventDefault();
        router.push("/proposals/new");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (e.key === "Enter" && results[active]) {
      run(results[active]);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={open} aria-label="Open command palette" className="gap-2 text-muted-foreground">
        <Search />
        <span className="max-md:hidden">Jump to…</span>
        <kbd className="tabular rounded-sm border bg-muted px-1 text-xs max-md:hidden">⌘K</kbd>
      </Button>
      <dialog
        ref={dialog}
        aria-label="Command palette"
        onClose={() => dialog.current?.contains(document.activeElement) && (document.activeElement as HTMLElement).blur()}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto mt-[15vh] w-[min(32rem,calc(100vw-2rem))] rounded-lg border bg-popover p-0 text-popover-foreground shadow-overlay backdrop:bg-foreground/20"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search pages, proposals, clients, actions…"
            aria-label="Search the command palette"
            className="h-12 w-full bg-transparent text-base outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-auto p-1">
          {results.map((item, i) => {
            const Icon = item.action === "mark-sent" ? Send : item.group === "Pages" ? (navItems.find((n) => `nav-${n.href}` === item.key)?.icon ?? FileText) : groupIcon[item.group];
            return (
              <li key={item.key}>
                {(i === 0 || results[i - 1].group !== item.group) && (
                  <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{item.group}</p>
                )}
                <button
                  onClick={() => run(item)}
                  onMouseMove={() => setActive(i)}
                  className={`flex h-10 w-full items-center gap-2 rounded-sm px-2 text-left text-sm ${i === active ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.group === "Proposals" && item.hint && (
                    <span className="tabular ml-auto shrink-0 font-mono text-xs text-muted-foreground">{item.hint.split(" ")[0]}</span>
                  )}
                </button>
              </li>
            );
          })}
          {!results.length && <li className="px-2 py-6 text-center text-sm text-muted-foreground">Nothing matches</li>}
        </ul>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">↑↓ to move · Enter to open · Esc to close · ? for all shortcuts</p>
      </dialog>
      <ShortcutsDialog ref={shortcuts} />
    </>
  );
}
