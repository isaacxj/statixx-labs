import { Button } from "@/components/ui/button";

const colors = [
  "background", "card", "muted", "secondary", "accent", "primary",
  "success", "warning", "destructive", "info", "border", "sidebar",
];
const sizes = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"];

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Design</h1>
        <p className="mt-1 text-muted-foreground">Tokens and base components. Use the theme toggle to check both themes.</p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Colors</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {colors.map((c) => (
            <div key={c} className="flex flex-col gap-1.5">
              <div className="h-12 rounded-md border" style={{ background: `var(--${c})` }} />
              <span className="tabular text-xs text-muted-foreground">--{c}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Type</h2>
        <div className="flex flex-col gap-1 rounded-md border bg-card p-4">
          {sizes.map((s) => (
            <p key={s} className={s}>Geist Sans · {s}</p>
          ))}
          <p className="tabular">Geist Mono · $12,480.00 · 2026-10-08 · STX-2026-001</p>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Radius and overlay</h2>
        <div className="flex flex-wrap gap-3">
          <div className="grid h-16 w-24 place-items-center rounded-sm border bg-card text-xs">6px</div>
          <div className="grid h-16 w-24 place-items-center rounded-md border bg-card text-xs">8px</div>
          <div className="grid h-16 w-24 place-items-center rounded-lg border bg-popover text-xs shadow-overlay">12px</div>
        </div>
      </section>
    </div>
  );
}
