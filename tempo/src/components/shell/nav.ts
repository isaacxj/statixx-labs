import { CalendarClock, BarChart3, CalendarDays, Clock, FolderKanban, Palette, Settings, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Add an entry when its page ships. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: Clock },
  { href: "/today", label: "Today", icon: CalendarClock },
  { href: "/week", label: "Week", icon: CalendarDays },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/design", label: "Design", icon: Palette },
];
