"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export type ShortcutsHandle = { open: () => void };

const shortcuts = [
  ["⌘K / Ctrl K", "Open the command palette"],
  ["N", "New proposal"],
  ["?", "Show this list"],
  ["↑ ↓ Enter", "Move through and pick palette results"],
  ["Esc", "Close any dialog"],
];

export const ShortcutsDialog = forwardRef<ShortcutsHandle>(function ShortcutsDialog(_, ref) {
  const dialog = useRef<HTMLDialogElement>(null);
  useImperativeHandle(ref, () => ({ open: () => dialog.current?.showModal() }));
  return (
    <dialog
      ref={dialog}
      aria-label="Keyboard shortcuts"
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-lg border bg-popover p-4 text-popover-foreground shadow-overlay backdrop:bg-foreground/20"
    >
      <h2 className="mb-3 text-base font-semibold">Keyboard shortcuts</h2>
      <dl className="flex flex-col gap-2 text-sm">
        {shortcuts.map(([keys, what]) => (
          <div key={keys} className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{what}</dt>
            <dd><kbd className="tabular rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-xs">{keys}</kbd></dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
});
