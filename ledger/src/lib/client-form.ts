export type ClientInput = {
  name: string;
  company: string | null;
  email: string | null;
  address: string | null;
};

export type ClientErrors = Partial<Record<"name" | "email", string>>;

const str = (d: FormData, k: string) => String(d.get(k) ?? "").trim();

export function parseClientForm(
  data: FormData,
): { ok: true; value: ClientInput } | { ok: false; errors: ClientErrors } {
  const errors: ClientErrors = {};
  const name = str(data, "name");
  if (!name) errors.name = "Enter a name.";
  const email = str(data, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { name, company: str(data, "company") || null, email: email || null, address: str(data, "address") || null },
  };
}

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
export function likePattern(q: string): string {
  return `%${q.trim().replace(/[\\%_]/g, "\\$&")}%`;
}
