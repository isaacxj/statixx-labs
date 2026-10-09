import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Copy, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShareActions } from "@/components/share-actions";
import { ActivityTimeline } from "@/components/activity-timeline";
import { SectionEditor } from "@/components/section-editor";
import { duplicateProposalAction, saveTemplateAction } from "./actions";
import { getProposal, listEvents, listLibrary, listLineItems, listSections } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const proposal = Number.isInteger(id) && id > 0 ? await getProposal(id) : null;
  if (!proposal) notFound();
  const [sections, lines, library, events] = await Promise.all([listSections(proposal.id), listLineItems(proposal.id), listLibrary(), listEvents(proposal.id)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/proposals" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm">
          <ChevronLeft className="size-4" />Proposals
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{proposal.title}</h1>
          <Badge variant={proposal.status === "draft" ? "neutral" : proposal.status === "viewed" ? "warning" : proposal.status === "accepted" ? "success" : proposal.status === "declined" ? "danger" : "info"}>{proposal.status}</Badge>
        </div>
        <ShareActions proposalId={proposal.id} initialToken={proposal.shareToken} initialStatus={proposal.status} />
        <div className="flex flex-wrap items-center gap-2">
          <form action={duplicateProposalAction}>
            <input type="hidden" name="proposalId" value={proposal.id} />
            <Button type="submit" size="sm" variant="outline"><Copy />Duplicate</Button>
          </form>
          <form action={saveTemplateAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <Input name="name" defaultValue={proposal.title} aria-label="Template name" className="h-8 w-64 max-md:h-11 max-md:w-full" />
            <Button type="submit" size="sm" variant="outline"><LayoutTemplate />Save as template</Button>
          </form>
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="tabular font-mono text-[13px]">{proposal.number}</span> · {proposal.clientName}
          {proposal.clientCompany ? ` · ${proposal.clientCompany}` : ""} · {proposal.businessName}
        </p>
      </div>
      {proposal.status === "accepted" ? (
        <p role="status" className="bg-success/10 text-success rounded-lg border p-3 text-sm">
          Accepted{proposal.acceptedByName ? ` by ${proposal.acceptedByName}` : ""}. This proposal is locked and can&apos;t be edited.
        </p>
      ) : null}
      <fieldset disabled={proposal.status === "accepted"} className="contents">
      <SectionEditor
        proposalId={proposal.id}
        initial={sections}
        initialLines={lines}
        initialLibrary={library}
        currency={proposal.currency}
        initialTerms={{ discountBp: proposal.discountBp, taxRateBp: proposal.taxRateBp }}
      />
      </fieldset>
      <ActivityTimeline events={events} viewCount={proposal.viewCount} />
    </div>
  );
}
