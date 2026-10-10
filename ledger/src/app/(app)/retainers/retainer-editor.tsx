"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { formatDate, todayChicago } from "@/lib/dates";
import { checkItem, type DraftItem } from "@/lib/invoice-form";
import { computeTotals, parseMoney, parseQty } from "@/lib/invoice-math";
import { percentToBp } from "@/lib/business-form";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { CADENCES, cadenceLabel, runDates, type Cadence } from "@/lib/retainer-schedule";
import { saveRetainer, type RetainerFormState } from "./actions";

export type RetainerBusiness = { id: number; name: string; currency: CurrencyCode; taxRate: string };
export type RetainerClient = { id: number; name: string; company: string | null };
export type RetainerDefaults = {
  id: number | null;
  businessId: number;
  clientId: number | null;
  title: string;
  cadence: Cadence;
  anchorDay: string;
  startsOn: string;
  endsOn: string;
  active: boolean;
  items: DraftItem[];
};

const blankItem = (taxRate: string): DraftItem => ({ description: "", qty: "1", unitPrice: "", taxRate });

export function RetainerEditor({
  defaults,
  businesses,
  clients,
}: {
  defaults: RetainerDefaults;
  businesses: RetainerBusiness[];
  clients: RetainerClient[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<RetainerFormState, FormData>(saveRetainer.bind(null, defaults.id), null);
  const [businessId, setBusinessId] = useState(defaults.businessId);
  const [clientId, setClientId] = useState(defaults.clientId ?? 0);
  const [title, setTitle] = useState(defaults.title);
  const [cadence, setCadence] = useState<Cadence>(defaults.cadence);
  const [anchorDay, setAnchorDay] = useState(defaults.anchorDay);
  const [startsOn, setStartsOn] = useState(defaults.startsOn);
  const [endsOn, setEndsOn] = useState(defaults.endsOn);
  const [active, setActive] = useState(defaults.active);
  const [items, setItems] = useState<DraftItem[]>(defaults.items);
  const creating = defaults.id === null;
  const business = businesses.find((b) => b.id === businessId) ?? businesses[0];
  const e = state?.errors ?? {};

  useEffect(() => {
    if (state?.saved && creating) router.push(`/retainers/${state.saved}`);
  }, [state, creating, router]);

  const lines = useMemo(
    () =>
      items.map((i) => ({
        description: i.description.trim(),
        qtyMilli: parseQty(i.qty) ?? 0,
        unitPriceCents: parseMoney(i.unitPrice) ?? 0,
        taxRateBp: percentToBp(i.taxRate || "0") ?? 0,
      })),
    [items],
  );
  const total = computeTotals(lines).totalCents;
  const money = (c: number) => formatMoney(c, business.currency);

  const day = Number(anchorDay);
  const dayOk = Number.isInteger(day) && day >= 1 && day <= 31;
  const startOk = /^\d{4}-\d{2}-\d{2}$/.test(startsOn);
  const endOk = !endsOn || /^\d{4}-\d{2}-\d{2}$/.test(endsOn);
  const upcoming =
    dayOk && startOk && endOk
      ? runDates({ cadence, anchorDay: day, startsOn, endsOn: endsOn || null }, 3, todayChicago())
      : [];

  const setItem = (n: number, patch: Partial<DraftItem>) =>
    setItems((cur) => cur.map((it, i) => (i === n ? { ...it, ...patch } : it)));

  return (
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="flex flex-col gap-5">
        {state?.saved && !creating && (
          <p role="status" className="bg-success-soft text-success rounded-input text-13 px-3 py-2">Saved.</p>
        )}
        <Field id="title" label="Title" error={e.title} hint="Shown to you only, like “Monthly hosting”.">
          <Input id="title" name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} aria-invalid={e.title ? true : undefined} aria-describedby={e.title ? "title-msg" : undefined} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="businessId" label="Business" error={e.businessId}>
            <Select id="businessId" name="businessId" value={businessId} onChange={(ev) => setBusinessId(Number(ev.target.value))}>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
            </Select>
          </Field>
          <Field id="clientId" label="Client" error={e.clientId}>
            <Select id="clientId" name="clientId" value={clientId} onChange={(ev) => setClientId(Number(ev.target.value))} aria-invalid={e.clientId ? true : undefined} aria-describedby={e.clientId ? "clientId-msg" : undefined}>
              <option value={0}>Pick a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>)}
            </Select>
          </Field>
          <Field id="cadence" label="Cadence">
            <Select id="cadence" name="cadence" value={cadence} onChange={(ev) => setCadence(ev.target.value as Cadence)}>
              {CADENCES.map((c) => <option key={c} value={c}>{cadenceLabel(c)}</option>)}
            </Select>
          </Field>
          <Field id="anchorDay" label="Anchor day" error={e.anchorDay} hint="Day of the month. Short months run on their last day.">
            <Input id="anchorDay" name="anchorDay" inputMode="numeric" value={anchorDay} onChange={(ev) => setAnchorDay(ev.target.value)} className="font-mono" aria-invalid={e.anchorDay ? true : undefined} aria-describedby="anchorDay-msg" />
          </Field>
          <Field id="startsOn" label="Starts on" error={e.startsOn}>
            <Input id="startsOn" name="startsOn" type="date" value={startsOn} onChange={(ev) => setStartsOn(ev.target.value)} className="font-mono" aria-invalid={e.startsOn ? true : undefined} />
          </Field>
          <Field id="endsOn" label="Ends on" error={e.endsOn} hint="Optional.">
            <Input id="endsOn" name="endsOn" type="date" value={endsOn} onChange={(ev) => setEndsOn(ev.target.value)} className="font-mono" aria-invalid={e.endsOn ? true : undefined} aria-describedby="endsOn-msg" />
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
                    <p className={problem ? "text-danger text-13" : "text-muted-foreground text-13"} role={problem ? "alert" : undefined}>{problem ?? "Line total"}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-13 tabular-nums">{money(computeTotals([lines[n]]).subtotalCents)}</span>
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

        <label className="text-13 flex items-center gap-2 max-md:min-h-11">
          <input type="checkbox" name="active" checked={active} onChange={(ev) => setActive(ev.target.checked)} className="size-4" />
          Active — create invoices on each run
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : creating ? "Create retainer" : "Save changes"}</Button>
          <span className="text-muted-foreground text-13">Each invoice <span className="text-foreground font-mono font-medium tabular-nums">{money(total)}</span></span>
        </div>
      </div>

      <aside className="bg-card rounded-card h-fit self-start border p-4 lg:sticky lg:top-4" aria-labelledby="next-runs">
        <h2 id="next-runs" className="text-base font-semibold">Next three invoices</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-13 mt-2">
            {dayOk && startOk && endOk ? "No runs left before the end date." : "Enter an anchor day and start date to preview the schedule."}
          </p>
        ) : (
          <ol className="divide-border mt-3 divide-y">
            {upcoming.map((d) => (
              <li key={d} className="flex items-center justify-between gap-3 py-2.5">
                <span className="font-mono text-13 tabular-nums">{formatDate(d)}</span>
                <span className="font-mono text-13 tabular-nums">{money(total)}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </form>
  );
}
