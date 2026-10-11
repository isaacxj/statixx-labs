import { CalendarClock, BarChart3, CalendarDays, Clock, FolderKanban, Palette, Receipt, Settings, Upload, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Left out of the phone bottom nav to keep it tappable. */ desktopOnly?: boolean };

/** Add an entry when its page ships. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Clock },
  { href: "/today", label: "Today", icon: CalendarClock },
  { href: "/week", label: "Week", icon: CalendarDays },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/unbilled", label: "Unbilled", icon: Receipt },
  { href: "/import", label: "Import", icon: Upload, desktopOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/design", label: "Design", icon: Palette, desktopOnly: true },
];
