"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Command } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS, isActive } from "./nav";

export function Topbar({ initials, email }: { initials: string; email: string | null }) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) => isActive(pathname, i.href));
  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-12 items-center gap-2 border-b px-4 md:px-6">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-13">
        <span className="text-muted-foreground">Ledger</span>
        <ChevronRight className="text-muted-foreground size-3.5" aria-hidden />
        <span className="truncate font-medium">{current?.label ?? "Page"}</span>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          disabled
          title="Command palette arrives in a later step"
          className="text-muted-foreground hidden h-8 items-center gap-2 rounded-input border px-2.5 text-13 opacity-70 md:flex"
        >
          <Command className="size-3.5" aria-hidden />
          Search
          <kbd className="bg-muted rounded px-1.5 font-mono text-xs">⌘K</kbd>
        </button>
        <ThemeToggle />
        <span
          title={email ?? "Not signed in"}
          className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium"
        >
          {initials}
        </span>
      </div>
    </header>
  );
}
