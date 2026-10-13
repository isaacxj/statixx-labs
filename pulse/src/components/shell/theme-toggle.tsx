"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "Match system", light: "Light", dark: "Dark" };

export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem("theme") as Theme | null;
    return saved && ORDER.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void) {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    applyTheme(readTheme());
    onChange();
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener("theme-change", onChange);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener("theme-change", onChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    try { localStorage.setItem("theme", next); } catch {}
    applyTheme(next);
    window.dispatchEvent(new Event("theme-change"));
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={`Theme: ${LABEL[theme]}. Switch theme`} title={`Theme: ${LABEL[theme]}`}>
      <Icon />
    </Button>
  );
}
