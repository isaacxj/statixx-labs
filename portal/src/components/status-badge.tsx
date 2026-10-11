import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/status";
import type { ProjectStatus } from "@/server/db/schema";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
