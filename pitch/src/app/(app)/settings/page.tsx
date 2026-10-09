import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { bpToPercent } from "@/lib/business-form";
import { listBusinesses } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const businesses = await listBusinesses();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Business profiles used on proposals and client links.</p>
        </div>
        <Link href="/settings/new" className={buttonVariants()}><Plus />New profile</Link>
      </div>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {businesses.map((b) => (
          <li key={b.id}>
            <Link href={`/settings/${b.id}`} className="bg-card hover:bg-accent block rounded-md border border-t-4 p-4 transition-colors" style={{ borderTopColor: b.accent }}>
              <p className="text-lg font-medium">{b.name}</p>
              <p className="text-muted-foreground text-sm">{b.legalName ?? "No legal name"}</p>
              <dl className="tabular mt-3 flex gap-4 text-sm">
                <div><dt className="text-muted-foreground text-xs">Prefix</dt><dd>{b.numberPrefix}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Currency</dt><dd>{b.currency}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Tax</dt><dd>{bpToPercent(b.taxRateBp)}%</dd></div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
