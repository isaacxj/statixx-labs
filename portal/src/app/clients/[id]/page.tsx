import Link from "next/link";
import { notFound } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Notice } from "@/components/notice";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getClientWithUsers } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";
import { addClientUserAction, updateClientUserAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  if ((await getCurrentUser()).kind !== "team") notFound();
  const [{ id }, { error, saved }] = await Promise.all([params, searchParams]);
  const clientId = Number(id);
  const client = Number.isInteger(clientId) ? await getClientWithUsers(clientId) : null;
  if (!client) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/clients" className="text-muted-foreground text-sm hover:underline">
          Clients
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: client.accent }} />
          {client.name}
        </h1>
      </header>
      <Notice saved={saved} error={error} />
      <section aria-labelledby="users" className="flex flex-col gap-3">
        <h2 id="users" className="text-base font-semibold">People who can sign in</h2>
        <p className="text-muted-foreground text-sm">Approvers can approve deliverables or request changes. Viewers can only read and submit requests.</p>
        {client.users.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">No one has access yet. Add an email below.</p>
        ) : (
          <ul className="bg-card divide-border rounded-md divide-y border">
            {client.users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block font-medium">{u.name || u.email}</span>
                  {u.name && <span className="text-muted-foreground block truncate text-xs">{u.email}</span>}
                </span>
                <form action={updateClientUserAction.bind(null, client.id, u.id)} className="flex items-center gap-2">
                  <Select name="role" defaultValue={u.role} aria-label={`Role for ${u.email}`}>
                    <option value="viewer">Viewer</option>
                    <option value="approver">Approver</option>
                  </Select>
                  <Button type="submit" variant="outline" size="sm">Save</Button>
                  <Button type="submit" name="active" value={u.active ? "0" : "1"} variant="ghost" size="sm">
                    {u.active ? "Deactivate" : "Reactivate"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addClientUserAction.bind(null, client.id)} className="bg-card flex flex-wrap items-end gap-3 rounded-md border p-4">
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
            Email
            <Input name="email" type="email" required placeholder="maria@northwinddental.example" />
          </label>
          <label className="flex min-w-32 flex-col gap-1 text-sm">
            Name
            <Input name="name" placeholder="Maria Chen" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Role
            <Select name="role" defaultValue="viewer">
              <option value="viewer">Viewer</option>
              <option value="approver">Approver</option>
            </Select>
          </label>
          <Button type="submit">
            <UserPlus /> Add user
          </Button>
        </form>
      </section>
      <section aria-labelledby="projects" className="flex flex-col gap-3">
        <h2 id="projects" className="text-base font-semibold">Projects</h2>
        {client.projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No projects yet.</p>
        ) : (
          <ul className="bg-card divide-border rounded-md divide-y border">
            {client.projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <Link href={`/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
