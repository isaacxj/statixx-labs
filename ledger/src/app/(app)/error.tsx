"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="bg-card rounded-card mx-auto mt-10 flex max-w-md flex-col items-center gap-3 border p-10 text-center">
      <TriangleAlert className="text-danger size-6" aria-hidden />
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-13">This page could not load. Nothing was changed. Try again, or head back to the dashboard.</p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/">Dashboard</Link></Button>
      </div>
    </div>
  );
}
