import Link from "next/link";
import Markdown from "react-markdown";
import { StatusBadge } from "@/components/status-badge";
import { milestoneProgress, nextMilestone, todayInChicago } from "@/lib/milestones";
import { formatDate } from "@/lib/status";
import { formatPostedAt } from "@/lib/updates";
import {
  hasActiveClientUser,
  listClientsWithUsers,
  listLatestUpdatesForClientEmail,
  listMilestonesForClientEmail,
  listProjectsForClientEmail,
  listProjectsWithClient,
} from "@/server/db/queries";
import { getViewer } from "@/server/viewer";

export const dynamic = "force-dynamic";

type ProjectRow = Awaited<ReturnType<typeof listProjectsWithClient>>[number];

function ProjectList({ projects, showClient }: { projects: ProjectRow[]; showClient: boolean }) {
  return (
    <ul className="bg-card divide-border rounded-md divide-y border">
      {projects.map((p) => (
        <li key={p.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
              {p.name}
            </Link>
            {showClient && <span className="text-muted-foreground"> · {p.clientName}</span>}
            {p.summary && <span className="text-muted-foreground block truncate text-xs">{p.summary}</span>}
          </span>
          <span className="flex flex-col items-end gap-1 text-xs whitespace-nowrap">
            <StatusBadge status={p.status} />
            <span className="text-muted-foreground font-mono tabular-nums">due {formatDate(p.dueOn)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

async function ClientHome({ email }: { email: string }) {
  if (!(await hasActiveClientUser(email))) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-2 py-16 text-center">
        <h1 className="text-xl font-semibold">No access yet</h1>
        <p className="text-muted-foreground">{email} isn&apos;t set up for a client portal. Ask your contact at Statixx to add you.</p>
      </div>
    );
  }
  const [projects, allMilestones, latest] = await Promise.all([
    listProjectsForClientEmail(email),
    listMilestonesForClientEmail(email),
    listLatestUpdatesForClientEmail(email, 5),
  ]);
  const today = todayInChicago();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your projects</h1>
        <p className="text-muted-foreground">{projects[0]?.clientName ?? "Nothing shared with you yet."}</p>
      </header>
      {projects.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => {
            const own = allMilestones.filter((m) => m.projectId === p.id);
            const { done, total } = milestoneProgress(own);
            const next = nextMilestone(own);
            return (
              <li key={p.id} className="bg-card flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>
                {p.summary && <p className="text-muted-foreground text-sm">{p.summary}</p>}
                <dl className="text-muted-foreground flex flex-col gap-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt>Due</dt>
                    <dd className="font-mono tabular-nums">{formatDate(p.dueOn)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Milestones</dt>
                    <dd className="font-mono tabular-nums">{total === 0 ? "None yet" : `${done} of ${total} done`}</dd>
                  </div>
                  {next && (
                    <div className="flex justify-between gap-3">
                      <dt>Next</dt>
                      <dd className={next.dueOn && next.dueOn < today ? "text-danger text-right" : "text-foreground text-right"}>
                        {next.title}
                        {next.dueOn && <span className="font-mono tabular-nums"> · {formatDate(next.dueOn)}</span>}
                      </dd>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
      {projects.length > 0 && (
        <section aria-labelledby="latest-updates" className="flex flex-col gap-3">
          <h2 id="latest-updates" className="text-base font-semibold">Latest updates</h2>
          {latest.length === 0 ? (
            <p className="text-muted-foreground bg-card rounded-md border p-4 text-sm">No updates have been posted yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {latest.map((u) => (
                <li key={u.id} className="bg-card rounded-md border p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
                    <Link href={`/projects/${u.projectId}`} className="text-foreground font-medium hover:underline">
                      {u.projectName}
                    </Link>
                    <time className="text-muted-foreground font-mono tabular-nums" dateTime={`${u.createdAt.replace(" ", "T")}Z`}>
                      {formatPostedAt(u.createdAt)}
                    </time>
                  </div>
                  <div className="line-clamp-4 text-sm [&_p+p]:mt-2 [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                    <Markdown>{u.bodyMd}</Markdown>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer.variant === "client") return <ClientHome email={viewer.email} />;
  const [clients, projects] = await Promise.all([listClientsWithUsers(), listProjectsWithClient()]);
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Portal</h1>
        <p className="text-muted-foreground">Clients, the people who can sign in for them, and their projects, read from local D1.</p>
      </header>
      <section aria-labelledby="clients" className="flex flex-col gap-3">
        <h2 id="clients" className="text-base font-semibold">Clients</h2>
        <ul className="bg-card divide-border rounded-md divide-y border">
          {clients.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 px-4 py-3">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground text-xs">
                {c.users.map((u) => `${u.email} (${u.role}${u.active ? "" : ", inactive"})`).join(" · ") || "No users yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="projects" className="flex flex-col gap-3">
        <h2 id="projects" className="text-base font-semibold">Projects</h2>
        <ProjectList projects={projects} showClient />
      </section>
    </div>
  );
}
