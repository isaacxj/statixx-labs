"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";
const order: Theme[] = ["system", "light", "dark"];
const icons = { system: Monitor, light: Sun, dark: Moon };

export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("theme");
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    applyTheme(next);
  }

  const Icon = icons[theme];
  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={`Theme: ${theme}. Switch theme`} title={`Theme: ${theme}`}>
      <Icon />
    </Button>
  );
}
