import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Handshake, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import {
  CommitmentCard,
  type CommitmentCardCommitment,
} from "@/modules/commitments/components/commitment-card";
import { getTenantCommitmentBoard } from "@/server/services/commitments";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type CommitmentSectionProps = {
  commitments: CommitmentCardCommitment[];
  description: string;
  title: string;
};

function CommitmentSection({
  commitments,
  description,
  title,
}: CommitmentSectionProps) {
  if (commitments.length === 0) {
    return null;
  }

  return (
    <CockpitCard title={title} value={commitments.length}>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="grid gap-3">
        {commitments.map((commitment) => (
          <CommitmentCard commitment={commitment} key={commitment.id} />
        ))}
      </div>
    </CockpitCard>
  );
}

export default async function CommitmentsPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/commitments");
  }

  const board = await getTenantCommitmentBoard(context);
  const hasCommitments =
    board.overdue.length > 0 ||
    board.dueToday.length > 0 ||
    board.upcoming.length > 0 ||
    board.waiting.length > 0 ||
    board.openWithoutDue.length > 0 ||
    board.recentlyFulfilled.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/commitments/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              New commitment
            </Link>
          </Button>
        }
        description="Promises and obligations tracked separately from generic follow-up tasks."
        eyebrow="Ledger"
        title="Commitments"
      />

      {hasCommitments ? (
        <div className="grid gap-4">
          <CommitmentSection
            commitments={board.overdue}
            description="Open promises whose due date or due window has passed."
            title="Overdue"
          />
          <CommitmentSection
            commitments={board.dueToday}
            description="Commitments that need attention before the day ends."
            title="Due today"
          />
          <CommitmentSection
            commitments={board.upcoming}
            description="Future commitments with due dates or due windows."
            title="Upcoming"
          />
          <CommitmentSection
            commitments={board.waiting}
            description="Commitments currently waiting on another person or organisation."
            title="Waiting"
          />
          <CommitmentSection
            commitments={board.openWithoutDue}
            description="Open commitments without a due date yet."
            title="Open without due date"
          />
          <CommitmentSection
            commitments={board.recentlyFulfilled}
            description="Recently fulfilled commitments for quick review."
            title="Recently fulfilled"
          />
        </div>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/commitments/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Create commitment
              </Link>
            </Button>
          }
          description="Track promises from people, companies, meetings, and notes as a dedicated ledger."
          icon={Handshake}
          title="No commitments yet"
        />
      )}

      <CockpitCard title="Manual commitment workflow">
        <div className="flex gap-3 rounded-md border border-border bg-background p-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-5 text-primary"
          />
          <p className="text-sm leading-6 text-muted-foreground">
            This step stores user-entered commitments only. It does not parse
            notes, create tasks, send reminders, or run background jobs.
          </p>
        </div>
      </CockpitCard>
    </div>
  );
}
