/** A random 192-bit token, base64url encoded (32 characters). */
export function newShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_");
}

export const isShareToken = (s: string) => /^[A-Za-z0-9_-]{32}$/.test(s);

/** A business accent as a safe `#rrggbb` value, falling back to the app violet. */
export function safeAccent(hex: string | null | undefined): string {
  return hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#8B5CF6";
}

/** Black or white text, whichever contrasts more with the accent. */
export function accentForeground(hex: string): "#000000" | "#ffffff" {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const n = parseInt(hex.slice(1), 16);
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
}
