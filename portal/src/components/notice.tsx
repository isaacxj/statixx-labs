import { cn } from "@/lib/utils";

/** Result of the last action, passed through the URL: green for saved, red for an error. */
export function Notice({ saved, error }: { saved?: string; error?: string }) {
  const message = error ?? saved;
  if (!message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", error ? "border-danger text-danger" : "border-success text-success")}
    >
      {message}
    </p>
  );
}
