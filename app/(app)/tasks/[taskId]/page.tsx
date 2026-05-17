import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Edit,
  FileText,
  Handshake,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  archiveTaskAction,
  completeTaskAction,
  reopenTaskAction,
} from "@/modules/tasks/actions";
import { TaskActionButton } from "@/modules/tasks/components/task-action-button";
import { TaskBadges } from "@/modules/tasks/components/task-badges";
import { formatTaskDateTime, taskStatusLabel } from "@/modules/tasks/labels";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantTaskProfile } from "@/server/services/tasks";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const [{ taskId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/tasks/${taskId}`);
  }

  const task = await getTenantTaskProfile(context, taskId);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/tasks">
                <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
                Tasks
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/tasks/${task.id}/edit`}>
                <Edit aria-hidden="true" className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
        description={task.dueAt ? `Due ${formatTaskDateTime(task.dueAt)}` : "No due date"}
        eyebrow="Task"
        title={task.title}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <CockpitCard title="Follow-up state">
          <div className="grid gap-3">
            <TaskBadges
              dueAt={task.dueAt}
              priority={task.priority}
              status={task.status}
              taskType={task.taskType}
            />
            <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
              {task.reminderAt ? (
                <span>
                  Reminder {formatTaskDateTime(task.reminderAt)}
                </span>
              ) : null}
              {task.snoozedUntil ? (
                <span>
                  Snoozed until {formatTaskDateTime(task.snoozedUntil)}
                </span>
              ) : null}
              {task.completedAt ? (
                <span>
                  Completed {formatTaskDateTime(task.completedAt)}
                </span>
              ) : null}
              {!task.reminderAt && !task.snoozedUntil && !task.completedAt ? (
                <span>{taskStatusLabel(task.status)}</span>
              ) : null}
            </div>
          </div>
        </CockpitCard>

        <CockpitCard title="Linked context">
          <div className="flex flex-wrap gap-2">
            {task.person ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/${task.person.id}`}
                >
                  <UserRound aria-hidden="true" className="size-3.5" />
                  {task.person.displayName}
                </Link>
              </Badge>
            ) : null}
            {task.company ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/people/companies/${task.company.id}`}
                >
                  <Building2 aria-hidden="true" className="size-3.5" />
                  {task.company.name}
                </Link>
              </Badge>
            ) : null}
            {task.meeting ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/meetings/${task.meeting.id}`}
                >
                  <CalendarClock aria-hidden="true" className="size-3.5" />
                  {task.meeting.title}
                </Link>
              </Badge>
            ) : null}
            {task.note ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/notes/${task.note.id}`}
                >
                  <FileText aria-hidden="true" className="size-3.5" />
                  {task.note.summary ?? `${task.note.noteType} note`}
                </Link>
              </Badge>
            ) : null}
            {task.commitment ? (
              <Badge variant="outline">
                <Link
                  className="flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/commitments/${task.commitment.id}`}
                >
                  <Handshake aria-hidden="true" className="size-3.5" />
                  {task.commitment.title}
                </Link>
              </Badge>
            ) : null}
            {!task.person &&
            !task.company &&
            !task.meeting &&
            !task.note &&
            !task.commitment ? (
              <Badge variant="secondary">No linked records</Badge>
            ) : null}
          </div>
        </CockpitCard>
      </section>

      {task.description ? (
        <CockpitCard title="Description">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {task.description}
          </p>
        </CockpitCard>
      ) : null}

      {task.whyNowRationale ? (
        <CockpitCard title="Why now">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {task.whyNowRationale}
          </p>
        </CockpitCard>
      ) : null}

      <div className="grid gap-3">
        {task.status === "DONE" ? (
          <TaskActionButton
            action={reopenTaskAction.bind(null, task.id)}
            confirmLabel="Reopen task"
            description="The task will return to open follow-ups and the completion time will be cleared."
            label="Reopen"
            pendingLabel="Reopening"
            title="Reopen this task?"
          />
        ) : (
          <TaskActionButton
            action={completeTaskAction.bind(null, task.id)}
            confirmLabel="Complete task"
            description="The task will be marked done. No linked records are changed."
            label="Complete"
            pendingLabel="Completing"
            title="Complete this task?"
          />
        )}

        <TaskActionButton
          action={archiveTaskAction.bind(null, task.id)}
          confirmLabel="Archive task"
          description="The task will be hidden from active task views. Linked people, companies, meetings, notes, and commitments stay intact."
          label="Archive"
          pendingLabel="Archiving"
          title="Archive this task?"
        />
      </div>
    </div>
  );
}
