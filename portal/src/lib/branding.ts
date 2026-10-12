export const MAX_LOGO_BYTES = 1024 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type BrandingInput = { accent: string; logo: File | null; removeLogo: boolean };

/** FormData to a validated accent plus an optional new logo (PNG, JPEG or WebP up to 1 MB). */
export function parseBrandingInput(form: FormData): Result<BrandingInput> {
  const accent = String(form.get("accent") ?? "").trim();
  if (!HEX.test(accent)) return { ok: false, error: "Accent must be a hex color like #0EA5E9." };
  const picked = form.get("logo");
  const logo = picked instanceof File && picked.size > 0 ? picked : null;
  if (logo) {
    if (!(LOGO_TYPES as readonly string[]).includes(logo.type)) return { ok: false, error: "Logo must be a PNG, JPEG, or WebP image." };
    if (logo.size > MAX_LOGO_BYTES) return { ok: false, error: "Logo can be up to 1 MB." };
  }
  return { ok: true, value: { accent: accent.toUpperCase(), logo, removeLogo: form.get("removeLogo") === "1" && !logo } };
}

function channel(hex: string, start: number): number {
  const v = parseInt(hex.slice(start, start + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #RRGGBB color. */
export function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** Whether text on this accent should be the dark or light on-accent token, whichever has more contrast. */
export function onAccent(hex: string): "dark" | "light" {
  const l = luminance(hex);
  // Contrast against white is 1.05 / (l + 0.05); against near-black it is (l + 0.05) / 0.05 (black luminance ~0).
  return 1.05 / (l + 0.05) > (l + 0.05) / 0.05 ? "light" : "dark";
}

/** CSS variable overrides that give a client's portal its own accent; falls back to nothing for an invalid color. */
export function brandVars(accent: string): Record<string, string> {
  if (!HEX.test(accent)) return {};
  return {
    "--primary": accent,
    "--ring": accent,
    "--primary-foreground": `var(--on-accent-${onAccent(accent)})`,
  };
}
