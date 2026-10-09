export type ClientInput = {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type ClientErrors = Partial<Record<keyof ClientInput, string>>;

type Source = { get(key: string): FormDataEntryValue | null };

const text = (s: Source, k: string) => String(s.get(k) ?? "").trim();

export function parseClientForm(s: Source): { value: ClientInput } | { errors: ClientErrors } {
  const errors: ClientErrors = {};
  const name = text(s, "name");
  const email = text(s, "email");
  if (!name) errors.name = "Enter a name.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      name,
      company: text(s, "company") || null,
      email: email || null,
      phone: text(s, "phone") || null,
      address: text(s, "address") || null,
    },
  };
}

/** Escapes LIKE wildcards so a search for "50%" matches literally. */
export function likePattern(query: string): string {
  return `%${query.trim().replace(/[\\%_]/g, "\\$&")}%`;
}
