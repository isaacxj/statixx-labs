export const MAX_LOGO_BYTES = 1024 * 1024;

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

type LogoFile = { size: number; type: string };

/** Validates an uploaded logo. SVG is refused because it can carry scripts. */
export function validateLogo(file: LogoFile): string | null {
  if (!EXT[file.type]) return "Use a PNG, JPEG, or WebP image.";
  if (file.size > MAX_LOGO_BYTES) return "Keep the logo under 1 MB.";
  return null;
}

export function logoKey(businessId: number, type: string, stamp: number): string {
  return `logos/${businessId}-${stamp}.${EXT[type] ?? "bin"}`;
}
