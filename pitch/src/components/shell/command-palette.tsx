"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems } from "./nav";

export function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = navItems.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase()));

  function open() {
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
  }

  function go(href: string) {
    dialog.current?.close();
    router.push(href);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (e.key === "Enter" && results[active]) {
      go(results[active].href);
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
            placeholder="Go to a page…"
            aria-label="Search pages"
            className="h-12 w-full bg-transparent text-base outline-none"
          />
        </div>
        <ul className="max-h-72 overflow-auto p-1">
          {results.map(({ href, label, icon: Icon }, i) => (
            <li key={href}>
              <button
                onClick={() => go(href)}
                onMouseMove={() => setActive(i)}
                className={`flex h-10 w-full items-center gap-2 rounded-sm px-2 text-left text-sm ${i === active ? "bg-accent text-accent-foreground" : ""}`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            </li>
          ))}
          {!results.length && <li className="px-2 py-6 text-center text-sm text-muted-foreground">No matching pages</li>}
        </ul>
      </dialog>
    </>
  );
}
