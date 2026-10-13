import { CheckCircle2, CircleDashed, PauseCircle, Wrench, XCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusKind = "up" | "degraded" | "down" | "maintenance" | "pending" | "paused";

const STATUS: Record<StatusKind, { label: string; icon: LucideIcon; className: string }> = {
  up: { label: "Up", icon: CheckCircle2, className: "text-status-up" },
  degraded: { label: "Degraded", icon: AlertTriangle, className: "text-status-degraded" },
  down: { label: "Down", icon: XCircle, className: "text-status-down" },
  maintenance: { label: "Maintenance", icon: Wrench, className: "text-status-maintenance" },
  pending: { label: "Pending", icon: CircleDashed, className: "text-muted-foreground" },
  paused: { label: "Paused", icon: PauseCircle, className: "text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: StatusKind; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", tone, className)}>
      <Icon className="size-4" aria-hidden />
      {label}
    </span>
  );
}
