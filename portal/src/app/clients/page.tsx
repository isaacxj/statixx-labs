import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listClientsWithUsers } from "@/server/db/queries";
import { getCurrentUser } from "@/server/viewer";
import { createClientAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  if ((await getCurrentUser()).kind !== "team") notFound();
  const [{ error, saved }, clients] = await Promise.all([searchParams, listClientsWithUsers()]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Everyone you share a portal with, and who can sign in for them.</p>
      </header>
      <Notice saved={saved} error={error} />
      <form action={createClientAction} className="bg-card flex flex-wrap items-end gap-3 rounded-md border p-4">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          Client name
          <Input name="name" required placeholder="Northwind Dental" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Accent
          <Input name="accent" defaultValue="#0EA5E9" className="w-28 font-mono" aria-label="Accent color hex" />
        </label>
        <Button type="submit">
          <Plus /> Add client
        </Button>
      </form>
      {clients.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">No clients yet. Add your first one above.</p>
      ) : (
        <ul className="bg-card divide-border rounded-md divide-y border">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="hover:bg-accent flex items-center gap-3 px-4 py-3">
                <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.accent }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.name}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {c.users.length} {c.users.length === 1 ? "user" : "users"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
