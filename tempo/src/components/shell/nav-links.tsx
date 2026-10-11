"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarLinks({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={label}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 items-center gap-3 rounded-input px-2.5 transition-colors duration-150",
            isActive(pathname, href) && "bg-accent text-accent-foreground font-medium",
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className={cn(collapsed && "sr-only")}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="bg-sidebar fixed inset-x-0 bottom-0 z-30 flex border-t md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "text-muted-foreground flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs",
            isActive(pathname, href) && "text-foreground font-medium",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
