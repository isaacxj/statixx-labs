import { formatDate, STATUS_LABELS } from "@/lib/status";
import { listClientsWithUsers, listProjectsWithClient } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
        <ul className="bg-card divide-border rounded-md divide-y border">
          {projects.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground"> · {p.clientName}</span>
                {p.summary && <span className="text-muted-foreground block truncate text-xs">{p.summary}</span>}
              </span>
              <span className="text-right text-xs whitespace-nowrap">
                {STATUS_LABELS[p.status]}
                <span className="text-muted-foreground block font-mono tabular-nums">due {formatDate(p.dueOn)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
