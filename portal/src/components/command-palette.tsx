"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import type { PaletteItem } from "@/lib/palette";

const GROUPS: PaletteItem["group"][] = ["Go to", "Clients", "Projects"];

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-8 items-center gap-2 rounded-sm border px-2 text-sm transition-colors duration-150 max-md:min-h-11 max-md:min-w-11 max-md:justify-center"
      >
        <Search className="size-4" />
        <span className="hidden md:inline">Search</span>
        <kbd className="bg-muted hidden rounded-sm px-1.5 font-mono text-xs md:inline">⌘K</kbd>
      </button>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-popover text-popover-foreground fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border shadow-lg"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command label="Command palette">
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="text-muted-foreground size-4" />
              <Command.Input placeholder="Search pages, clients, projects…" className="placeholder:text-muted-foreground h-11 flex-1 bg-transparent outline-none" />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-1">
              <Command.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">Nothing matches. Try a client or project name.</Command.Empty>
              {GROUPS.map((group) => {
                const rows = items.filter((i) => i.group === group);
                if (rows.length === 0) return null;
                return (
                  <Command.Group key={group} heading={group} className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs">
                    {rows.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.hint ?? ""} ${item.id}`}
                        onSelect={() => go(item.href)}
                        className="data-[selected=true]:bg-accent flex min-h-11 cursor-pointer items-baseline justify-between gap-3 rounded-sm px-2 py-2 text-sm md:min-h-8 md:py-1.5"
                      >
                        <span className="truncate">{item.label}</span>
                        {item.hint && <span className="text-muted-foreground truncate text-xs">{item.hint}</span>}
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
