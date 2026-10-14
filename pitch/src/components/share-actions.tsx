"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, Eye, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markSentAction, shareLinkAction } from "@/app/(app)/proposals/[id]/actions";

type Props = { proposalId: number; initialToken: string | null; initialStatus: string };

export function ShareActions({ proposalId, initialToken, initialStatus }: Props) {
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [pending, start] = useTransition();

  const linkFor = (t: string) => `${window.location.origin}/p/${t}`;

  const copy = () =>
    start(async () => {
      setError(null);
      const { token: t } = await shareLinkAction(proposalId);
      if (!t) return setError("Couldn't create the link.");
      setToken(t);
      try {
        await navigator.clipboard.writeText(linkFor(t));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError(`Copy failed. The link is ${linkFor(t)}`);
      }
    });

  const markSent = () =>
    start(async () => {
      setError(null);
      const r = await markSentAction(proposalId);
      if (r.token) setToken(r.token);
      if (r.status) setStatus(r.status);
      router.refresh();
    });

  const preview = () =>
    start(async () => {
      const { token: t } = await shareLinkAction(proposalId);
      if (t) {
        setToken(t);
        window.open(`/p/${t}`, "_blank", "noopener");
      }
    });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy} disabled={pending}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Link copied" : "Copy client link"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={preview} disabled={pending}>
          <Eye />Preview as client
        </Button>
        {status === "draft" ? (
          <Button type="button" size="sm" onClick={markSent} disabled={pending}>
            <Send />Mark as sent
          </Button>
        ) : null}
      </div>
      <p role="status" className="text-muted-foreground min-h-4 text-xs">
        {error ?? (token ? "Anyone with the link can view this proposal." : "A private link is created the first time you copy or preview it.")}
      </p>
    </div>
  );
}
