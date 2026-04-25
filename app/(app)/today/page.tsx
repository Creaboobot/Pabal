import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Handshake,
  ListChecks,
  Plus,
  Sparkles,
} from "lucide-react";

import { CockpitCard } from "@/components/cards/cockpit-card";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import {
  CommitmentCard,
  type CommitmentCardCommitment,
} from "@/modules/commitments/components/commitment-card";
import { getTenantAIProposalReviewSummary } from "@/server/services/ai-proposals";
import {
  TaskCard,
  type TaskCardTask,
} from "@/modules/tasks/components/task-card";
import { getAppShellSummary } from "@/server/services/app-shell-summary";
import { getTenantCommitmentBoard } from "@/server/services/commitments";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantTaskBoard } from "@/server/services/tasks";

export const dynamic = "force-dynamic";

type TodayTaskSectionProps = {
  description: string;
  tasks: TaskCardTask[];
  title: string;
};

function TodayTaskSection({
  description,
  tasks,
  title,
}: TodayTaskSectionProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <CockpitCard title={title} value={tasks.length}>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="grid gap-3">
        {tasks.slice(0, 3).map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </CockpitCard>
  );
}

type TodayCommitmentSectionProps = {
  commitments: CommitmentCardCommitment[];
  description: string;
  title: string;
};

function TodayCommitmentSection({
  commitments,
  description,
  title,
}: TodayCommitmentSectionProps) {
  if (commitments.length === 0) {
    return null;
  }

  return (
    <CockpitCard title={title} value={commitments.length}>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="grid gap-3">
        {commitments.slice(0, 3).map((commitment) => (
          <CommitmentCard commitment={commitment} key={commitment.id} />
        ))}
      </div>
    </CockpitCard>
  );
}

