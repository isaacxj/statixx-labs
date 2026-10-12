"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-12">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">The page couldn&apos;t load. Try again; your changes so far are saved.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
