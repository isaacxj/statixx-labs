export const MAX_NAME = 120;
export const MAX_REASON = 1000;

/** A proposal can be answered only while it is out with the client. */
export const canRespond = (status: string) => status === "sent" || status === "viewed";

/** Accepted proposals are frozen: no edits to sections, pricing or terms. */
export const isLocked = (status: string) => status === "accepted";

/** The typed signature: single line, trimmed, at least two characters. */
export function cleanSignature(input: string): string | null {
  const name = input.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
  return name.length >= 2 ? name : null;
}

export function cleanReason(input: string): string {
  return input.replace(/\r\n/g, "\n").trim().slice(0, MAX_REASON);
}

/** Client IP from the proxy headers, or null when none is present or it doesn't look like an address. */
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const raw = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  const ip = raw?.trim() ?? "";
  return /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : null;
}

/** Only ids that belong to optional items can be selected; everything else in the request is ignored. */
export function pickSelectable(requested: unknown, optionalIds: number[]): number[] {
  if (!Array.isArray(requested)) return [];
  const allowed = new Set(optionalIds);
  return [...new Set(requested.filter((n): n is number => Number.isInteger(n) && allowed.has(n)))];
}
