"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { addDays } from "@/lib/dates";
import { checkItem, type DraftItem } from "@/lib/invoice-form";
import { computeTotals, parseMoney, parseQty } from "@/lib/invoice-math";
import { formatMoney } from "@/lib/money";
import { percentToBp } from "@/lib/business-form";
import { saveInvoice, type InvoiceFormState } from "./actions";
import { InvoicePreview, type PreviewBusiness, type PreviewItem } from "./invoice-preview";

export type EditorBusiness = PreviewBusiness & { taxRate: string; termsDays: number; numberPrefix: string; nextNumber: number };
export type EditorClient = { id: number; name: string; company: string | null; email: string | null; address: string | null };
export type EditorDefaults = {
  id: number | null;
  number: string | null;
  businessId: number;
  clientId: number | null;
  issueDate: string;
  dueDate: string;
  notes: string;
  items: DraftItem[];
};

const blankItem = (taxRate: string): DraftItem => ({ description: "", qty: "1", unitPrice: "", taxRate });

export function InvoiceEditor({
  defaults,
  businesses,
  clients,
}: {
  defaults: EditorDefaults;
  businesses: EditorBusiness[];
  clients: EditorClient[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<InvoiceFormState, FormData>(saveInvoice.bind(null, defaults.id), null);
  const [businessId, setBusinessId] = useState(defaults.businessId);
  const [clientId, setClientId] = useState(defaults.clientId ?? 0);
  const [issueDate, setIssueDate] = useState(defaults.issueDate);
  const [dueDate, setDueDate] = useState(defaults.dueDate);
  const [notes, setNotes] = useState(defaults.notes);
  const [items, setItems] = useState<DraftItem[]>(defaults.items);
  const creating = defaults.id === null;
  const business = businesses.find((b) => b.id === businessId) ?? businesses[0];
  const client = clients.find((c) => c.id === clientId) ?? null;
  const e = state?.errors ?? {};

  useEffect(() => {
    if (state?.saved && creating) router.push(`/invoices/${state.saved}`);
  }, [state, creating, router]);

  // Lines that are not valid yet show as zero in the preview instead of blocking it.
  const previewItems: PreviewItem[] = useMemo(
    () =>
      items.map((i) => ({
        description: i.description.trim(),
        qtyMilli: parseQty(i.qty) ?? 0,
        unitPriceCents: parseMoney(i.unitPrice) ?? 0,
        taxRateBp: percentToBp(i.taxRate || "0") ?? 0,
      })),
    [items],
  );
  const totals = computeTotals(previewItems);
  const money = (c: number) => formatMoney(c, business.currency);

  const setItem = (n: number, patch: Partial<DraftItem>) =>
    setItems((cur) => cur.map((it, i) => (i === n ? { ...it, ...patch } : it)));

  function changeBusiness(id: number) {
    const next = businesses.find((b) => b.id === id);
    if (!next) return;
    setBusinessId(id);
    setDueDate(addDays(issueDate, next.termsDays));
    setItems((cur) => cur.map((it) => (it.description || it.unitPrice ? it : { ...it, taxRate: next.taxRate })));
  }

  function changeIssueDate(value: string) {
    setIssueDate(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) setDueDate(addDays(value, business.termsDays));
  }

  const number = defaults.number ?? `${business.numberPrefix}-${String(business.nextNumber).padStart(4, "0")}`;

  return (
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="flex flex-col gap-5">
        {state?.saved && !creating && (
          <p role="status" className="bg-success-soft text-success rounded-input text-13 px-3 py-2">Saved.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="businessId" label="Business" error={e.businessId} hint={creating ? undefined : "Fixed once the draft has a number."}>
            <Select id="businessId" name="businessId" value={businessId} disabled={!creating} onChange={(ev) => changeBusiness(Number(ev.target.value))}>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
            </Select>
            {!creating && <input type="hidden" name="businessId" value={businessId} />}
          </Field>
          <Field id="clientId" label="Client" error={e.clientId}>
            <Select id="clientId" name="clientId" value={clientId} onChange={(ev) => setClientId(Number(ev.target.value))} aria-invalid={e.clientId ? true : undefined} aria-describedby={e.clientId ? "clientId-msg" : undefined}>
              <option value={0}>Pick a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>)}
            </Select>
          </Field>
          <Field id="issueDate" label="Issue date" error={e.issueDate}>
            <Input id="issueDate" name="issueDate" type="date" value={issueDate} onChange={(ev) => changeIssueDate(ev.target.value)} className="font-mono" aria-invalid={e.issueDate ? true : undefined} />
          </Field>
          <Field id="dueDate" label="Due date" error={e.dueDate} hint={`Net ${business.termsDays} days by default.`}>
            <Input id="dueDate" name="dueDate" type="date" value={dueDate} onChange={(ev) => setDueDate(ev.target.value)} className="font-mono" aria-invalid={e.dueDate ? true : undefined} />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-base font-semibold">Line items</legend>
          <ul className="flex flex-col gap-3">
            {items.map((it, n) => {
              const problem = it.description || it.unitPrice ? checkItem(it) : null;
              return (
                <li key={n} className="bg-card rounded-card flex flex-col gap-3 border p-3">
                  <Field id={`desc-${n}`} label="Description">
                    <Input id={`desc-${n}`} value={it.description} onChange={(ev) => setItem(n, { description: ev.target.value })} />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field id={`qty-${n}`} label="Qty">
                      <Input id={`qty-${n}`} inputMode="decimal" value={it.qty} onChange={(ev) => setItem(n, { qty: ev.target.value })} className="font-mono" />
                    </Field>
                    <Field id={`price-${n}`} label="Unit price">
                      <Input id={`price-${n}`} inputMode="decimal" value={it.unitPrice} onChange={(ev) => setItem(n, { unitPrice: ev.target.value })} className="font-mono" />
                    </Field>
                    <Field id={`tax-${n}`} label="Tax %">
                      <Input id={`tax-${n}`} inputMode="decimal" value={it.taxRate} onChange={(ev) => setItem(n, { taxRate: ev.target.value })} className="font-mono" />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className={problem ? "text-danger text-13" : "text-muted-foreground text-13"} role={problem ? "alert" : undefined}>
                      {problem ?? "Line total"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-13 tabular-nums">{money(computeTotals([previewItems[n]]).subtotalCents)}</span>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove line ${n + 1}`} disabled={items.length === 1} onClick={() => setItems((cur) => cur.filter((_, i) => i !== n))}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {e.items && <p role="alert" className="text-danger text-13">{e.items}</p>}
          <Button type="button" variant="outline" className="w-fit" onClick={() => setItems((cur) => [...cur, blankItem(business.taxRate)])}>
            <Plus />Add line
          </Button>
        </fieldset>

        <Field id="notes" label="Notes" hint="Shown at the bottom of the invoice.">
          <Textarea id="notes" name="notes" rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} />
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : creating ? "Create draft" : "Save changes"}</Button>
          <span className="text-muted-foreground text-13">Total <span className="text-foreground font-mono font-medium tabular-nums">{money(totals.totalCents)}</span></span>
        </div>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <h2 className="text-muted-foreground text-13 mb-2 font-medium">Preview</h2>
        <InvoicePreview business={business} client={client} number={number} issueDate={issueDate} dueDate={dueDate} items={previewItems} notes={notes} />
      </div>
    </form>
  );
}
