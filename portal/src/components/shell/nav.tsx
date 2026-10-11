"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, Palette, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const TEAM_NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/design", label: "Design", icon: Palette },
];
export const CLIENT_NAV: NavItem[] = [{ href: "/", label: "Projects", icon: FolderKanban }];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "text-muted-foreground flex h-8 items-center gap-2 rounded-sm px-2 text-sm transition-colors duration-150 hover:bg-accent hover:text-foreground",
            isActive(href) && "bg-accent text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="bg-sidebar fixed inset-x-0 bottom-0 z-20 flex border-t md:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "text-muted-foreground flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs",
            isActive(href) && "text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
