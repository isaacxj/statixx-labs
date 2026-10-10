import { formatDate } from "@/lib/dates";
import { computeTotals, lineAmountCents } from "@/lib/invoice-math";
import { formatMoney, formatRate, type CurrencyCode } from "@/lib/money";

export type PreviewBusiness = { name: string; legalName: string; address: string; accent: string; currency: CurrencyCode; hasLogo: boolean; id: number };
export type PreviewClient = { name: string; company: string | null; email: string | null; address: string | null } | null;
export type PreviewItem = { description: string; qtyMilli: number; unitPriceCents: number; taxRateBp: number };

/** The document as the client will see it. The editor and the saved invoice both render this. */
export function InvoicePreview({
  business,
  client,
  number,
  issueDate,
  dueDate,
  items,
  notes,
}: {
  business: PreviewBusiness;
  client: PreviewClient;
  number: string;
  issueDate: string;
  dueDate: string;
  items: PreviewItem[];
  notes: string;
}) {
  const totals = computeTotals(items);
  const money = (c: number) => formatMoney(c, business.currency);
  const qty = (m: number) => String(m / 1000);
  return (
    <article
      aria-label="Invoice preview"
      style={{ "--doc-accent": business.accent } as React.CSSProperties}
      className="bg-card rounded-card flex flex-col gap-6 border border-t-4 border-t-[var(--doc-accent)] p-5 md:p-8"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {business.hasLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/logos/${business.id}`} alt="" className="size-10 rounded-input object-contain" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold">{business.name}</span>
            <span className="text-muted-foreground text-13 whitespace-pre-line">{business.address}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl font-semibold tracking-tight">Invoice</span>
          <span className="font-mono text-13">{number}</span>
        </div>
      </header>
      <dl className="text-13 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Billed to</dt>
          <dd className="whitespace-pre-line">
            {client ? (
              <>
                <span className="font-medium">{client.name}</span>
                {client.company ? `\n${client.company}` : ""}
                {client.address ? `\n${client.address}` : ""}
              </>
            ) : (
              <span className="text-muted-foreground">No client picked</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Issued</dt>
          <dd className="font-mono">{issueDate ? formatDate(issueDate) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Due</dt>
          <dd className="font-mono">{dueDate ? formatDate(dueDate) : "—"}</dd>
        </div>
      </dl>
      <div className="overflow-x-auto print:overflow-visible">
        <table className="text-13 w-full">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="hidden py-2 text-right font-medium sm:table-cell">Tax</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {items.length === 0 && (
              <tr><td colSpan={5} className="text-muted-foreground py-4 text-center">Add a line to see it here.</td></tr>
            )}
            {items.map((i, n) => (
              <tr key={n}>
                <td className="py-2 pr-3 whitespace-pre-line">{i.description || "—"}</td>
                <td className="py-2 text-right font-mono tabular-nums">{qty(i.qtyMilli)}</td>
                <td className="py-2 text-right font-mono tabular-nums">{money(i.unitPriceCents)}</td>
                <td className="text-muted-foreground hidden py-2 text-right font-mono tabular-nums sm:table-cell">{formatRate(i.taxRateBp)}</td>
                <td className="py-2 text-right font-mono tabular-nums">{money(lineAmountCents(i))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="text-13 ml-auto flex w-full max-w-xs flex-col gap-1.5">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-mono tabular-nums">{money(totals.subtotalCents)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="font-mono tabular-nums">{money(totals.taxCents)}</dd></div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Total</dt><dd className="font-mono tabular-nums">{money(totals.totalCents)}</dd></div>
      </dl>
      {notes && <p className="text-muted-foreground text-13 whitespace-pre-line border-t pt-4">{notes}</p>}
    </article>
  );
}
