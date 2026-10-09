import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "border-input bg-card placeholder:text-muted-foreground w-full rounded-sm border px-3 text-sm transition-colors duration-150 aria-[invalid=true]:border-danger disabled:opacity-50";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "h-9 max-md:h-11", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 py-2", className)} {...props} />;
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

export { Input, Textarea, Label };
