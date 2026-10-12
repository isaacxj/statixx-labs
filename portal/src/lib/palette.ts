export type PaletteItem = { id: string; group: "Go to" | "Clients" | "Projects"; label: string; hint?: string; href: string };

const PAGES: PaletteItem[] = [
  { id: "page-overview", group: "Go to", label: "Overview", href: "/" },
  { id: "page-clients", group: "Go to", label: "Clients", href: "/clients" },
  { id: "page-digest", group: "Go to", label: "Digest", href: "/digest" },
  { id: "page-design", group: "Go to", label: "Design", href: "/design" },
];

/** Everything the team can jump to with ⌘K: the main pages, every client, and every project. */
export function buildPaletteItems(clients: { id: number; name: string }[], projects: { id: number; name: string; clientName: string }[]): PaletteItem[] {
  return [
    ...PAGES,
    ...clients.map((c): PaletteItem => ({ id: `client-${c.id}`, group: "Clients", label: c.name, href: `/clients/${c.id}` })),
    ...projects.map((p): PaletteItem => ({ id: `project-${p.id}`, group: "Projects", label: p.name, hint: p.clientName, href: `/projects/${p.id}` })),
  ];
}
