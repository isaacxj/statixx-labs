export type Viewer = { email: string; variant: "team" | "client"; initials: string };

/** Splits a comma-separated email list into lowercase entries. */
export function parseEmails(list: string | undefined): string[] {
  return (list ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** Two-letter initials from an email's local part: "isaac.joseph@x.com" is "IJ", "dev@localhost" is "DE". */
export function initialsFor(email: string): string {
  const parts = (email.split("@")[0] ?? "").split(/[._+-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

export function resolveViewer(email: string, teamEmails: string | undefined): Viewer {
  const team = parseEmails(teamEmails).includes(email.trim().toLowerCase());
  return { email, variant: team ? "team" : "client", initials: initialsFor(email) };
}
