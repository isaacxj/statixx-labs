import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInvoice, getRetainer, listEvents, listPayments } from "@/server/db/queries";
import { canSend, canVoid, statusLabel, statusTone } from "@/lib/invoice-status";
import { formatDate, todayChicago } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { balanceCents, canRecordPayment, METHOD_LABELS } from "@/lib/payments";
import { eventLabel, formatEventTime } from "@/lib/activity";
import { InvoiceActions } from "../invoice-actions";
import { InvoiceEditor } from "../invoice-editor";
import { InvoicePreview } from "../invoice-preview";
import { PaymentSheet } from "../payment-sheet";
import { ShareLink } from "../share-link";
import { sharePath } from "@/lib/share-link";
import { centsToText, loadEditorOptions, qtyToText, rateText } from "../editor-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice · Ledger" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = /^\d+$/.test(id) ? await getInvoice(Number(id)) : null;
  if (!found) notFound();
  const { invoice, items } = found;
  const { businesses, clients } = await loadEditorOptions();
  const business = businesses.find((b) => b.id === invoice.businessId);
  if (!business) notFound();
  const editable = invoice.status === "draft";
  const paymentList = await listPayments(invoice.id);
  const eventList = await listEvents(invoice.id);
  const retainer = invoice.retainerId ? await getRetainer(invoice.retainerId) : null;
  const balance = balanceCents(invoice.totalCents, invoice.paidCents);
  const money = (c: number) => formatMoney(c, invoice.currency);
  return (
    <div className="flex flex-col gap-6">
      <Link href="/invoices" className="text-muted-foreground hover:text-foreground text-13 inline-flex w-fit items-center gap-1">
        <ChevronLeft className="size-4" />Invoices
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{invoice.number}</h1>
          <Badge tone={statusTone(invoice.status)} className="capitalize">{statusLabel(invoice.status)}</Badge>
          {retainer && (
            <Link href={`/retainers/${retainer.id}`} className="text-muted-foreground hover:text-foreground text-13 inline-flex items-center gap-1">
              <Repeat className="size-4" />{retainer.title}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canRecordPayment(invoice.status) && <PaymentSheet invoiceId={invoice.id} balanceCents={balance} today={todayChicago()} />}
          <InvoiceActions id={invoice.id} canSend={canSend(invoice.status)} canVoid={canVoid(invoice.status, invoice.paidCents)} />
        </div>
      </header>
      {editable ? (
        <InvoiceEditor
          businesses={businesses}
          clients={clients}
          defaults={{
            id: invoice.id,
            number: invoice.number,
            businessId: invoice.businessId,
            clientId: invoice.clientId,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            notes: invoice.notesMd,
            items: items.map((i) => ({
              description: i.description,
              qty: qtyToText(i.qtyMilli),
              unitPrice: centsToText(i.unitPriceCents),
              taxRate: rateText(i.taxRateBp),
            })),
          }}
        />
      ) : (
        <div className="flex max-w-3xl flex-col gap-6">
          <InvoicePreview
            business={business}
            client={clients.find((c) => c.id === invoice.clientId) ?? null}
            number={invoice.number}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
            items={items}
            notes={invoice.notesMd}
          />
          {invoice.status !== "void" && <ShareLink path={sharePath(invoice.shareToken)} />}
          <section aria-labelledby="activity-heading" className="bg-card rounded-card flex flex-col gap-4 border p-5">
            <h2 id="activity-heading" className="text-base font-semibold">Activity</h2>
            <ol className="flex flex-col">
              {eventList.map((e) => {
                const meta = JSON.parse(e.metaJson) as { amountCents?: number };
                const label = eventLabel(e.type, { amountText: meta.amountCents != null ? money(meta.amountCents) : undefined });
                return (
                  <li key={e.id} className="text-13 flex items-start gap-3 py-2">
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${e.type === "viewed" ? "bg-info" : e.type === "payment" ? "bg-success" : "bg-muted-foreground"}`} />
                    <span className="flex-1">{label}</span>
                    <time dateTime={e.at} className="text-muted-foreground font-mono tabular-nums">{formatEventTime(e.at)}</time>
                  </li>
                );
              })}
            </ol>
          </section>
          {invoice.status !== "void" && (
            <section aria-labelledby="payments-heading" className="bg-card rounded-card flex flex-col gap-4 border p-5">
              <h2 id="payments-heading" className="text-base font-semibold">Payments</h2>
              <dl className="text-13 grid grid-cols-3 gap-4">
                <div><dt className="text-muted-foreground">Total</dt><dd className="font-mono tabular-nums">{money(invoice.totalCents)}</dd></div>
                <div><dt className="text-muted-foreground">Paid</dt><dd className="font-mono tabular-nums">{money(invoice.paidCents)}</dd></div>
                <div><dt className="text-muted-foreground">Balance due</dt><dd className="font-mono font-medium tabular-nums">{money(balance)}</dd></div>
              </dl>
              {paymentList.length === 0 ? (
                <p className="text-muted-foreground text-13">No payments yet. Record one when money arrives.</p>
              ) : (
                <ul className="divide-y">
                  {paymentList.map((p) => (
                    <li key={p.id} className="text-13 flex items-center justify-between gap-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-mono tabular-nums">{formatDate(p.paidOn)}</span>
                        <span className="text-muted-foreground">{METHOD_LABELS[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                      </div>
                      <span className="font-mono font-medium tabular-nums">{money(p.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
