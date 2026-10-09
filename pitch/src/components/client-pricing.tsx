"use client";

import { createContext, useContext, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { lineTotal, proposalTotals } from "@/lib/pricing";
import { acceptAction, declineAction } from "@/app/p/[token]/actions";

export type ClientLine = {
  id: number;
  sectionId: number;
  description: string;
  qtyMilli: number;
  unitPriceCents: number;
  recurring: "none" | "monthly";
  optional: boolean;
  selected: boolean;
};

type Ctx = {
  lines: ClientLine[];
  selected: Set<number>;
  toggle: (id: number) => void;
  money: (c: number) => string;
  discountBp: number;
  taxRateBp: number;
  open: boolean;
  token: string;
};

const Response = createContext<Ctx | null>(null);
const useResponse = () => {
  const c = useContext(Response);
  if (!c) throw new Error("ClientPricing parts must sit inside ResponseProvider");
  return c;
};

type ProviderProps = { token: string; lines: ClientLine[]; currency: "USD" | "CAD"; discountBp: number; taxRateBp: number; open: boolean; children: React.ReactNode };

/** Holds the optional items the client has ticked so the tables and the summary stay in step. */
export function ResponseProvider({ token, lines, currency, discountBp, taxRateBp, open, children }: ProviderProps) {
  const [selected, setSelected] = useState(() => new Set(lines.filter((l) => l.optional && l.selected).map((l) => l.id)));
  const value = useMemo<Ctx>(
    () => ({
      lines,
      selected,
      toggle: (id) =>
        setSelected((prev) => {
          const next = new Set(prev);
          if (!next.delete(id)) next.add(id);
          return next;
        }),
      money: (c) => formatMoney(c, currency),
      discountBp,
      taxRateBp,
      open,
      token,
    }),
    [lines, selected, currency, discountBp, taxRateBp, open, token],
  );
  return <Response.Provider value={value}>{children}</Response.Provider>;
}

export function ClientPricingTable({ sectionId }: { sectionId: number }) {
  const { lines, selected, toggle, money, open } = useResponse();
  const items = lines.filter((l) => l.sectionId === sectionId);
  return (
    <>
    <ul className="divide-y rounded-lg border md:hidden print:hidden">
      {items.map((i) => {
        const on = !i.optional || selected.has(i.id);
        return (
          <li key={i.id} className={`flex flex-col gap-1 px-4 py-3 ${on ? "" : "text-muted-foreground"}`}>
            {i.optional && open ? (
              <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} className="accent-primary size-5" />
                <span>{i.description || "Untitled item"}</span>
              </label>
            ) : (
              <span>{i.description || "Untitled item"}</span>
            )}
            <span className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground tabular font-mono text-xs">
                {i.qtyMilli / 1000} × {money(i.unitPriceCents)}
                {i.recurring === "monthly" ? " /mo" : ""}
                {i.optional ? " · optional" : ""}
              </span>
              <span className="tabular font-mono">{money(lineTotal(i))}</span>
            </span>
          </li>
        );
      })}
    </ul>
    <div className="hidden overflow-x-auto rounded-lg border md:block print:block print:overflow-visible">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground bg-muted/50 table-header-group text-left text-xs">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Item</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Qty</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Price</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((i) => {
            const on = !i.optional || selected.has(i.id);
            return (
              <tr key={i.id} className={`break-inside-avoid ${on ? "" : "text-muted-foreground"}`}>
                <td className="px-4 py-3">
                  {i.optional && open ? (
                    <label className="inline-flex items-center gap-2 max-md:min-h-11">
                      <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} className="accent-primary size-4" />
                      {i.description || "Untitled item"}
                    </label>
                  ) : (
                    i.description || "Untitled item"
                  )}
                  {i.optional ? <span className="bg-muted text-muted-foreground ml-2 rounded-sm px-1.5 py-0.5 text-xs">Optional</span> : null}
                  {i.recurring === "monthly" ? <span className="text-muted-foreground ml-2 text-xs">monthly</span> : null}
                </td>
                <td className="tabular px-4 py-3 text-right font-mono">{i.qtyMilli / 1000}</td>
                <td className="tabular px-4 py-3 text-right font-mono">{money(i.unitPriceCents)}</td>
                <td className="tabular px-4 py-3 text-right font-mono">{money(lineTotal(i))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}

type T = { subtotal: number; discount: number; tax: number; total: number };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt className="text-muted-foreground font-sans">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SummaryBlock({ label, t, money, suffix }: { label: string; t: T; money: (c: number) => string; suffix?: string }) {
  return (
    <dl className="tabular flex flex-col gap-1 font-mono text-sm">
      {t.discount > 0 || t.tax > 0 ? (
        <>
          <Row label="Subtotal" value={money(t.subtotal)} />
          {t.discount > 0 ? <Row label="Discount" value={`−${money(t.discount)}`} /> : null}
          {t.tax > 0 ? <Row label="Tax" value={money(t.tax)} /> : null}
        </>
      ) : null}
      <Row label={label} value={`${money(t.total)}${suffix ? ` ${suffix}` : ""}`} strong />
    </dl>
  );
}

type Mode = "idle" | "accept" | "decline";

/** Sticky totals with the Accept and Decline controls while the proposal is open. */
export function ClientSummary() {
  const { lines, selected, money, discountBp, taxRateBp, open, token } = useResponse();
  const priced = useMemo(() => lines.map((l) => ({ ...l, selected: selected.has(l.id) })), [lines, selected]);
  const totals = proposalTotals(priced, discountBp, taxRateBp);
  const hasMonthly = totals.monthly.subtotal > 0;
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [reason, setReason] = useState("");

  const submit = (run: () => Promise<{ error: string | null }>) =>
    start(async () => {
      setError(null);
      const r = await run();
      if (r.error) setError(r.error);
      else router.refresh();
    });

  const showOneTime = totals.oneTime.subtotal > 0 || !hasMonthly;

  return (
    <section aria-label="Summary" className={`bg-card flex flex-col gap-4 rounded-lg border p-4 print:static print:break-inside-avoid ${mode === "idle" ? "sticky bottom-0 md:static" : ""}`}>
      {showOneTime ? <SummaryBlock label="Total" t={totals.oneTime} money={money} /> : null}
      {hasMonthly ? <SummaryBlock label="Monthly" t={totals.monthly} money={money} suffix="/mo" /> : null}
      {open && mode === "idle" ? (
        <div className="flex gap-2 print:hidden">
          <Button className="max-md:h-11 max-md:flex-1" onClick={() => { setMode("accept"); setTimeout(() => nameRef.current?.focus(), 0); }}>
            <Check />Accept proposal
          </Button>
          <Button className="max-md:h-11 max-md:flex-1" variant="outline" onClick={() => setMode("decline")}>Decline</Button>
        </div>
      ) : null}
      {open && mode === "accept" ? (
        <form
          className="flex flex-col gap-3 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit(() => acceptAction(token, name, agreed, [...selected]));
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sig">Full name</Label>
            <Input id="sig" ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={120} />
          </div>
          <label className="flex items-start gap-2 text-sm max-md:min-h-11">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-primary mt-0.5 size-4" required />
            <span>I have read this proposal and agree to its scope, pricing and terms.</span>
          </label>
          {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Accepting…" : "Confirm acceptance"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setMode("idle"); setError(null); }}>Cancel</Button>
          </div>
        </form>
      ) : null}
      {open && mode === "decline" ? (
        <form
          className="flex flex-col gap-3 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit(() => declineAction(token, reason));
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </div>
          {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Declining…" : "Decline proposal"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setMode("idle"); setError(null); }}>Cancel</Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
