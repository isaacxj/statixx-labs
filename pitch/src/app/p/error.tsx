"use client";

import { StatePage } from "@/components/ui/state-page";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="p-4">
      <StatePage title="Couldn't load this proposal" body="Something went wrong on our end. Please try again." action={{ label: "Try again", onClick: reset }} />
    </main>
  );
}
