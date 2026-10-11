import type { Metadata } from "next";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Design" };

const SURFACES = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["secondary", "bg-secondary"],
  ["accent", "bg-accent"],
  ["primary", "bg-primary"],
  ["destructive", "bg-destructive"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["danger", "bg-danger"],
  ["info", "bg-info"],
] as const;

const TYPE_SCALE = [
  ["text-xs", "12 · Caption"],
  ["text-sm", "13 · Secondary text"],
  ["text-base", "14 · Body text"],
  ["text-lg", "16 · Section title"],
  ["text-xl", "20 · Page subtitle"],
  ["text-2xl", "24 · Page title"],
  ["text-3xl", "32 · Display"],
] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-card border">
      <h2 className="border-b px-4 py-3 text-lg font-semibold">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Design</h1>
        <p className="text-muted-foreground">Every token and base component. Switch the theme in the top bar.</p>
      </header>

      <Block title="Colors">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SURFACES.map(([name, cls]) => (
            <li key={name} className="flex flex-col gap-1.5">
              <span className={`${cls} h-12 rounded-input border`} />
              <span className="text-muted-foreground text-xs">{name}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Type">
        <div className="flex flex-col gap-2">
          {TYPE_SCALE.map(([cls, label]) => (
            <p key={cls} className={cls}>
              {label}
            </p>
          ))}
          <p className="tabular text-base">Geist Mono · 1:30 · $1,250.00 · 2026-10-10</p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus /> Primary
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">
            <Trash2 /> Delete
          </Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Block>

      <Block title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">On budget</Badge>
          <Badge variant="warning">80% of budget</Badge>
          <Badge variant="danger">Over budget</Badge>
          <Badge variant="info">Billed</Badge>
        </div>
      </Block>

      <Block title="Shape and elevation">
        <div className="flex flex-wrap items-end gap-4">
          <span className="bg-secondary rounded-input px-4 py-3 text-sm">6 input</span>
          <span className="bg-secondary rounded-card px-4 py-3 text-sm">8 card</span>
          <span className="bg-secondary rounded-sheet px-4 py-3 text-sm">12 sheet</span>
          <span className="bg-popover shadow-overlay rounded-sheet border px-4 py-3 text-sm">Overlay shadow</span>
        </div>
      </Block>
    </div>
  );
}
