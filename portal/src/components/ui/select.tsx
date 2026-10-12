import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn("bg-card h-9 rounded-sm border px-2 text-sm transition-colors duration-150 max-sm:h-11 disabled:opacity-50", className)}
      {...props}
    />
  );
}
