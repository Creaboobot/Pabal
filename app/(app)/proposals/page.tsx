import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import {
  ProposalCard,
  type ProposalCardProposal,
} from "@/modules/proposals/components/proposal-card";
import { listTenantAIProposals } from "@/server/services/ai-proposals";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type ProposalSectionProps = {
  description: string;
  proposals: ProposalCardProposal[];
  title: string;
};

function ProposalSection({
  description,
  proposals,
  title,
}: ProposalSectionProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <CockpitCard title={title} value={proposals.length}>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="grid gap-3">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>
    </CockpitCard>
  );
}

export default async function ProposalsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/proposals");
  }

  const proposals = await listTenantAIProposals(context);
  const pending = proposals.filter(
    (proposal) => proposal.status === "PENDING_REVIEW",
  );
  const inReview = proposals.filter(
    (proposal) => proposal.status === "IN_REVIEW",
  );
  const reviewed = proposals.filter((proposal) =>
    ["APPROVED", "PARTIALLY_APPROVED", "REJECTED"].includes(proposal.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review stored AI proposal records without generating, applying, or mutating target records."
        eyebrow="Human review"
        title="Proposals"
      />

      {proposals.length > 0 ? (
        <div className="grid gap-4">
          <CockpitCard title="Review boundary">
            <p className="text-sm leading-6 text-muted-foreground">
              Approval means the item is conceptually accepted. Step 9 does not
              apply patches, create records, call AI providers, or change target
              records.
            </p>
          </CockpitCard>
          <ProposalSection
            description="Proposal containers and items waiting for review."
            proposals={pending}
            title="Pending review"
          />
          <ProposalSection
            description="Proposals with at least one reviewed or unclear item."
            proposals={inReview}
            title="In review"
          />
          <ProposalSection
            description="Reviewed proposal records retained for auditability."
            proposals={reviewed}
            title="Reviewed"
          />
        </div>
      ) : (
        <EmptyState
          action={
            <Button asChild variant="outline">
              <Link href="/today">Back to Today</Link>
            </Button>
          }
          description="Seed demo data to preview the proposal confirmation framework. This step does not generate proposals."
          icon={Sparkles}
          title="No proposals to review"
        />
      )}
    </div>
  );
}
