import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Copy, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionEditor } from "@/components/section-editor";
import { duplicateProposalAction, saveTemplateAction } from "./actions";
import { getProposal, listLibrary, listLineItems, listSections } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const proposal = Number.isInteger(id) && id > 0 ? await getProposal(id) : null;
  if (!proposal) notFound();
  const [sections, lines, library] = await Promise.all([listSections(proposal.id), listLineItems(proposal.id), listLibrary()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/proposals" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm">
          <ChevronLeft className="size-4" />Proposals
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{proposal.title}</h1>
          <Badge variant="neutral">{proposal.status}</Badge>
        </div>
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
      <SectionEditor
        proposalId={proposal.id}
        initial={sections}
        initialLines={lines}
        initialLibrary={library}
        currency={proposal.currency}
        initialTerms={{ discountBp: proposal.discountBp, taxRateBp: proposal.taxRateBp }}
      />
    </div>
  );
}
