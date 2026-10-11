"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatDuration } from "@/lib/format";
import { groupProjects, parseTimeExport, suggestProject, type ParsedImport } from "@/lib/import";
import { runImport } from "@/app/import/actions";

type ProjectOption = { id: number; name: string; clientName: string };

export function ImportWizard({ projects }: { projects: ProjectOption[] }) {
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setError(null);
    setParsed(null);
    if (!file) return;
    const result = parseTimeExport(await file.text());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFileName(file.name);
    setParsed(result.data);
    const next: Record<string, string> = {};
    for (const g of groupProjects(result.data.rows)) next[g.key] = String(suggestProject(g, projects) ?? "new");
    setMapping(next);
  }

  function submit() {
    if (!parsed) return;
    const resolved: Record<string, number | "new"> = {};
    for (const [key, v] of Object.entries(mapping)) resolved[key] = v === "new" ? "new" : Number(v);
    startTransition(async () => {
      const state = await runImport({ rows: parsed.rows, mapping: resolved });
      if (state?.error) {
        setError(state.error);
        return;
      }
      const r = state?.result;
      if (!r) return;
      toast.success(
        `Imported ${r.imported} ${r.imported === 1 ? "entry" : "entries"}` +
          (r.projectsCreated ? `, created ${r.projectsCreated} ${r.projectsCreated === 1 ? "project" : "projects"}` : "") +
          (r.duplicates ? `, skipped ${r.duplicates} already imported` : ""),
      );
      setParsed(null);
      setFileName("");
    });
  }

  const groups = parsed ? groupProjects(parsed.rows) : [];
  const totalMinutes = parsed ? parsed.rows.reduce((s, r) => s + r.minutes, 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-card flex flex-col gap-2 border p-4">
        <Label htmlFor="export-file">Toggl or Clockify CSV</Label>
        <div className="flex items-center gap-3">
          <FileUp className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <Input id="export-file" type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="h-auto py-1.5" />
        </div>
        {error && (
          <p className="text-danger text-sm" role="alert">
            {error}
          </p>
        )}
      </div>

      {parsed && (
        <section className="bg-card rounded-card border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">{parsed.source} export · {fileName}</h2>
            <p className="text-muted-foreground font-mono text-sm tabular-nums">
              {parsed.rows.length} entries · {formatDuration(totalMinutes)} h
              {parsed.skipped > 0 && ` · ${parsed.skipped} unreadable or under a minute, skipped`}
            </p>
          </div>
          <ul className="divide-border divide-y">
            {groups.map((g) => (
              <li key={g.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 sm:flex-1">
                  <p className="truncate font-medium">{g.project}</p>
                  <p className="text-muted-foreground truncate font-mono text-sm tabular-nums">
                    {g.client || "No client"} · {g.count} {g.count === 1 ? "entry" : "entries"} · {formatDuration(g.minutes)} h
                  </p>
                </div>
                <Select
                  aria-label={`Project for ${g.project}`}
                  value={mapping[g.key] ?? "new"}
                  onChange={(e) => setMapping((m) => ({ ...m, [g.key]: e.target.value }))}
                  className="sm:w-64"
                >
                  <option value="new">Create new project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.clientName} / {p.name}
                    </option>
                  ))}
                </Select>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto border-t">
            <table className="w-full text-left text-sm">
              <caption className="text-muted-foreground px-4 py-2 text-left text-xs">Preview of the first {Math.min(parsed.rows.length, 8)} entries</caption>
              <tbody className="divide-border divide-y">
                {parsed.rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-mono tabular-nums whitespace-nowrap">{r.day} {r.time}</td>
                    <td className="px-2 py-2 font-mono tabular-nums whitespace-nowrap">{formatDuration(r.minutes)} h</td>
                    <td className="min-w-40 px-2 py-2">{r.project}{r.description && <span className="text-muted-foreground"> · {r.description}</span>}</td>
                    <td className="text-muted-foreground px-4 py-2 text-right max-sm:hidden">{r.billable ? "Billable" : "Non-billable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t px-4 py-3">
            <Button onClick={submit} disabled={pending}>
              {pending ? "Importing…" : `Import ${parsed.rows.length} entries`}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
