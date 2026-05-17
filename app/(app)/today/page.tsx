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
import type { CommitmentCardCommitment } from "@/modules/commitments/components/commitment-card";
import { RelationshipAttentionBoard } from "@/modules/relationship-health/components/relationship-attention-board";
import type { TaskCardTask } from "@/modules/tasks/components/task-card";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getTenantAIProposalReviewSummary } from "@/server/services/ai-proposals";
import { getTenantCommitmentBoard } from "@/server/services/commitments";
import { getTenantRelationshipAttentionBoard } from "@/server/services/relationship-health";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantTaskBoard } from "@/server/services/tasks";

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

function PriorityTaskList({ tasks }: { tasks: TaskCardTask[] }) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-2">
      {tasks.map((task) => (
        <li
          className="rounded-md border border-border bg-background p-3"
          key={task.id}
        >
          <Link
            className="rounded-sm text-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/tasks/${task.id}`}
          >
            {task.title}
          </Link>
          {task.dueAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Due{" "}
              {task.dueAt.toLocaleDateString("en", {
                day: "numeric",
                month: "short",
              })}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function PriorityCommitmentList({
  commitments,
}: {
  commitments: CommitmentCardCommitment[];
}) {
  if (commitments.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-2">
      {commitments.map((commitment) => (
        <li
          className="rounded-md border border-border bg-background p-3"
          key={commitment.id}
        >
          <Link
            className="rounded-sm text-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            href={`/commitments/${commitment.id}`}
          >
            {commitment.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Commitment context
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function TodayPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/today");
  }

  const [
    summary,
    taskBoard,
    commitmentBoard,
    proposalReviewSummary,
    relationshipAttention,
  ] = await Promise.all([
    getAppShellSummary(context),
    getTenantTaskBoard(context),
    getTenantCommitmentBoard(context),
    getTenantAIProposalReviewSummary(context),
    getTenantRelationshipAttentionBoard(context),
  ]);
  const priorityTasks = [
    ...taskBoard.overdue,
    ...taskBoard.dueToday,
    ...taskBoard.upcoming,
  ].slice(0, 3);
  const priorityCommitments = [
    ...commitmentBoard.overdue,
    ...commitmentBoard.dueToday,
    ...commitmentBoard.upcoming,
    ...commitmentBoard.waiting,
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
          description="Your primary action list for follow-ups and relationship work."
          href="/tasks"
          icon={ListChecks}
          title="Tasks"
          value={summary.action.openTasks}
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

      <section
        aria-label="Secondary review queues"
        className="grid gap-3 lg:grid-cols-2"
      >
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

        <CockpitCard
          title="Commitment context"
          value={summary.action.openCommitments}
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Commitments remain available as tracked promises and obligations,
              but tasks are the main action list.
            </p>
            <Button asChild className="w-fit" size="sm" variant="outline">
              <Link href="/commitments">
                View commitments
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CockpitCard>
      </section>

      <section aria-label="Today details" className="grid gap-3 lg:grid-cols-2">
        <CockpitCard title="Task attention" value={priorityTasks.length}>
          {priorityTasks.length > 0 ? (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Top due or upcoming tasks. Use the full task view for grouping
                and completed items.
              </p>
              <PriorityTaskList tasks={priorityTasks} />
              <Button asChild className="w-fit" size="sm" variant="outline">
                <Link href="/tasks">View all tasks</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No urgent task attention. New follow-ups can be added from the
              task area.
            </p>
          )}
        </CockpitCard>

        <CockpitCard
          title="Commitment reminders"
          value={priorityCommitments.length}
        >
          {priorityCommitments.length > 0 ? (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Promises and obligations remain visible without competing with
                the task workflow.
              </p>
              <PriorityCommitmentList commitments={priorityCommitments} />
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No commitment reminders need attention.
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
