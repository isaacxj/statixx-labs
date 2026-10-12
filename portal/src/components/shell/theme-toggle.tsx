"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABELS: Record<Theme, string> = { system: "Match system", light: "Light", dark: "Dark" };
const ICONS = { system: Monitor, light: Sun, dark: Moon };
const EVENT = "theme-change";

function read(): Theme {
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "system";
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);

  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }

  const Icon = ICONS[theme];
  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={`Theme: ${LABELS[theme]}. Switch theme`} title={`Theme: ${LABELS[theme]}`}>
      <Icon />
    </Button>
  );
}
