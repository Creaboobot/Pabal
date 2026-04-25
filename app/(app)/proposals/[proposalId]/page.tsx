import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Mic,
  NotebookText,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approveAllPendingProposalItemsAction,
  approveProposalItemAction,
  clarifyProposalItemAction,
  dismissProposalAction,
  rejectAllPendingProposalItemsAction,
  rejectProposalItemAction,
} from "@/modules/proposals/actions";
import {
  ConfidenceBadge,
  ProposalStatusBadge,
  ProposalTypeBadge,
} from "@/modules/proposals/components/proposal-badges";
import { ProposalActionButton } from "@/modules/proposals/components/proposal-action-button";
import { ProposalItemCard } from "@/modules/proposals/components/proposal-item-card";
import { sourceEntityTypeLabel } from "@/modules/proposals/labels";
import { getTenantAIProposalProfile } from "@/server/services/ai-proposals";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type ProposalDetailPageProps = {
  params: Promise<{
    proposalId: string;
  }>;
};

export default async function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const [{ proposalId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/proposals/${proposalId}`);
  }

  const proposal = await getTenantAIProposalProfile(context, proposalId);

  if (!proposal) {
    notFound();
  }

  const pendingItems = proposal.items.filter(
    (item) => item.status === "PENDING_REVIEW",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/proposals">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Proposals
              </Link>
            </Button>
          </div>
        }
        description={proposal.summary ?? "Review stored proposal items."}
        eyebrow="Proposal review"
        title={proposal.title}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Review state">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <ProposalStatusBadge status={proposal.status} />
              <ProposalTypeBadge proposalType={proposal.proposalType} />
              <ConfidenceBadge confidence={proposal.confidence} />
              <Badge variant="outline">{proposal.items.length} items</Badge>
            </div>
            <p className="rounded-md border border-border bg-muted p-3 text-sm leading-6 text-muted-foreground">
              Approval is status-only in Step 9. It does not apply patches,
              create records, call AI providers, or mutate target records.
            </p>
          </div>
        </CockpitCard>

        <CockpitCard title="Target context">
          {proposal.targetContext ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  proposal.targetContext.available ? "outline" : "secondary"
                }
              >
                {sourceEntityTypeLabel(proposal.targetContext.entityType)}
              </Badge>
              {proposal.targetContext.href ? (
                <Link
                  className="rounded-sm text-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  href={proposal.targetContext.href}
                >
                  {proposal.targetContext.label}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {proposal.targetContext.label}
                </span>
              )}
            </div>
          ) : (
            <Badge variant="secondary">No proposal-level target</Badge>
          )}
        </CockpitCard>
      </section>

      <CockpitCard title="Source context">
        <div className="flex flex-wrap gap-2">
          {proposal.sourceNote ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/notes/${proposal.sourceNote.id}`}
              >
                <FileText aria-hidden="true" className="size-3.5" />
                {proposal.sourceNote.summary ??
                  `${proposal.sourceNote.noteType} note`}
              </Link>
            </Badge>
          ) : null}
          {proposal.sourceMeeting ? (
            <Badge variant="outline">
              <Link
                className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/meetings/${proposal.sourceMeeting.id}`}
              >
                <NotebookText aria-hidden="true" className="size-3.5" />
                {proposal.sourceMeeting.title}
              </Link>
            </Badge>
          ) : null}
          {proposal.sourceVoiceNote ? (
            <Badge variant="outline">
              <span className="flex items-center gap-1">
                <Mic aria-hidden="true" className="size-3.5" />
                {proposal.sourceVoiceNote.title ??
                  `${proposal.sourceVoiceNote.status} voice note`}
              </span>
            </Badge>
          ) : null}
          {proposal.sourceReferences.map((sourceReference) => (
            <Badge key={sourceReference.id} variant="outline">
              {sourceEntityTypeLabel(sourceReference.sourceEntityType)}
              {sourceReference.label ? `: ${sourceReference.label}` : null}
            </Badge>
          ))}
          {!proposal.sourceNote &&
          !proposal.sourceMeeting &&
          !proposal.sourceVoiceNote &&
          proposal.sourceReferences.length === 0 ? (
            <Badge variant="secondary">No source context</Badge>
          ) : null}
        </div>
      </CockpitCard>

      {proposal.explanation ? (
        <CockpitCard title="Explanation">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {proposal.explanation}
          </p>
        </CockpitCard>
      ) : null}

      {pendingItems.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <ProposalActionButton
            action={approveAllPendingProposalItemsAction.bind(
              null,
              proposal.id,
            )}
            confirmLabel="Approve pending"
            description="Every pending item will be marked conceptually approved. No target records will be changed."
            label="Approve all pending"
            pendingLabel="Approving"
            title="Approve all pending items?"
          />
          <ProposalActionButton
            action={rejectAllPendingProposalItemsAction.bind(null, proposal.id)}
            confirmLabel="Reject pending"
            description="Every pending item will be marked rejected. No target records will be changed."
            label="Reject all pending"
            pendingLabel="Rejecting"
            title="Reject all pending items?"
            variant="outline"
          />
          <ProposalActionButton
            action={dismissProposalAction.bind(null, proposal.id)}
            confirmLabel="Dismiss proposal"
            description="The proposal will be hidden from active review lists. Items and target records stay unchanged."
            label="Dismiss"
            pendingLabel="Dismissing"
            title="Dismiss this proposal?"
            variant="ghost"
          />
        </section>
      ) : (
        <ProposalActionButton
          action={dismissProposalAction.bind(null, proposal.id)}
          confirmLabel="Dismiss proposal"
          description="The proposal will be hidden from active review lists. Items and target records stay unchanged."
          label="Dismiss proposal"
          pendingLabel="Dismissing"
          title="Dismiss this proposal?"
          variant="outline"
        />
      )}

      <section aria-label="Proposal items" className="grid gap-3">
        {proposal.items.map((item) => (
          <ProposalItemCard
            approveAction={approveProposalItemAction.bind(
              null,
              proposal.id,
              item.id,
            )}
            clarifyAction={clarifyProposalItemAction.bind(
              null,
              proposal.id,
              item.id,
            )}
            item={item}
            key={item.id}
            rejectAction={rejectProposalItemAction.bind(
              null,
              proposal.id,
              item.id,
            )}
            targetContext={proposal.itemTargetContexts[item.id] ?? null}
          />
        ))}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <CockpitCard title="Accepted means reviewed">
          <div className="flex gap-3 rounded-md border border-border bg-background p-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 text-primary"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Approved items are recorded as conceptually valid, ready for a
              later explicit application engine.
            </p>
          </div>
        </CockpitCard>
        <CockpitCard title="No mutation path">
          <div className="flex gap-3 rounded-md border border-border bg-background p-3">
            <XCircle
              aria-hidden="true"
              className="mt-0.5 size-5 text-primary"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              This screen cannot update people, companies, meetings, notes,
              tasks, commitments, needs, capabilities, or suggestions.
            </p>
          </div>
        </CockpitCard>
      </div>
    </div>
  );
}
