import { Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

const SURFACES = ["background", "card", "popover", "primary", "secondary", "muted", "accent", "destructive", "sidebar"] as const;
const SURFACE_CLASS: Record<(typeof SURFACES)[number], string> = {
  background: "bg-background", card: "bg-card", popover: "bg-popover", primary: "bg-primary", secondary: "bg-secondary",
  muted: "bg-muted", accent: "bg-accent", destructive: "bg-destructive", sidebar: "bg-sidebar",
};
const STATUSES: StatusKind[] = ["up", "degraded", "down", "maintenance", "pending", "paused"];
const SCALE = [["text-xs", "12 · Caption"], ["text-sm", "13 · Secondary"], ["text-base", "14 · Body"], ["text-lg", "16 · Large"], ["text-xl", "20 · Title"], ["text-2xl", "24 · Heading"], ["text-3xl", "32 · Display"]] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <AppShell title="Design">
      <div className="flex flex-col gap-10">
        <Section title="Surfaces">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {SURFACES.map((s) => (
              <li key={s} className="flex flex-col gap-2">
                <div className={`${SURFACE_CLASS[s]} h-14 rounded-lg border`} />
                <span className="font-mono text-xs">{s}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Status colors">
          <ul className="bg-card flex flex-wrap gap-x-6 gap-y-3 rounded-lg border p-4">
            {STATUSES.map((s) => (
              <li key={s}><StatusBadge status={s} /></li>
            ))}
          </ul>
        </Section>
        <Section title="Type">
          <div className="bg-card flex flex-col gap-2 rounded-lg border p-4">
            {SCALE.map(([cls, label]) => (
              <p key={cls} className={cls}>{label}</p>
            ))}
            <p className="font-mono text-sm tabular-nums">Geist Mono · 99.982% · 142 ms · 2026-10-13 09:41</p>
          </div>
        </Section>
        <Section title="Buttons">
          <div className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-4">
            <Button><Plus /> Add monitor</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Button disabled>Disabled</Button>
            <Button size="icon" aria-label="Add"><Plus /></Button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
