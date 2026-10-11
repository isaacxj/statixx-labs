"use client";

import { Toaster as Sonner } from "sonner";

/** Toasts styled through the design tokens; bottom-center clears the phone nav. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={{ bottom: 16 }}
      mobileOffset={{ bottom: 72 }}
      toastOptions={{
        classNames: {
          toast: "!bg-popover !text-popover-foreground !border-border !rounded-card !shadow-[var(--overlay-shadow)] !font-sans",
          actionButton: "!bg-primary !text-primary-foreground",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
