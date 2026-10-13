import Link from "next/link";
import { Globe } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { DeleteStatusPage } from "@/components/status-page-delete";
import { NewStatusPageSheet } from "@/components/status-page-form";
import { listStatusPages } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function StatusPagesPage() {
  const rows = await listStatusPages();
  return (
    <AppShell title="Status pages">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">One public page per client, showing only the monitors you choose.</p>
        {rows.length > 0 ? <NewStatusPageSheet /> : null}
      </div>
      {rows.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
          <Globe className="text-muted-foreground size-5" aria-hidden />
          <p className="font-medium">No status pages yet</p>
          <p className="text-muted-foreground text-sm">Create one for a client, then pick which monitors it shows.</p>
          <NewStatusPageSheet />
        </div>
      ) : (
        <ul className="bg-card divide-y rounded-lg border">
          {rows.map(({ page, monitorCount }) => (
            <li key={page.id} className="flex items-center gap-3 px-4 py-3">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: page.accent }} aria-hidden />
              <Link href={`/status-pages/${page.id}`} className="min-w-0 flex-1 max-md:py-2">
                <p className="truncate font-medium">{page.title}</p>
                <p className="text-muted-foreground truncate font-mono text-xs">
                  /s/{page.slug} · {monitorCount === 1 ? "1 monitor" : `${monitorCount} monitors`}
                </p>
              </Link>
              <DeleteStatusPage id={page.id} title={page.title} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
