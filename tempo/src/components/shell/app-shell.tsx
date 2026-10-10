"use client";

import { useEffect, useState } from "react";
import { PanelLeft, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { BottomNav, SidebarLinks } from "./nav-links";

export function AppShell({ initials, email, children }: { initials: string; email: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage after mount
      setCollapsed(localStorage.getItem("tempo-sidebar") === "collapsed");
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("tempo-sidebar", c ? "open" : "collapsed");
      } catch {}
      return !c;
    });
  }

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span aria-hidden className="bg-primary size-2.5 shrink-0 rounded-full" />
          <span className={cn("text-lg font-semibold tracking-tight", collapsed && "sr-only")}>Tempo</span>
        </div>
        <SidebarLinks collapsed={collapsed} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">
        <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="max-md:hidden"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <PanelLeft />
          </Button>
          <span className="text-lg font-semibold tracking-tight md:hidden">Tempo</span>
          <div
            className="text-muted-foreground bg-card ml-2 hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-input border px-3 sm:flex sm:max-w-md"
            aria-label="Timer (coming with the timer step)"
          >
            <Timer className="size-4 shrink-0" />
            <span className="truncate text-sm">Timer</span>
            <span className="tabular ml-auto text-sm">0:00:00</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <span
              title={email}
              aria-label={`Signed in as ${email}`}
              className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium"
            >
              {initials}
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
