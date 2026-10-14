"use client";

import { StatePage } from "@/components/ui/state-page";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return <StatePage title="Something went wrong" body="This page couldn't load. Your changes so far are saved." action={{ label: "Try again", onClick: reset }} />;
}
