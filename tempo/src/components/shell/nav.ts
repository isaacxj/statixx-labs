import { Clock, Palette, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Add an entry when its page ships. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: Clock },
  { href: "/design", label: "Design", icon: Palette },
];
