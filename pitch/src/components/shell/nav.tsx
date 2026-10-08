"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Palette, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/design", label: "Design", icon: Palette },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          title={label}
          className={cn(
            "flex h-8 items-center gap-2 rounded-sm px-2 text-sm text-sidebar-foreground transition-colors duration-150 hover:bg-muted",
            isActive(pathname, href) && "bg-accent font-medium text-accent-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="[.sidebar-collapsed_&]:sr-only">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 grid grid-flow-col auto-cols-fr border-t bg-sidebar md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground",
            isActive(pathname, href) && "text-accent-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Breadcrumb() {
  const pathname = usePathname();
  const current = navItems.find((n) => isActive(pathname, n.href))?.label ?? "Pitch";
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>Pitch</span>
      <span aria-hidden>/</span>
      <span className="font-medium text-foreground">{current}</span>
    </div>
  );
}
