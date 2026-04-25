import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit,
  FileText,
  ListChecks,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  archiveCommitmentAction,
  cancelCommitmentAction,
  fulfillCommitmentAction,
} from "@/modules/commitments/actions";
import { CommitmentActionButton } from "@/modules/commitments/components/commitment-action-button";
import { CommitmentBadges } from "@/modules/commitments/components/commitment-badges";
import {
  commitmentDueLabel,
  commitmentOwnerTypeLabel,
} from "@/modules/commitments/labels";
import { TaskBadges } from "@/modules/tasks/components/task-badges";
import { getTenantCommitmentProfile } from "@/server/services/commitments";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type CommitmentDetailPageProps = {
  params: Promise<{
    commitmentId: string;
  }>;
};

export default async function CommitmentDetailPage({
  params,
}: CommitmentDetailPageProps) {
  const [{ commitmentId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/commitments/${commitmentId}`);
  }

  const commitment = await getTenantCommitmentProfile(context, commitmentId);

  if (!commitment) {
    notFound();
  }

  const canFulfill =
    commitment.status !== "DONE" && commitment.status !== "CANCELLED";
  const canCancel =
    commitment.status !== "DONE" && commitment.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/commitments">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Commitments
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/commitments/${commitment.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description={commitmentDueLabel(commitment)}
        eyebrow="Commitment"
        title={commitment.title}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Ledger state">
          <div className="grid gap-3">
            <CommitmentBadges
              dueAt={commitment.dueAt}
              dueWindowEnd={commitment.dueWindowEnd}
              dueWindowStart={commitment.dueWindowStart}
              ownerType={commitment.ownerType}
              sensitivity={commitment.sensitivity}
              status={commitment.status}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Owner: {commitmentOwnerTypeLabel(commitment.ownerType)}
            </p>
          </div>
        </CockpitCard>

        <CockpitCard title="Linked context">
          <div className="flex flex-wrap gap-2">
            {commitment.ownerPerson ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${commitment.ownerPerson.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  Owner: {commitment.ownerPerson.displayName}
                </Link>
              </Badge>
            ) : null}
            {commitment.ownerCompany ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${commitment.ownerCompany.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  Owner: {commitment.ownerCompany.name}
                </Link>
              </Badge>
            ) : null}
            {commitment.counterpartyPerson ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${commitment.counterpartyPerson.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  With: {commitment.counterpartyPerson.displayName}
                </Link>
              </Badge>
            ) : null}
            {commitment.counterpartyCompany ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${commitment.counterpartyCompany.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  With: {commitment.counterpartyCompany.name}
                </Link>
              </Badge>
            ) : null}
            {commitment.meeting ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/meetings/${commitment.meeting.id}`}
                >
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  {commitment.meeting.title}
                </Link>
              </Badge>
            ) : null}
            {commitment.note ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/notes/${commitment.note.id}`}
                >
                  <FileText aria-hidden="true" className="size-3.5" />
                  {commitment.note.summary ?? `${commitment.note.noteType} note`}
                </Link>
              </Badge>
            ) : null}
            {!commitment.ownerPerson &&
            !commitment.ownerCompany &&
            !commitment.counterpartyPerson &&
            !commitment.counterpartyCompany &&
            !commitment.meeting &&
            !commitment.note ? (
              <Badge variant="secondary">No linked records</Badge>
            ) : null}
          </div>
        </CockpitCard>
      </section>

      {commitment.description ? (
        <CockpitCard title="Description">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {commitment.description}
          </p>
        </CockpitCard>
      ) : null}

      <CockpitCard title="Linked tasks" value={commitment.tasks.length}>
        {commitment.tasks.length > 0 ? (
          <div className="grid gap-3">
            {commitment.tasks.map((task) => (
              <article
                className="rounded-md border border-border bg-background p-3"
                key={task.id}
              >
                <div className="grid gap-2">
                  <Link
                    className="rounded-sm font-semibold text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/tasks/${task.id}`}
                  >
                    {task.title}
                  </Link>
                  <TaskBadges
                    dueAt={task.dueAt}
                    priority={task.priority}
                    status={task.status}
                    taskType={task.taskType}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button asChild>
                <Link href={`/tasks/new?commitmentId=${commitment.id}`}>
                  <ListChecks aria-hidden="true" className="mr-2 size-4" />
                  Create task
                </Link>
              </Button>
            }
            description="Tasks can reference this commitment, but no task is created automatically."
            icon={ListChecks}
            title="No linked tasks"
          />
        )}
      </CockpitCard>

      <div className="grid gap-3">
        {canFulfill ? (
          <CommitmentActionButton
            action={fulfillCommitmentAction.bind(null, commitment.id)}
            confirmLabel="Fulfil commitment"
            description="The commitment will be marked fulfilled. No tasks or linked records are changed."
            label="Fulfil"
            pendingLabel="Fulfilling"
            title="Fulfil this commitment?"
          />
        ) : null}

        {canCancel ? (
          <CommitmentActionButton
            action={cancelCommitmentAction.bind(null, commitment.id)}
            confirmLabel="Cancel commitment"
            description="The commitment will be marked cancelled. Linked records stay intact."
            label="Cancel"
            pendingLabel="Cancelling"
            title="Cancel this commitment?"
          />
        ) : null}

        <CommitmentActionButton
          action={archiveCommitmentAction.bind(null, commitment.id)}
          confirmLabel="Archive commitment"
          description="The commitment will be hidden from active ledger views. People, companies, meetings, notes, and tasks stay intact."
          label="Archive"
          pendingLabel="Archiving"
          title="Archive this commitment?"
        />
      </div>
    </div>
  );
}
