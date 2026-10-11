import Link from "next/link";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BILLING_LABELS, formatDuration, formatMoney } from "@/lib/format";
import { BudgetBar } from "@/components/budget/budget-bar";
import { getProjectUsedMinutes, listProjects } from "@/server/db/queries";
import { archiveProject } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const showArchived = show === "archived";
  const [all, used] = await Promise.all([listProjects(), getProjectUsedMinutes()]);
  const projects = all.filter((p) => (p.status === "archived") === showArchived);
  const tab = (active: boolean) => `rounded-input px-3 py-1.5 text-sm max-md:flex max-md:min-h-11 max-md:items-center ${active ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent"}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">
            <Plus /> New project
          </Link>
        </Button>
      </header>
      <nav className="flex gap-1" aria-label="Project status">
        <Link href="/projects" className={tab(!showArchived)} aria-current={!showArchived ? "page" : undefined}>
          Active
        </Link>
        <Link href="/projects?show=archived" className={tab(showArchived)} aria-current={showArchived ? "page" : undefined}>
          Archived
        </Link>
      </nav>
      {projects.length === 0 ? (
        <div className="bg-card rounded-card flex flex-col items-start gap-3 border p-6">
          <p className="text-muted-foreground">{showArchived ? "No archived projects." : "No projects yet. Add one to start tracking time against it."}</p>
          {!showArchived && (
            <Button asChild>
              <Link href="/projects/new">New project</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="bg-card rounded-card divide-border divide-y border">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/projects/${p.id}`} className="flex min-w-0 flex-col gap-1 hover:underline">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate font-medium">{p.name}</span>
                </span>
                <span className="text-muted-foreground truncate text-xs">{p.clientName}</span>
              </Link>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{BILLING_LABELS[p.billing]}</Badge>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {p.billing === "hourly" && formatMoney(p.rateCents, p.currency) + "/h"}
                  {p.billing === "fixed" && p.fixedFeeCents !== null && formatMoney(p.fixedFeeCents, p.currency)}
                  {p.budgetMinutes !== null && `${p.billing === "hourly" || p.billing === "fixed" ? " · " : ""}${formatDuration(p.budgetMinutes)}h budget`}
                </span>
                <form action={archiveProject.bind(null, p.id, !showArchived)} className="ml-auto">
                  <Button variant="ghost" size="icon" type="submit" aria-label={showArchived ? `Restore ${p.name}` : `Archive ${p.name}`}>
                    {showArchived ? <ArchiveRestore /> : <Archive />}
                  </Button>
                </form>
              </div>
              <BudgetBar usedMinutes={used.get(p.id) ?? 0} budgetMinutes={p.budgetMinutes} className="sm:w-56" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
