"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, isActive } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the saved choice after hydration
      setCollapsed(localStorage.getItem("sidebar") === "collapsed");
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("sidebar", c ? "open" : "collapsed");
      } catch {}
      return !c;
    });
  }

  return (
    <aside
      className={cn(
        "bg-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex h-12 items-center gap-2 px-3.5">
        <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-input">
          <Receipt className="size-4" aria-hidden />
        </span>
        {!collapsed && <span className="text-base font-semibold">Ledger</span>}
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-input px-2.5 text-sm transition-colors duration-150",
                active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed && <span>{label}</span>}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button variant="ghost" size="sm" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="w-full justify-start text-muted-foreground">
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && "Collapse"}
        </Button>
      </div>
    </aside>
  );
}
