"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">The page couldn’t load. Your tracked time is safe. Try again, and if it keeps happening, reload the app.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
