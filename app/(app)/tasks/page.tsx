import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  ListChecks,
  Plus,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { ActionItemCard } from "@/modules/tasks/components/action-item-card";
import type { ActionBoardItem } from "@/server/services/action-board";
import { getTenantActionBoard } from "@/server/services/action-board";
import { getCurrentUserContext } from "@/server/services/session";

export const dynamic = "force-dynamic";

type ActionSectionProps = {
  description: string;
  items: ActionBoardItem[];
  title: string;
};

function ActionSection({ description, items, title }: ActionSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <CockpitCard title={title} value={items.length}>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="grid gap-3">
        {items.map((item) => (
          <ActionItemCard item={item} key={`${item.sourceType}:${item.id}`} />
        ))}
      </div>
    </CockpitCard>
  );
}

export default async function TasksPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/sign-in?callbackUrl=/tasks");
  }

  const board = await getTenantActionBoard(context);
  const hasTasks =
    board.needsAttention.length > 0 ||
    board.upcoming.length > 0 ||
    board.waiting.length > 0 ||
    board.openWithoutDate.length > 0 ||
    board.recentlyCompleted.length > 0;

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
        description="The unified action area for follow-ups and commitments linked to relationship context."
        eyebrow="Follow-ups"
        title="Tasks"
      />

      {hasTasks ? (
        <div className="grid gap-4">
          <ActionSection
            description="Overdue and due-today work across tasks and commitments."
            items={board.needsAttention}
            title="Needs attention"
          />
          <ActionSection
            description="Future follow-ups and commitments with due dates or due windows."
            items={board.upcoming}
            title="Upcoming"
          />
          <ActionSection
            description="Commitments currently waiting on another person or organisation."
            items={board.waiting}
            title="Waiting"
          />
          <ActionSection
            description="Open follow-ups and commitments without a due date or due window."
            items={board.openWithoutDate}
            title="Open without due date"
          />
          <ActionSection
            description="Recently completed tasks and fulfilled commitments for quick review."
            items={board.recentlyCompleted}
            title="Recently completed"
          />
        </div>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/tasks/new">
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Create task
              </Link>
            </Button>
          }
          description="Create a follow-up task or commitment from relationship context, or start directly here."
          icon={ListChecks}
          title="No action items yet"
        />
      )}

      <CockpitCard title="Action boundaries">
        <div className="grid gap-3">
          <div className="flex gap-3 rounded-md border border-border bg-background p-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 text-primary"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              This page combines existing tasks and commitments for review
              only. It does not create tasks from commitments, send reminders,
              or run background jobs.
            </p>
          </div>
          <Button asChild className="w-fit" size="sm" variant="outline">
            <Link href="/commitments">
              Open commitment ledger
              <ArrowRight aria-hidden="true" className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </CockpitCard>
    </div>
  );
}
