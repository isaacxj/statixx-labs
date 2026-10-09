import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRate } from "@/lib/money";
import { listBusinesses } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Ledger" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ saved }, businesses] = await Promise.all([searchParams, listBusinesses()]);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Business profiles used on invoices.</p>
        </div>
        <Button asChild><Link href="/settings/businesses/new"><Plus />New business</Link></Button>
      </header>
      {saved && <p role="status" className="bg-success-soft text-success rounded-input px-3 py-2 text-13">Created {saved}.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {businesses.map((b) => (
          <li key={b.id}>
            <Link href={`/settings/businesses/${b.id}`} className="bg-card rounded-card hover:bg-accent flex items-center gap-4 border p-4 transition-colors duration-150 ease-out">
              {b.logoKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/logos/${b.id}`} alt="" className="rounded-input bg-muted size-11 border object-contain p-1" />
              ) : (
                <span aria-hidden className="rounded-input bg-muted text-muted-foreground flex size-11 items-center justify-center border font-semibold">
                  {b.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{b.name}</span>
                <span className="text-muted-foreground font-mono text-13">
                  {b.numberPrefix} · {b.currency} · tax {formatRate(b.taxRateBp)} · net {b.termsDays}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
