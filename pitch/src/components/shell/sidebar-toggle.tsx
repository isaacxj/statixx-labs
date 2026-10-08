"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarToggle() {
  function toggle() {
    const collapsed = document.documentElement.classList.toggle("sidebar-collapsed");
    try {
      localStorage.setItem("sidebar", collapsed ? "collapsed" : "open");
    } catch {}
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Collapse or expand sidebar" className="max-md:hidden">
      <PanelLeftClose className="[.sidebar-collapsed_&]:hidden" />
      <PanelLeftOpen className="hidden [.sidebar-collapsed_&]:block" />
    </Button>
  );
}
