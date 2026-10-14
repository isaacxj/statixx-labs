import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { todayChicago } from "@/lib/dates";
import { DIGEST_SETTING, digestSubject, digestText, sumLabel, type DigestInvoice } from "@/lib/digest";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getDigestData, getSetting } from "@/server/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Digest · Ledger" };

function Section({ title, tone, hint, invoices }: { title: string; tone: "danger" | "warning" | "info"; hint: string; invoices: DigestInvoice[] }) {
  return (
    <section className="bg-card rounded-card flex flex-col border">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-16 font-semibold">{title}</h2>
          <Badge tone={tone}>{invoices.length}</Badge>
        </div>
        {invoices.length > 0 && <span className="text-muted-foreground font-mono text-13 tabular-nums">{sumLabel(invoices)}</span>}
      </header>
      {invoices.length === 0 ? (
        <p className="text-muted-foreground px-4 py-3 text-13">{hint}</p>
      ) : (
        <ul className="divide-border divide-y">
          {invoices.map((i) => (
            <li key={i.id}>
              <Link href={`/invoices/${i.id}`} className="hover:bg-accent flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors duration-150 ease-out max-md:min-h-11">
                <span className="flex flex-col">
                  <span className="font-mono text-13">{i.number}</span>
                  <span className="text-muted-foreground text-13">{i.clientName} · {i.businessName}</span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="font-mono text-13 tabular-nums">{formatMoney(i.balanceCents, i.currency)}</span>
                  <span className="text-muted-foreground font-mono text-13">Due {formatDate(i.dueDate)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DigestPage() {
  const [data, recipient] = await Promise.all([getDigestData(), getSetting(DIGEST_SETTING)]);
  const today = todayChicago();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Digest</h1>
        <p className="text-muted-foreground">What tomorrow morning&apos;s email will say, based on today&apos;s invoices.</p>
      </header>
      <div className="bg-card rounded-card flex flex-wrap items-center justify-between gap-3 border p-4">
        <div className="flex flex-col gap-0.5 text-13">
          <span><span className="text-muted-foreground">To </span><span className="font-mono">{recipient ?? "no recipient set"}</span></span>
          <span><span className="text-muted-foreground">Subject </span>{digestSubject(data, today)}</span>
        </div>
        {!recipient && <Button asChild variant="outline"><Link href="/settings">Set recipient</Link></Button>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Section title="Overdue" tone="danger" hint="Nothing is overdue." invoices={data.overdue} />
          <Section title="Due this week" tone="warning" hint="Nothing falls due in the next 7 days." invoices={data.dueSoon} />
          <Section title="New retainer invoices" tone="info" hint="No retainer invoices were created in the last day." invoices={data.newRetainer} />
        </div>
        <section className="bg-card rounded-card flex flex-col gap-2 self-start border p-4">
          <h2 className="text-16 font-semibold">Email text</h2>
          <pre className="bg-muted rounded-input overflow-x-auto p-3 font-mono text-13 whitespace-pre-wrap">{digestText(data, today)}</pre>
        </section>
      </div>
    </div>
  );
}
