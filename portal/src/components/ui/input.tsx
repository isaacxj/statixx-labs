import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "bg-card placeholder:text-muted-foreground h-9 w-full rounded-sm border px-3 text-sm transition-colors duration-150 max-sm:h-11 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
