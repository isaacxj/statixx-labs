import { BILLING_LABELS, formatDuration, formatMoney } from "@/lib/format";
import { listBusinesses, listClients, listProjects } from "@/server/db/queries";

export const dynamic = "force-dynamic";

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-card border">
      <h2 className="flex items-baseline justify-between border-b px-4 py-3 text-base font-semibold">
        {title}
        <span className="text-muted-foreground font-mono text-xs tabular-nums">{count}</span>
      </h2>
      <ul className="divide-border divide-y">{children}</ul>
    </section>
  );
}

export default async function HomePage() {
  const [businesses, clients, projects] = await Promise.all([listBusinesses(), listClients(), listProjects()]);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tempo</h1>
        <p className="text-muted-foreground">Time tracking and project profitability. Seeded data from local D1.</p>
      </header>
      <Section title="Businesses" count={businesses.length}>
        {businesses.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span>{b.name}</span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {b.currency} · {formatMoney(b.defaultRateCents, b.currency)}/h
            </span>
          </li>
        ))}
      </Section>
      <Section title="Clients" count={clients.length}>
        {clients.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span>{c.name}</span>
            <span className="text-muted-foreground text-xs">{c.businessName}</span>
          </li>
        ))}
      </Section>
      <Section title="Projects" count={projects.length}>
        {projects.map((p) => (
          <li key={p.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
              <span className="text-muted-foreground truncate text-xs">{p.clientName}</span>
            </span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums sm:shrink-0">
              {BILLING_LABELS[p.billing]}
              {p.billing === "hourly" && ` · ${formatMoney(p.rateCents, p.currency)}/h`}
              {p.billing === "fixed" && p.fixedFeeCents !== null && ` · ${formatMoney(p.fixedFeeCents, p.currency)}`}
              {p.budgetMinutes !== null && ` · ${formatDuration(p.budgetMinutes)} budget`}
            </span>
          </li>
        ))}
      </Section>
    </div>
  );
}
