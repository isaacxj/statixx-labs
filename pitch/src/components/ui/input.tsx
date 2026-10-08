import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-sm border border-input bg-card px-3 text-sm transition-colors duration-150 placeholder:text-muted-foreground disabled:opacity-50 max-md:h-11",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
