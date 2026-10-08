"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLineItemAction, deleteLineItemAction, saveLineItemAction } from "@/app/proposals/[id]/actions";
import { centsToInput, counts, lineTotal, milliToInput, parseCents, parseQtyMilli } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import type { LineItem } from "@/server/db/schema";

type Props = {
  proposalId: number;
  sectionId: number;
  currency: "USD" | "CAD";
  lines: LineItem[];
  onLines: (lines: LineItem[]) => void;
  onSaving: (saving: boolean) => void;
};

export function PricingPanel({ proposalId, sectionId, currency, lines, onLines, onSaving }: Props) {
  const mine = lines.filter((l) => l.sectionId === sectionId);

  const run = async (job: Promise<{ lines: LineItem[] }>) => {
    onSaving(true);
    try {
      onLines((await job).lines);
    } finally {
      onSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {mine.length === 0 ? <p className="text-muted-foreground text-sm">No line items yet.</p> : null}
      <ul className="flex flex-col gap-3">
        {mine.map((l) => (
          <Row key={l.id} line={l} currency={currency} save={(f) => {
              // Flags flip immediately; the server's rows replace them when the save returns.
              const flags: Partial<LineItem> = {};
              if (f.recurring === "none" || f.recurring === "monthly") flags.recurring = f.recurring;
              if (typeof f.optional === "boolean") flags.optional = f.optional;
              if (typeof f.selected === "boolean") flags.selected = f.selected;
              if (Object.keys(flags).length) onLines(lines.map((x) => (x.id === l.id ? { ...x, ...flags } : x)));
              return run(saveLineItemAction(proposalId, l.id, f));
            }} remove={() => run(deleteLineItemAction(proposalId, l.id))} />
        ))}
      </ul>
      <div>
        <Button size="sm" variant="outline" onClick={() => void run(addLineItemAction(proposalId, sectionId))}>
          <Plus />Add line item
        </Button>
      </div>
    </div>
  );
}

type RowProps = {
  line: LineItem;
  currency: "USD" | "CAD";
  save: (fields: { description?: string; qty?: string; unitPrice?: string; recurring?: string; optional?: boolean; selected?: boolean }) => Promise<void>;
  remove: () => Promise<void>;
};

function Row({ line, currency, save, remove }: RowProps) {
  const [desc, setDesc] = useState(line.description);
  const [qty, setQty] = useState(milliToInput(line.qtyMilli));
  const [price, setPrice] = useState(centsToInput(line.unitPriceCents));
  // Drafts normalise on blur; an entry that doesn't parse snaps back to the stored value.
  const commitQty = () => {
    const v = parseQtyMilli(qty);
    if (v === null) return setQty(milliToInput(line.qtyMilli));
    setQty(milliToInput(v));
    if (v !== line.qtyMilli) void save({ qty });
  };
  const commitPrice = () => {
    const v = parseCents(price);
    if (v === null) return setPrice(centsToInput(line.unitPriceCents));
    setPrice(centsToInput(v));
    if (v !== line.unitPriceCents) void save({ unitPrice: price });
  };

  const id = `li-${line.id}`;
  return (
    <li className="bg-background grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_6rem_8rem_8rem] md:items-end">
      <label className="flex flex-col gap-1 text-xs md:col-start-1">
        <span className="text-muted-foreground">Description</span>
        <Input id={`${id}-d`} value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== line.description && void save({ description: desc })} placeholder="What the client is paying for" maxLength={200} />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Qty</span>
        <Input id={`${id}-q`} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} onBlur={commitQty} className="tabular font-mono" />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Unit price</span>
        <Input id={`${id}-p`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={commitPrice} className="tabular font-mono" />
      </label>
      <p className="tabular text-right font-mono text-sm max-md:text-left">
        <span className="text-muted-foreground block text-xs md:hidden">Line total</span>
        {formatMoney(lineTotal(line), currency)}
        {line.recurring === "monthly" ? <span className="text-muted-foreground text-xs"> /mo</span> : null}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:col-span-4">
        <label className="flex items-center gap-2 max-md:min-h-11">
          <input type="checkbox" className="size-4" checked={line.recurring === "monthly"} onChange={(e) => void save({ recurring: e.target.checked ? "monthly" : "none" })} />
          Monthly
        </label>
        <label className="flex items-center gap-2 max-md:min-h-11">
          <input type="checkbox" className="size-4" checked={line.optional} onChange={(e) => void save({ optional: e.target.checked })} />
          Optional
        </label>
        {line.optional ? (
          <label className="flex items-center gap-2 max-md:min-h-11">
            <input type="checkbox" className="size-4" checked={line.selected} onChange={(e) => void save({ selected: e.target.checked })} />
            Included in total
          </label>
        ) : null}
        {!counts(line) ? <span className="text-muted-foreground text-xs">Not in totals</span> : null}
        <Button size="icon" variant="ghost" className="ml-auto max-md:size-11" aria-label="Delete line item" onClick={() => void remove()}>
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
