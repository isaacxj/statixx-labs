/** Initials from the part of the email before the @, e.g. isaac.joseph@x.com -> IJ. */
export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._\-+\s]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "").slice(0, 2);
  return letters.toUpperCase() || "?";
}
