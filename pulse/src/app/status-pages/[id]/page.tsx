import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { DeleteStatusPage } from "@/components/status-page-delete";
import { StatusPageForm } from "@/components/status-page-form";
import { StatusPageMonitors } from "@/components/status-page-monitors";
import { getStatusPage, listMonitors } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function StatusPageAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId)) notFound();
  const [found, monitors] = await Promise.all([getStatusPage(pageId), listMonitors()]);
  if (!found) notFound();
  const { page, items } = found;

  return (
    <AppShell title={page.title}>
      <Link href="/status-pages" className="text-muted-foreground hover:text-foreground mb-4 inline-flex min-h-11 items-center gap-1 text-sm sm:min-h-8">
        <ChevronLeft className="size-4" aria-hidden /> All status pages
      </Link>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: page.accent }} aria-hidden />
            <h2 className="truncate text-xl font-semibold">{page.title}</h2>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-sm">/s/{page.slug}</p>
        </div>
        <DeleteStatusPage id={page.id} title={page.title} redirectTo="/status-pages" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
        <section aria-labelledby="branding-heading" className="flex min-w-0 flex-col gap-4">
          <h3 id="branding-heading" className="text-lg font-semibold">Branding</h3>
          <StatusPageForm page={{ id: page.id, title: page.title, slug: page.slug, accent: page.accent, introMd: page.introMd }} />
        </section>
        <section aria-labelledby="components-heading" className="flex min-w-0 flex-col gap-4">
          <div>
            <h3 id="components-heading" className="text-lg font-semibold">Monitors on this page</h3>
            <p className="text-muted-foreground mt-1 text-sm">Tick the monitors to show, rename them for clients, and set the order.</p>
          </div>
          <StatusPageMonitors
            key={items.map((i) => `${i.monitorId}:${i.displayName}`).join("|")}
            pageId={page.id}
            monitors={monitors.map((m) => ({ id: m.id, name: m.name, client: m.client }))}
            items={items}
          />
        </section>
      </div>
    </AppShell>
  );
}
