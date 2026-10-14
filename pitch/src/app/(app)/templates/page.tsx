import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listClients, listTemplates } from "@/server/db/queries";
import { deleteTemplateAction, useTemplate } from "./actions";

export const dynamic = "force-dynamic";

const select = "border-input bg-card h-9 w-full rounded-sm border px-3 text-sm transition-colors duration-150 max-md:h-11";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const saved = (await searchParams).saved;
  const [templates, clients] = await Promise.all([listTemplates(), listClients()]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-muted-foreground text-sm">Start a proposal from a saved structure. Choose a client and the draft is ready, with its own number.</p>
      </div>
      {saved && (
        <p role="status" className="bg-success/10 text-success border-success/30 rounded-md border px-4 py-2 text-sm">
          Saved template <span className="font-medium">{saved}</span>.
        </p>
      )}
      {templates.length === 0 ? (
        <div className="bg-card flex flex-col items-start gap-3 rounded-md border p-6">
          <p className="font-medium">No templates yet.</p>
          <p className="text-muted-foreground text-sm">Open a proposal and choose Save as template to keep its sections and pricing.</p>
          <Link href="/proposals" className={buttonVariants({ variant: "outline" })}>Go to proposals</Link>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-card flex flex-col items-start gap-3 rounded-md border p-6">
          <p className="font-medium">Add a client to start a proposal from a template.</p>
          <Link href="/clients/new" className={buttonVariants()}>Add a client</Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <article key={t.id} className="bg-card flex min-w-0 flex-col gap-4 rounded-md border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="flex items-center gap-2 font-medium"><FileText aria-hidden className="text-muted-foreground size-4 shrink-0" /><span className="truncate">{t.name}</span></h2>
                  <p className="text-muted-foreground text-sm">{t.businessName} · {t.sectionCount} {t.sectionCount === 1 ? "section" : "sections"}</p>
                </div>
                <form action={deleteTemplateAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" size="icon" variant="ghost" className="size-7 max-md:size-11" aria-label={`Delete template ${t.name}`}><Trash2 /></Button>
                </form>
              </div>
              <form action={useTemplate} className="flex flex-col gap-2">
                <input type="hidden" name="templateId" value={t.id} />
                <Input name="title" defaultValue={t.name} aria-label={`Title for the new proposal from ${t.name}`} required />
                <select name="clientId" defaultValue={clients[0].id} aria-label={`Client for the new proposal from ${t.name}`} className={select}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>
                  ))}
                </select>
                <Button type="submit">Create draft</Button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
