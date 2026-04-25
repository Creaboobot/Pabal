import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ListChecks, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import {
  TaskCard,
  type TaskCardTask,
} from "@/modules/tasks/components/task-card";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantTaskBoard } from "@/server/services/tasks";

export const dynamic = "force-dynamic";

type TaskSectionProps = {
  description: string;
  tasks: TaskCardTask[];
  title: string;
};

function TaskSection({ description, tasks, title }: TaskSectionProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <CockpitCard title={title} value={tasks.length}>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="grid gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
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

  const board = await getTenantTaskBoard(context);
  const hasTasks =
    board.overdue.length > 0 ||
    board.dueToday.length > 0 ||
    board.upcoming.length > 0 ||
    board.openWithoutDue.length > 0 ||
    board.recentlyCompleted.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/tasks/new">
              <Plus aria-hidden="true" className="mr-2 size-4" />
              New task
            </Link>
          </Button>
        }
        description="Manual follow-ups linked to the relationship context that explains why they matter."
        eyebrow="Follow-ups"
        title="Tasks"
      />

      {hasTasks ? (
        <div className="grid gap-4">
          <TaskSection
            description="Due dates that have passed and still need attention."
            tasks={board.overdue}
            title="Overdue"
          />
          <TaskSection
            description="Follow-ups due before the day ends."
            tasks={board.dueToday}
            title="Due today"
          />
          <TaskSection
            description="Future manual follow-ups with due dates."
            tasks={board.upcoming}
            title="Upcoming"
          />
          <TaskSection
            description="Open follow-ups without a due date yet."
            tasks={board.openWithoutDue}
            title="Open without due date"
          />
          <TaskSection
            description="Recently completed follow-ups for quick review."
            tasks={board.recentlyCompleted}
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
          description="Create a follow-up from a person, company, meeting, note, or directly here."
          icon={ListChecks}
          title="No tasks yet"
        />
      )}

      <CockpitCard title="Manual task workflow">
        <div className="flex gap-3 rounded-md border border-border bg-background p-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-5 text-primary"
          />
          <p className="text-sm leading-6 text-muted-foreground">
            This step stores user-entered follow-ups only. It does not parse
            notes, create AI recommendations, send reminders, or run background
            jobs.
          </p>
        </div>
      </CockpitCard>
    </div>
  );
}
