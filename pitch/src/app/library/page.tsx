import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { groupByCategory } from "@/lib/library-form";
import { listLibrary } from "@/server/db/queries";
import { deleteLibraryEntry } from "./actions";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const groups = groupByCategory(await listLibrary(q));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-muted-foreground text-sm">Reusable sections. Insert one from a proposal&apos;s editor; the proposal gets its own copy.</p>
      </div>
      <form role="search" className="relative max-w-sm">
        <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input name="q" type="search" defaultValue={q} placeholder="Search title, category or text" aria-label="Search the library" className="pl-9" />
      </form>
      {groups.length === 0 ? (
        <div className="bg-card flex flex-col gap-1 rounded-md border p-6">
          <p className="font-medium">{q ? `Nothing matches “${q}”.` : "The library is empty."}</p>
          {q ? null : <p className="text-muted-foreground text-sm">Open a proposal, pick a text section, and choose Save to library.</p>}
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.category} aria-label={g.category} className="flex flex-col gap-3">
            <h2 className="text-muted-foreground text-sm font-medium">{g.category}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {g.entries.map((e) => (
                <article key={e.id} className="bg-card flex min-w-0 flex-col gap-3 rounded-md border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{e.title}</h3>
                    <form action={deleteLibraryEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <Button type="submit" size="icon" variant="ghost" className="size-7 max-md:size-11" aria-label={`Delete ${e.title} from the library`}>
                        <Trash2 />
                      </Button>
                    </form>
                  </div>
                  <div className="max-h-48 overflow-hidden text-sm">
                    {e.bodyMd.trim() ? <Markdown source={e.bodyMd} /> : <p className="text-muted-foreground">No text.</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
