import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/status";
import { getProjectForUser } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();
  const project = await getProjectForUser(await getCurrentUser(), projectId);
  if (!project) notFound();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
        ← {project.clientName}
      </Link>
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.summary && <p className="text-muted-foreground">{project.summary}</p>}
      </header>
      <dl className="bg-card grid grid-cols-2 gap-4 rounded-md border p-4 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Starts</dt>
          <dd className="font-mono tabular-nums">{formatDate(project.startsOn)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Due</dt>
          <dd className="font-mono tabular-nums">{formatDate(project.dueOn)}</dd>
        </div>
      </dl>
    </div>
  );
}
