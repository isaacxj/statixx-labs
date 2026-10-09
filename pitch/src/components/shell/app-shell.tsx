import Link from "next/link";
import { FileText } from "lucide-react";
import type { CurrentUser } from "@/server/user";
import { BottomNav, Breadcrumb, SidebarNav } from "./nav";
import { CommandPalette, type PaletteData } from "./command-palette";
import { SidebarToggle } from "./sidebar-toggle";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ user, palette, children }: { user: CurrentUser; palette: PaletteData; children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[var(--sidebar-w)_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-4 border-r bg-sidebar p-3 md:flex">
        <Link href="/" className="flex h-9 items-center gap-2 px-2 font-semibold">
          <span className="grid size-6 place-items-center rounded-sm bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </span>
          <span className="[.sidebar-collapsed_&]:hidden">Pitch</span>
        </Link>
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-col pb-14 md:pb-0">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-1">
            <SidebarToggle />
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-1">
            <CommandPalette data={palette} />
            <ThemeToggle />
            <span
              title={user.email}
              className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-medium"
            >
              {user.initials}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
