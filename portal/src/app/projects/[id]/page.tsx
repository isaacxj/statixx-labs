import Link from "next/link";
import { notFound } from "next/navigation";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import { Notice } from "@/components/notice";
import { UpdateFeed } from "@/components/update-feed";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { todayInChicago } from "@/lib/milestones";
import { STATUS_LABELS, formatDate } from "@/lib/status";
import { PROJECT_STATUSES } from "@/server/db/schema";
import { getProjectForUser, listMilestonesForUser, listUpdatesForUser } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";
import { updateProjectAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ id }, { error, saved }] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();
  const user = await getCurrentUser();
  const project = await getProjectForUser(user, projectId);
  if (!project) notFound();
  const [milestones, updates] = await Promise.all([listMilestonesForUser(user, project.id), listUpdatesForUser(user, project.id)]);
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
      <Notice saved={saved} error={error} />
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
      <MilestoneTimeline projectId={project.id} items={milestones} today={todayInChicago()} canEdit={user.kind === "team"} />
      <UpdateFeed projectId={project.id} items={updates} canEdit={user.kind === "team"} />
      {user.kind === "team" && (
        <form action={updateProjectAction.bind(null, project.id)} className="bg-card grid gap-3 rounded-md border p-4 sm:grid-cols-2">
          <h2 className="text-base font-semibold sm:col-span-2">Edit project</h2>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Name
            <Input name="name" required defaultValue={project.name} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Summary
            <Input name="summary" defaultValue={project.summary} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Status
            <Select name="status" defaultValue={project.status}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Starts
              <Input name="startsOn" type="date" defaultValue={project.startsOn ?? ""} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Due
              <Input name="dueOn" type="date" defaultValue={project.dueOn ?? ""} />
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      )}
    </div>
  );
}
