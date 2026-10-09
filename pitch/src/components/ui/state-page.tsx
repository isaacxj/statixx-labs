import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void } | { label: string; href: string };
};

/** Full-width message block used by error and not-found pages. */
export function StatePage({ title, body, action }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{body}</p>
      {action ? (
        "href" in action ? (
          <Button asChild><Link href={action.href}>{action.label}</Link></Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      ) : null}
    </div>
  );
}
