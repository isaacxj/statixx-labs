import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Design · Ledger" };

const SURFACES = ["background", "card", "muted", "accent", "sidebar", "popover"] as const;
const BRAND = ["primary", "secondary", "ring", "border", "input"] as const;
const SEMANTIC = ["success", "warning", "danger", "info"] as const;
const TYPE = [
  ["text-xs", "12 · Caption"],
  ["text-13", "13 · Secondary"],
  ["text-sm", "14 · Body"],
  ["text-base", "16 · Subheading"],
  ["text-xl", "20 · Heading"],
  ["text-2xl", "24 · Page title"],
  ["text-3xl", "32 · Display"],
] as const;

// Literal class names so Tailwind can see them.
const BG: Record<string, string> = {
  background: "bg-background", card: "bg-card", muted: "bg-muted", accent: "bg-accent", sidebar: "bg-sidebar",
  popover: "bg-popover", primary: "bg-primary", secondary: "bg-secondary", ring: "bg-ring", border: "bg-border",
  input: "bg-input", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info",
};

function Swatches({ names }: { names: readonly string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {names.map((n) => (
        <li key={n} className="flex flex-col gap-1.5">
          <span className={`${BG[n]} rounded-input h-12 border`} />
          <span className="font-mono text-xs">--{n}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Design system</h1>
        <p className="text-muted-foreground">Tokens and base components. Switch the theme in the top bar to check both.</p>
      </header>
      <Section title="Surfaces"><Swatches names={SURFACES} /></Section>
      <Section title="Brand and lines"><Swatches names={BRAND} /></Section>
      <Section title="Semantic"><Swatches names={SEMANTIC} /></Section>
      <Section title="Type">
        <div className="bg-card rounded-card flex flex-col gap-2 border p-4">
          {TYPE.map(([cls, label]) => (
            <p key={cls} className={cls}>{label}</p>
          ))}
          <p className="font-mono text-sm">
            INV-0042 · {formatMoney(1234567, "USD")} · 2026-10-09
          </p>
        </div>
      </Section>
      <Section title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>
      <Section title="Status badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge tone="info">Sent</Badge>
          <Badge tone="info">Viewed</Badge>
          <Badge tone="warning">Partially paid</Badge>
          <Badge tone="success">Paid</Badge>
          <Badge tone="danger">Overdue</Badge>
          <Badge>Void</Badge>
        </div>
      </Section>
    </div>
  );
}
