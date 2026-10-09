"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Toast = { id: number; message: string; action?: { label: string; run: () => void } };
type Push = (message: string, action?: Toast["action"]) => void;

const ToastContext = createContext<Push>(() => {});
export const useToast = () => useContext(ToastContext);

const TOAST_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const push = useCallback<Push>(
    (message, action) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { id, message, action }]);
      setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );
  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 max-md:bottom-20">
        {toasts.map((t) => (
          <div key={t.id} className="bg-popover text-popover-foreground pointer-events-auto flex items-center gap-2 rounded-md border p-2 pl-3 text-sm shadow-lg">
            <p className="flex-1">{t.message}</p>
            {t.action ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  t.action?.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </Button>
            ) : null}
            <Button size="icon" variant="ghost" className="size-7 max-md:size-11" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              <X />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
