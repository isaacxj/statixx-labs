import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("bg-muted animate-pulse rounded-md motion-reduce:animate-none", className)} {...props} />;
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Loading" role="status" className="flex flex-col gap-6">
      {children}
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function SkeletonList({ rows = 3, rowClassName = "h-16" }: { rows?: number; rowClassName?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}
