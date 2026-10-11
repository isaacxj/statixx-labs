import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "bg-card h-9 w-full rounded-input border border-input px-3 text-base transition-colors duration-150 ease-out placeholder:text-muted-foreground disabled:opacity-50 max-md:h-11";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, className)} {...props} />;
}

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, className)} {...props} />;
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

export { Input, Select, Label };
