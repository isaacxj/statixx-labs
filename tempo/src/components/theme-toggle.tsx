"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDER = ["system", "light", "dark"] as const;
type Theme = (typeof ORDER)[number];
const LABELS: Record<Theme, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("tempo-theme");
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage after mount
    if (saved === "light" || saved === "dark") setTheme(saved);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!localStorage.getItem("tempo-theme")) applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    try {
      if (next === "system") localStorage.removeItem("tempo-theme");
      else localStorage.setItem("tempo-theme", next);
    } catch {}
    applyTheme(next);
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={`${LABELS[theme]}. Switch theme`} title={LABELS[theme]}>
      <Icon />
    </Button>
  );
}
