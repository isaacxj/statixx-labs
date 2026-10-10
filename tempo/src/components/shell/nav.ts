import { Clock, FolderKanban, Palette, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Add an entry when its page ships. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: Clock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/design", label: "Design", icon: Palette },
];
