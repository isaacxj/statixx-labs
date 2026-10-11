import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/status";
import { hasActiveClientUser, listClientsWithUsers, listProjectsForClientEmail, listProjectsWithClient } from "@/server/db/queries";
import { getViewer } from "@/server/viewer";

export const dynamic = "force-dynamic";

type ProjectRow = Awaited<ReturnType<typeof listProjectsWithClient>>[number];

function ProjectList({ projects, showClient }: { projects: ProjectRow[]; showClient: boolean }) {
  return (
    <ul className="bg-card divide-border rounded-md divide-y border">
      {projects.map((p) => (
        <li key={p.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <span className="font-medium">{p.name}</span>
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
  const projects = await listProjectsForClientEmail(email);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Your projects</h1>
        <p className="text-muted-foreground">{projects[0]?.clientName ?? "Nothing shared with you yet."}</p>
      </header>
      {projects.length > 0 && <ProjectList projects={projects} showClient={false} />}
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
