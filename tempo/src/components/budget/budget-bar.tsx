import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/format";
import { budgetStatus } from "@/lib/budget";
import { cn } from "@/lib/utils";

const FILL = { ok: "bg-success", warning: "bg-warning", over: "bg-danger" } as const;

export function BudgetBar({ usedMinutes, budgetMinutes, className }: { usedMinutes: number; budgetMinutes: number | null; className?: string }) {
  const s = budgetStatus(usedMinutes, budgetMinutes);
  if (!s) return null;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground font-mono tabular-nums">
          {formatDuration(s.usedMinutes)} / {formatDuration(s.budgetMinutes)}h · {s.percent}%
        </span>
        {s.level === "warning" && <Badge variant="warning">Over 80% of budget</Badge>}
        {s.level === "over" && <Badge variant="danger">Over budget</Badge>}
      </div>
      <div
        role="progressbar"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(s.percent, 100)}
        className="bg-secondary h-1.5 overflow-hidden rounded-full"
      >
        <div className={cn("h-full rounded-full", FILL[s.level])} style={{ width: `${Math.min(s.percent, 100)}%` }} />
      </div>
    </div>
  );
}
