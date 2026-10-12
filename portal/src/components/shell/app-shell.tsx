import { BottomNav, CLIENT_NAV, SidebarNav, TEAM_NAV } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export type ShellVariant = "team" | "client";

export function AppShell({
  variant,
  title,
  initials,
  children,
}: {
  variant: ShellVariant;
  title: string;
  initials: string;
  children: React.ReactNode;
}) {
  const items = variant === "team" ? TEAM_NAV : CLIENT_NAV;
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-sidebar sticky top-0 hidden h-dvh flex-col gap-4 border-r p-3 md:flex">
        <div className="flex h-8 items-center gap-2 px-2 font-semibold">
          <span aria-hidden className="bg-primary size-2.5 rounded-sm" />
          {title}
        </div>
        <SidebarNav items={items} />
      </aside>
      <div className="flex min-w-0 flex-col pb-16 md:pb-0">
        <header className="bg-background/95 sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4">
          <span className="font-semibold md:hidden">{title}</span>
          <span className="text-muted-foreground hidden text-sm md:block">{variant === "team" ? "Team" : "Client portal"}</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <span
              aria-label="Signed in user"
              className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-full text-xs font-medium"
            >
              {initials}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">{children}</main>
      </div>
      <BottomNav items={items} />
    </div>
  );
}
