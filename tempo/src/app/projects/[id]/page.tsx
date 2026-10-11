import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { BudgetBar } from "@/components/budget/budget-bar";
import { BurnChart } from "@/components/budget/burn-chart";
import { burnSeries } from "@/lib/budget";
import { ProfitCard } from "@/components/budget/profit-card";
import { profitability } from "@/lib/profit";
import { localDay } from "@/lib/entries";
import { getProject, listClients, listProjectEntries } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const dollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = Number.isInteger(Number(id)) ? await getProject(Number(id)) : null;
  if (!project) notFound();
  const [clients, entries] = await Promise.all([listClients(), listProjectEntries(project.id)]);
  const points = burnSeries(entries, localDay(new Date().toISOString()));
  const profit = profitability(project, entries);
  const used = entries.reduce((sum, e) => sum + e.minutes, 0);
  const budget = project.budgetMinutes === null ? "" : `${Math.floor(project.budgetMinutes / 60)}:${String(project.budgetMinutes % 60).padStart(2, "0")}`;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <header>
        <p className="text-muted-foreground text-sm">
          <Link href="/projects" className="hover:underline">
            Projects
          </Link>{" "}
          / {project.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
      </header>
      <section aria-labelledby="burn" className="bg-card rounded-card flex flex-col gap-4 border p-4">
        <h2 id="burn" className="text-base font-semibold">
          Budget burn
        </h2>
        {points.length === 0 ? (
          <p className="text-muted-foreground text-sm">No time logged on this project yet.</p>
        ) : (
          <BurnChart points={points} budgetMinutes={project.budgetMinutes} color={project.color} />
        )}
        {project.budgetMinutes === null ? (
          <p className="text-muted-foreground text-sm">Add a budget below to track burn against it.</p>
        ) : (
          <BudgetBar usedMinutes={used} budgetMinutes={project.budgetMinutes} />
        )}
      </section>
      <ProfitCard billing={project.billing} currency={project.currency} profit={profit} />
      <ProjectForm
        id={project.id}
        clients={clients}
        defaults={{
          clientId: project.clientId,
          name: project.name,
          billing: project.billing,
          rate: project.rateCents ? dollars(project.rateCents) : "",
          fixedFee: project.fixedFeeCents ? dollars(project.fixedFeeCents) : "",
          budget,
          color: project.color,
        }}
      />
    </div>
  );
}
