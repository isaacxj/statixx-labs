import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { getProject, listClients } from "@/server/db/queries";

export const dynamic = "force-dynamic";

const dollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = Number.isInteger(Number(id)) ? await getProject(Number(id)) : null;
  if (!project) notFound();
  const clients = await listClients();
  const budget = project.budgetMinutes === null ? "" : `${Math.floor(project.budgetMinutes / 60)}:${String(project.budgetMinutes % 60).padStart(2, "0")}`;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
      <header>
        <p className="text-muted-foreground text-sm">
          <Link href="/projects" className="hover:underline">
            Projects
          </Link>{" "}
          / {project.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
      </header>
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
