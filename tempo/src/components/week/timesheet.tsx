"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { setCellAction } from "@/app/week/actions";
import { Select } from "@/components/ui/input";
import { formatDuration } from "@/lib/format";
import type { SheetRow } from "@/lib/timesheet";

type Option = { id: number; name: string; clientName: string; color: string };

const dayName = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });
const dayNum = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", day: "numeric" });

function Cell({ projectId, day, minutes, label }: { projectId: number; day: string; minutes: number; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = minutes > 0 ? formatDuration(minutes) : "";

  function commit(el: HTMLInputElement) {
    if (el.value.trim() === shown) {
      setError(null);
      return;
    }
    startTransition(async () => {
      const err = await setCellAction(projectId, day, el.value);
      setError(err);
      if (err) el.focus();
    });
  }

  return (
    <div className="relative">
      <input
        key={minutes}
        defaultValue={shown}
        inputMode="decimal"
        placeholder="–"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        disabled={pending}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = shown;
            e.currentTarget.blur();
          }
        }}
        className="bg-card rounded-input border-input placeholder:text-muted-foreground h-9 w-full border px-2 text-right font-mono text-sm tabular-nums transition-colors duration-150 ease-out disabled:opacity-50 aria-[invalid=true]:border-danger max-md:h-11"
      />
      {error && (
        <p role="alert" className="text-danger absolute top-full right-0 z-10 mt-1 w-48 text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

export function Timesheet({
  days,
  today,
  projects,
  rows,
  columnTotals,
  total,
}: {
  days: string[];
  today: string;
  projects: Option[];
  rows: SheetRow[];
  columnTotals: number[];
  total: number;
}) {
  const [extra, setExtra] = useState<number[]>([]);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const shown: SheetRow[] = [
    ...rows,
    ...extra.filter((id) => !rows.some((r) => r.projectId === id)).map((id) => ({ projectId: id, cells: days.map(() => 0), total: 0 })),
  ];
  const addable = projects.filter((p) => !shown.some((r) => r.projectId === p.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-card overflow-x-auto border">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">
                Project
              </th>
              {days.map((d) => (
                <th key={d} scope="col" className={`w-24 px-1 py-2 text-right text-xs font-medium ${d === today ? "text-primary" : "text-muted-foreground"}`}>
                  {dayName.format(new Date(`${d}T12:00:00Z`))} {dayNum.format(new Date(`${d}T12:00:00Z`))}
                </th>
              ))}
              <th scope="col" className="text-muted-foreground w-20 px-3 py-2 text-right text-xs font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const p = byId.get(r.projectId);
              const name = p?.name ?? `Project ${r.projectId}`;
              return (
                <tr key={r.projectId} className="border-b">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p?.color }} />
                      <span className="flex flex-col">
                        <span className="font-medium">{name}</span>
                        {p && <span className="text-muted-foreground text-xs">{p.clientName}</span>}
                      </span>
                    </span>
                  </th>
                  {days.map((d, i) => (
                    <td key={d} className="px-1 py-1.5">
                      <Cell projectId={r.projectId} day={d} minutes={r.cells[i]} label={`${name}, ${dayName.format(new Date(`${d}T12:00:00Z`))} ${dayNum.format(new Date(`${d}T12:00:00Z`))}`} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatDuration(r.total)}</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={9} className="text-muted-foreground px-3 py-6 text-center">
                  No time this week. Add a project row below and type hours into a day.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">
                Total
              </th>
              {columnTotals.map((m, i) => (
                <td key={days[i]} className="px-3 py-2 text-right font-mono text-sm font-medium tabular-nums">
                  {formatDuration(m)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-mono text-sm font-semibold tabular-nums">{formatDuration(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {addable.length > 0 && (
        <div className="flex items-center gap-2">
          <Plus className="text-muted-foreground size-4" aria-hidden />
          <Select
            aria-label="Add a project row"
            value=""
            onChange={(e) => setExtra((x) => [...x, Number(e.target.value)])}
            className="max-w-xs">
            <option value="">Add a project row</option>
            {addable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.clientName})
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
