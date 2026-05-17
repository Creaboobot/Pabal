import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  ListChecks,
  Plus,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RelationshipAttentionBoard } from "@/modules/relationship-health/components/relationship-attention-board";
import { ActionItemCard } from "@/modules/tasks/components/action-item-card";
import { getTenantActionBoard } from "@/server/services/action-board";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getTenantAIProposalReviewSummary } from "@/server/services/ai-proposals";
import { getTenantRelationshipAttentionBoard } from "@/server/services/relationship-health";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type TodayPrimaryCardProps = {
  actionLabel: string;
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
  value: number;
};

function TodayPrimaryCard({
  actionLabel,
  description,
  href,
  icon: Icon,
  title,
  value,
}: TodayPrimaryCardProps) {
  return (
    <CockpitCard className="border-primary/20" title={title} value={value}>
      <div className="grid gap-4">
        <div className="flex gap-3">
          <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Button asChild className="w-fit" size="sm" variant="outline">
          <Link href={href}>
            {actionLabel}
            <ArrowRight aria-hidden="true" className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </CockpitCard>
  );
}

export default async function TodayPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/today");
  }

  const [
    summary,
    actionBoard,
    proposalReviewSummary,
    relationshipAttention,
  ] = await Promise.all([
    getAppShellSummary(context),
    getTenantActionBoard(context),
    getTenantAIProposalReviewSummary(context),
    getTenantRelationshipAttentionBoard(context),
  ]);
  const actionPreview = [
    ...actionBoard.needsAttention,
    ...actionBoard.upcoming,
    ...actionBoard.waiting,
    ...actionBoard.openWithoutDate,
  ].slice(0, 3);
  const hasProposalAttention =
    proposalReviewSummary.pendingProposals > 0 ||
    proposalReviewSummary.itemsNeedingClarification > 0;
  const relationshipAttentionCount = relationshipAttention.items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/tasks/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                New task
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/meetings/new">
                <CalendarClock aria-hidden="true" className="mr-2 size-4" />
                New meeting
              </Link>
            </Button>
          </div>
        }
        description="Start with the work that needs attention: tasks, meetings, and relationship signals."
        eyebrow="Daily cockpit"
        title="Today"
      />

      <section
        aria-label="Primary Today areas"
        className="grid gap-3 lg:grid-cols-3"
      >
        <TodayPrimaryCard
          actionLabel="Review tasks"
          description="Your unified action list for follow-ups, commitments, and relationship work."
          href="/tasks"
          icon={ListChecks}
          title="Tasks"
          value={actionBoard.totals.openActionItems}
        />
        <TodayPrimaryCard
          actionLabel="Review meetings"
          description="Upcoming conversations and source-linked preparation context."
          href="/meetings"
          icon={CalendarClock}
          title="Meetings"
          value={summary.action.upcomingMeetings}
        />
        <TodayPrimaryCard
          actionLabel="Review signals"
          description="Deterministic context that explains which relationships may need attention."
          href="#relationship-attention"
          icon={UsersRound}
          title="Relationship attention"
          value={relationshipAttentionCount}
        />
      </section>

      <section aria-label="Secondary review queues" className="grid gap-3">
        <CockpitCard
          title="Suggested updates"
          value={proposalReviewSummary.pendingProposals}
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Review AI-structured findings before they become part of your
              relationship workflow. Approval is status-only.
            </p>
            <div className="flex flex-wrap gap-2">
              {hasProposalAttention ? (
                <Badge variant="secondary">
                  {proposalReviewSummary.itemsNeedingClarification} needing
                  clarification
                </Badge>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/proposals">
                  <Sparkles aria-hidden="true" className="mr-2 size-4" />
                  Review suggested updates
                </Link>
              </Button>
            </div>
          </div>
        </CockpitCard>
      </section>

      <section aria-label="Today details" className="grid gap-3">
        <CockpitCard
          title="Unified action attention"
          value={actionPreview.length}
        >
          {actionPreview.length > 0 ? (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Top due, upcoming, waiting, or undated action items. Use Tasks
                for the full unified action area.
              </p>
              <div className="grid gap-3">
                {actionPreview.map((item) => (
                  <ActionItemCard
                    compact
                    item={item}
                    key={`${item.sourceType}:${item.id}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="w-fit" size="sm" variant="outline">
                  <Link href="/tasks">View all tasks</Link>
                </Button>
                <Button asChild className="w-fit" size="sm" variant="ghost">
                  <Link href="/commitments">Commitment ledger</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No action items need attention. New follow-ups can be added from
              the task area.
            </p>
          )}
        </CockpitCard>
      </section>

      <section id="relationship-attention">
        <RelationshipAttentionBoard items={relationshipAttention.items} />
      </section>
    </div>
  );
}