export default async function TodayPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/today");
  }

  const [summary, taskBoard, commitmentBoard, proposalReviewSummary] =
    await Promise.all([
      getAppShellSummary(context),
      getTenantTaskBoard(context),
      getTenantCommitmentBoard(context),
      getTenantAIProposalReviewSummary(context),
    ]);
  const hasDailySignals =
    summary.action.openTasks > 0 ||
    summary.action.openCommitments > 0 ||
    summary.action.upcomingMeetings > 0 ||
    summary.action.pendingProposals > 0 ||
    summary.opportunities.introductionSuggestions > 0;
  const hasTaskSections =
    taskBoard.overdue.length > 0 ||
    taskBoard.dueToday.length > 0 ||
    taskBoard.upcoming.length > 0 ||
    taskBoard.recentlyCompleted.length > 0;
  const hasCommitmentSections =
    commitmentBoard.overdue.length > 0 ||
    commitmentBoard.dueToday.length > 0 ||
    commitmentBoard.upcoming.length > 0 ||
    commitmentBoard.waiting.length > 0 ||
    commitmentBoard.recentlyFulfilled.length > 0;
  const hasProposalAttention =
    proposalReviewSummary.pendingProposals > 0 ||
    proposalReviewSummary.itemsNeedingClarification > 0;

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
              <Link href="/commitments/new">
                <Handshake aria-hidden="true" className="mr-2 size-4" />
                New commitment
              </Link>
            </Button>
          </div>
        }
        description="A quiet command center for follow-ups, commitments, preparation cues, and relationship opportunities."
        eyebrow="Daily cockpit"
        title="Today"
      />

      <section
        aria-label="Daily signals"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <CockpitCard
          eyebrow="Follow-ups"
          title="Open tasks"
          value={summary.action.openTasks}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Relationship actions waiting for attention.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Ledger"
          title="Open commitments"
          value={summary.action.openCommitments}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Promises and obligations tracked separately from tasks.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Prep"
          title="Upcoming meetings"
          value={summary.action.upcomingMeetings}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            Meeting memory prepared for upcoming conversations.
          </p>
        </CockpitCard>
        <CockpitCard
          eyebrow="Review"
          title="Pending proposals"
          value={summary.action.pendingProposals}
        >
          <p className="text-sm leading-6 text-muted-foreground">
            AI-readiness records waiting for explicit review.
          </p>
        </CockpitCard>
      </section>

      {hasTaskSections ? (
        <section aria-label="Today task sections" className="grid gap-3">
          <TodayTaskSection
            description="Open follow-ups with due dates before now."
            tasks={taskBoard.overdue}
            title="Overdue tasks"
          />
          <TodayTaskSection
            description="Manual follow-ups due before the day ends."
            tasks={taskBoard.dueToday}
            title="Due today"
          />
          <TodayTaskSection
            description="Future follow-ups with due dates."
            tasks={taskBoard.upcoming}
            title="Upcoming tasks"
          />
          <TodayTaskSection
            description="Recently finished follow-ups for quick review."
            tasks={taskBoard.recentlyCompleted}
            title="Recently completed"
          />
        </section>
      ) : (
        <CockpitCard title="Follow-up tasks">
          <EmptyState
            action={
              <Button asChild>
                <Link href="/tasks/new">
                  <Plus aria-hidden="true" className="mr-2 size-4" />
                  Create follow-up
                </Link>
              </Button>
            }
            description="Manual tasks due today, overdue, and upcoming will appear here."
            icon={ListChecks}
            title="No task attention needed"
          />
        </CockpitCard>
      )}

      {hasProposalAttention ? (
        <CockpitCard
          title="Proposal review"
          value={proposalReviewSummary.pendingProposals}
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Stored proposal records are waiting for human review. Approval is
              status-only and does not apply patches.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {proposalReviewSummary.itemsNeedingClarification} needing
                clarification
              </Badge>
              <Button asChild variant="outline">
                <Link href="/proposals">
                  <Sparkles aria-hidden="true" className="mr-2 size-4" />
                  Review proposals
                </Link>
              </Button>
            </div>
          </div>
        </CockpitCard>
      ) : null}

      {hasCommitmentSections ? (
        <section
          aria-label="Today commitment sections"
          className="grid gap-3"
        >
          <TodayCommitmentSection
            commitments={commitmentBoard.overdue}
            description="Open commitments with due dates or windows before now."
            title="Overdue commitments"
          />
          <TodayCommitmentSection
            commitments={commitmentBoard.dueToday}
            description="Manual commitments due before the day ends."
            title="Due today commitments"
          />
          <TodayCommitmentSection
            commitments={commitmentBoard.upcoming}
            description="Future promises and obligations with due dates."
            title="Upcoming commitments"
          />
          <TodayCommitmentSection
            commitments={commitmentBoard.waiting}
            description="Commitments waiting on another person or organisation."
            title="Waiting commitments"
          />
          <TodayCommitmentSection
            commitments={commitmentBoard.recentlyFulfilled}
            description="Recently fulfilled commitments for quick review."
            title="Recently fulfilled"
          />
        </section>
      ) : (
        <CockpitCard title="Commitment ledger">
          <EmptyState
            action={
              <Button asChild>
                <Link href="/commitments/new">
                  <Handshake aria-hidden="true" className="mr-2 size-4" />
                  Create commitment
                </Link>
              </Button>
            }
            description="Manual commitments due today, overdue, and upcoming will appear here."
            icon={Handshake}
            title="No commitment attention needed"
          />
        </CockpitCard>
      )}

      {hasDailySignals ? (
        <section
          aria-label="Today board"
          className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <CockpitCard title="Why now">
            <div className="grid gap-3">
              <div className="flex gap-3 rounded-md border border-border bg-background p-3">
                <ListChecks
                  aria-hidden="true"
                  className="mt-0.5 size-5 text-primary"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Follow-up attention
                    </h2>
                    <Badge variant="secondary">
                      {summary.action.openTasks} open
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Task timing, commitment source, and relationship context
                    stay visible together.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-border bg-background p-3">
                <Handshake
                  aria-hidden="true"
                  className="mt-0.5 size-5 text-primary"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Introduction readiness
                    </h2>
                    <Badge variant="outline">
                      {summary.opportunities.introductionSuggestions} suggested
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Suggested introductions stay read-only in this shell.
                  </p>
                </div>
              </div>
            </div>
          </CockpitCard>

          <CockpitCard title="Meeting preparation">
            <div className="flex gap-3 rounded-md border border-border bg-background p-3">
              <CalendarClock
                aria-hidden="true"
                className="mt-0.5 size-5 text-primary"
              />
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Next conversations
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Preparation context stays source-linked and sensitive-context
                  aware.
                </p>
              </div>
            </div>
          </CockpitCard>
        </section>
      ) : (
        <EmptyState
          description="Seed demo data to preview the daily cockpit."
          icon={Sparkles}
          title="No daily signals yet"
        />
      )}
    </div>
  );
}
