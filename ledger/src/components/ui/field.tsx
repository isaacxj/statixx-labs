import * as React from "react";
import { cn } from "@/lib/utils";

const control =
  "bg-card placeholder:text-muted-foreground w-full rounded-input border border-input px-3 text-sm transition-colors duration-150 ease-out disabled:opacity-50 aria-[invalid=true]:border-danger";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-13 font-medium", className)} {...props} />;
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-9 max-md:h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(control, "h-9 max-md:h-11", className)} {...props} />;
}

/** A label, a control, and an optional hint or error, wired together by id. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-danger text-13" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-muted-foreground text-13">{hint}</p>
      ) : null}
    </div>
  );
}
