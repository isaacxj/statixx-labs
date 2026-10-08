import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionEditor } from "@/components/section-editor";
import { getProposal, listSections } from "@/server/db/queries";

export const dynamic = "force-dynamic";

export default async function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const proposal = Number.isInteger(id) && id > 0 ? await getProposal(id) : null;
  if (!proposal) notFound();
  const sections = await listSections(proposal.id);

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
        <p className="text-muted-foreground text-sm">
          <span className="tabular font-mono text-[13px]">{proposal.number}</span> · {proposal.clientName}
          {proposal.clientCompany ? ` · ${proposal.clientCompany}` : ""} · {proposal.businessName}
        </p>
      </div>
      <SectionEditor proposalId={proposal.id} initial={sections} />
    </div>
  );
}
