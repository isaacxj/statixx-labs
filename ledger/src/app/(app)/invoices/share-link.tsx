"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shows the client link for a sent invoice with copy and open buttons. */
export function ShareLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is still selectable below.
    }
  }
  return (
    <section aria-labelledby="share-heading" className="bg-card rounded-card flex flex-col gap-3 border p-5">
      <h2 id="share-heading" className="text-base font-semibold">Client link</h2>
      <p className="text-muted-foreground text-13">Anyone with this link can view and print this invoice. No login needed.</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="bg-muted text-13 min-w-0 flex-1 truncate rounded-input px-3 py-2 font-mono">{path}</code>
        <Button variant="outline" onClick={copy} aria-live="polite">
          {copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="outline" asChild>
          <a href={`${path}?team=1`} target="_blank" rel="noreferrer"><ExternalLink />Open</a>
        </Button>
      </div>
    </section>
  );
}
