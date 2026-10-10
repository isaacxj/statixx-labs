import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-card rounded-card mx-auto mt-10 flex max-w-md flex-col items-center gap-3 border p-10 text-center">
      <FileQuestion className="text-muted-foreground size-6" aria-hidden />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-13">That page does not exist, or the record was removed.</p>
      <Button asChild><Link href="/">Back to the dashboard</Link></Button>
    </div>
  );
}
