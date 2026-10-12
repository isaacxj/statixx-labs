import { Download, File as FileIcon, FileArchive, FileImage, FileSpreadsheet, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_FILE_BYTES, fileKind, formatFileSize, type FileKind } from "@/lib/files";
import { formatPostedAt } from "@/lib/updates";
import type { ProjectFile } from "@/server/db/schema";
import { deleteFileAction, uploadFileAction } from "@/app/projects/actions";

const ICONS: Record<FileKind, typeof FileIcon> = {
  image: FileImage,
  pdf: FileText,
  document: FileText,
  sheet: FileSpreadsheet,
  archive: FileArchive,
  other: FileIcon,
};

/** Files shared on a project, newest first. Team can upload and remove; everyone allowed here can download. */
export function FileList({ projectId, items, canEdit }: { projectId: number; items: ProjectFile[]; canEdit: boolean }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="files-heading">
      <h2 id="files-heading" className="text-base font-semibold">Files</h2>
      {canEdit && (
        <form action={uploadFileAction.bind(null, projectId)} className="bg-card flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Upload a file (up to {formatFileSize(MAX_FILE_BYTES)})
            <input
              type="file"
              name="file"
              required
              className="border-input bg-background file:bg-secondary file:text-secondary-foreground focus-visible:ring-ring w-full rounded-md border text-sm file:mr-3 file:h-9 file:border-0 file:px-3 file:text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </label>
          <Button type="submit">
            <Upload /> Upload
          </Button>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground bg-card rounded-md border p-4 text-sm">
          {canEdit ? "No files yet. Upload the first one above." : "No files have been shared on this project yet."}
        </p>
      ) : (
        <ul className="bg-card divide-y rounded-md border">
          {items.map((f) => {
            const Icon = ICONS[fileKind(f.name)];
            return (
              <li key={f.id} className="flex items-center gap-3 p-3">
                <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-muted-foreground font-mono text-xs tabular-nums">
                    {formatFileSize(f.size)} · {formatPostedAt(f.createdAt)}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon" aria-label={`Download ${f.name}`}>
                  <a href={`/files/${f.id}`} download>
                    <Download />
                  </a>
                </Button>
                {canEdit && (
                  <form action={deleteFileAction.bind(null, projectId, f.id)}>
                    <Button type="submit" variant="ghost" size="icon" aria-label={`Remove ${f.name}`}>
                      <Trash2 />
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
