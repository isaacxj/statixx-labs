"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastInput = { message: string; undo?: () => Promise<unknown> | unknown };
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const LIFETIME_MS = 6000;

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((all) => all.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = next.current++;
      setItems((all) => [...all.slice(-2), { ...t, id }]);
      timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME_MS));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-stretch gap-2 md:inset-x-auto md:right-4 md:bottom-4 md:w-96"
      >
        {items.map((t) => (
          <div key={t.id} className="animate-fade-in bg-card rounded-card text-13 pointer-events-auto flex items-center gap-2 border py-2 pr-2 pl-4 shadow-[var(--shadow-overlay)]">
            <p className="flex-1">{t.message}</p>
            {t.undo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  dismiss(t.id);
                  await t.undo?.();
                }}
              >
                Undo
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X /></Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
