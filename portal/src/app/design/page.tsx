import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Design · Portal" };

const COLORS = [
  "background", "foreground", "card", "primary", "secondary", "muted", "accent", "border",
  "success", "warning", "danger", "info",
] as const;
const SIZES = [
  ["text-xs", "12 · Caption"],
  ["text-sm", "13 · Secondary"],
  ["text-base", "14 · Body"],
  ["text-lg", "16 · Lead"],
  ["text-xl", "20 · Section"],
  ["text-2xl", "24 · Page title"],
  ["text-3xl", "32 · Display"],
] as const;
const SWATCH: Record<(typeof COLORS)[number], string> = {
  background: "bg-background", foreground: "bg-foreground", card: "bg-card", primary: "bg-primary",
  secondary: "bg-secondary", muted: "bg-muted", accent: "bg-accent", border: "bg-border",
  success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info",
};

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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Design</h1>
        <p className="text-muted-foreground">Tokens and base components. Toggle the theme in the top bar.</p>
      </header>
      <Section title="Colors">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {COLORS.map((c) => (
            <li key={c} className="flex flex-col gap-1.5">
              <span className={`${SWATCH[c]} h-10 rounded-sm border`} />
              <span className="text-muted-foreground font-mono text-xs">{c}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Type">
        <Card className="divide-border divide-y">
          {SIZES.map(([cls, label]) => (
            <p key={cls} className={`${cls} px-4 py-2`}>{label}</p>
          ))}
          <p className="px-4 py-2 font-mono text-sm tabular-nums">Geist Mono · 2026-10-11 · 1,204.50 KB</p>
        </Card>
      </Section>
      <Section title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button><Plus />Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>
      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="success">On track</Badge>
          <Badge tone="warning">At risk</Badge>
          <Badge tone="danger">Blocked</Badge>
          <Badge tone="info">Info</Badge>
        </div>
      </Section>
      <Section title="Inputs">
        <div className="max-w-sm">
          <Input placeholder="Project name" aria-label="Project name" />
        </div>
      </Section>
    </div>
  );
}
