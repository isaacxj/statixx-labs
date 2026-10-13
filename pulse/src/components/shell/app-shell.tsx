import Link from "next/link";
import { Radio } from "lucide-react";
import { getCurrentUser } from "@/server/user";
import { SidebarLinks, BottomNav } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export async function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="bg-sidebar hidden border-r md:flex md:flex-col md:gap-6 md:p-3">
        <Link href="/" className="flex h-9 items-center gap-2 px-3 font-semibold tracking-tight">
          <Radio className="text-primary size-4" aria-hidden />
          Pulse
        </Link>
        <SidebarLinks />
      </aside>
      <div className="flex min-w-0 flex-col pb-16 md:pb-0">
        <header className="bg-background/95 sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Radio className="text-primary size-4 md:hidden" aria-hidden />
            <span className="text-muted-foreground hidden md:inline">Pulse</span>
            <span className="text-muted-foreground hidden md:inline" aria-hidden>/</span>
            <h1 className="truncate font-medium">{title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <span title={user.email} className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full font-mono text-xs font-medium" aria-label={`Signed in as ${user.email}`}>
              {user.initials}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
