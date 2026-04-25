import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { CockpitCard } from "@/components/cards/cockpit-card";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { getCurrentUserContext } from "@/server/services/session";
import { getTenantTaskFormOptions } from "@/server/services/task-form-options";
import { getTenantTaskProfile } from "@/server/services/tasks";

export const dynamic = "force-dynamic";

type EditTaskPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const [{ taskId }, context] = await Promise.all([
    params,
    getCurrentUserContext(),
  ]);

  if (!context) {
    redirect(`/sign-in?callbackUrl=/tasks/${taskId}/edit`);
  }

  const [task, options] = await Promise.all([
    getTenantTaskProfile(context, taskId),
    getTenantTaskFormOptions(context),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Edit the manual follow-up details without changing linked records."
        eyebrow="Task"
        title={task.title}
      />

      <CockpitCard title="Task details">
        <TaskForm
          initialValues={{
            commitmentId: task.commitmentId,
            companyId: task.companyId,
            description: task.description,
            dueAt: task.dueAt,
            introductionSuggestionId: task.introductionSuggestionId,
            meetingId: task.meetingId,
            noteId: task.noteId,
            personId: task.personId,
            priority: task.priority,
            reminderAt: task.reminderAt,
            snoozedUntil: task.snoozedUntil,
            status: task.status,
            taskType: task.taskType,
            title: task.title,
            whyNowRationale: task.whyNowRationale,
          }}
          mode="edit"
          options={options}
          taskId={task.id}
        />
      </CockpitCard>
    </div>
  );
}
