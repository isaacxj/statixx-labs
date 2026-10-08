import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-md border bg-card p-4 text-card-foreground", className)} {...props} />;
}

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-muted", className)} {...props} />;
}

export { Card, Skeleton };
