import { sparklinePath } from "@/lib/uptime";
import { cn } from "@/lib/utils";

export function Sparkline({ values, className, label }: { values: number[]; className?: string; label: string }) {
  const path = sparklinePath(values, 96, 24);
  if (!path) return <span className={cn("text-muted-foreground inline-block w-24 font-mono text-xs", className)}>No data</span>;
  return (
    <svg viewBox="0 0 96 24" role="img" aria-label={label} className={cn("h-6 w-24 overflow-visible", className)} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
