import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-13">That address does not lead anywhere in Ledger.</p>
      <Button asChild><Link href="/">Go to Ledger</Link></Button>
    </div>
  );
}
