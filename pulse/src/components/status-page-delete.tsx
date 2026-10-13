"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeStatusPage } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function DeleteStatusPage({ id, title, redirectTo }: { id: number; title: string; redirectTo?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`Delete ${title}`}
      onClick={() => {
        if (!confirm(`Delete the status page ${title}? Monitors and their history are kept.`)) return;
        start(async () => {
          await removeStatusPage(id);
          toast.success(`Deleted ${title}`);
          if (redirectTo) router.push(redirectTo);
        });
      }}
    >
      <Trash2 />
    </Button>
  );
}
